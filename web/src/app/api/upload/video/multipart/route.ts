/**
 * POST /api/upload/video/multipart?phase=create|part|complete|abort
 *
 * Chunked (R2 multipart) video upload. The browser slices the file into fixed
 * ~50 MB parts and uploads each through the Worker; R2 stitches them back into a
 * single object. This sidesteps the Worker's ~100 MB request-body limit (each
 * PART is well under it) so a course video can be up to 2 GB, using only the
 * existing R2 binding — no S3 API credentials required.
 *
 *   create   JSON {operator_slug, course_slug, module_id, block_id, content_type, size}
 *              → {key, uploadId}
 *   part     ?key&uploadId&part&operator_slug   body = raw chunk bytes
 *              → {partNumber, etag}
 *   complete JSON {…ids, key, uploadId, parts:[{partNumber,etag}]}  → attaches to block
 *   abort    JSON {operator_slug, key, uploadId}  → discards the pending upload
 *
 * R2 requires every part except the last to be the same size (≥5 MB); the client
 * guarantees this by slicing at a fixed CHUNK size.
 */
import { db } from "@/lib/db";
import { requireOperatorMembership } from "@/lib/roles";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const MAX_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB hard cap
const EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/ogg": "ogv",
};

function errStatus(msg: string): number {
  return msg === "unauthorised" ? 401 : msg === "forbidden" ? 403 : msg === "not_found" ? 404 : 500;
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const phase = url.searchParams.get("phase");
  const { env } = getCloudflareContext();

  try {
    // ---- create: open a multipart upload, return its id + object key ----
    if (phase === "create") {
      const b = (await req.json()) as {
        operator_slug?: string;
        module_id?: string;
        block_id?: string;
        content_type?: string;
        size?: number;
      };
      if (!b.operator_slug || !b.module_id || !b.block_id) {
        return new Response("missing required fields", { status: 400 });
      }
      if (typeof b.size === "number" && b.size > MAX_BYTES) {
        return new Response("file exceeds 2 GB limit", { status: 413 });
      }
      const ext = EXT[b.content_type ?? ""];
      if (!ext) return new Response(`unsupported type: ${b.content_type}`, { status: 415 });

      await requireOperatorMembership(b.operator_slug);
      const row = await db()
        .prepare(
          `SELECT cb.id, m.course_id FROM content_blocks cb
           JOIN modules m ON m.id = cb.module_id
           WHERE cb.id = ? AND cb.module_id = ?`,
        )
        .bind(b.block_id, b.module_id)
        .first<{ id: string; course_id: string }>();
      if (!row) return new Response("block not found", { status: 404 });

      const key = `videos/${row.course_id}/${b.block_id}.${ext}`;
      const mp = await env.ASSETS_BUCKET.createMultipartUpload(key, {
        httpMetadata: { contentType: b.content_type! },
      });
      return Response.json({ key, uploadId: mp.uploadId });
    }

    // ---- part: stream one chunk into the multipart upload ----
    if (phase === "part") {
      const key = url.searchParams.get("key") ?? "";
      const uploadId = url.searchParams.get("uploadId") ?? "";
      const partNumber = parseInt(url.searchParams.get("part") ?? "0", 10);
      const operatorSlug = url.searchParams.get("operator_slug") ?? "";
      if (!key || !uploadId || !partNumber || !operatorSlug) {
        return new Response("missing required fields", { status: 400 });
      }
      await requireOperatorMembership(operatorSlug);
      const buf = await req.arrayBuffer();
      const mp = env.ASSETS_BUCKET.resumeMultipartUpload(key, uploadId);
      const part = await mp.uploadPart(partNumber, buf);
      return Response.json({ partNumber: part.partNumber, etag: part.etag });
    }

    // ---- complete: stitch the parts and attach the object to the block ----
    if (phase === "complete") {
      const b = (await req.json()) as {
        operator_slug?: string;
        course_slug?: string;
        module_id?: string;
        block_id?: string;
        key?: string;
        uploadId?: string;
        parts?: { partNumber: number; etag: string }[];
      };
      if (
        !b.operator_slug || !b.course_slug || !b.module_id || !b.block_id ||
        !b.key || !b.uploadId || !Array.isArray(b.parts)
      ) {
        return new Response("missing required fields", { status: 400 });
      }
      await requireOperatorMembership(b.operator_slug);
      const row = await db()
        .prepare(
          `SELECT cb.id, cb.video_r2_key, m.course_id FROM content_blocks cb
           JOIN modules m ON m.id = cb.module_id
           WHERE cb.id = ? AND cb.module_id = ?`,
        )
        .bind(b.block_id, b.module_id)
        .first<{ id: string; video_r2_key: string | null; course_id: string }>();
      if (!row) return new Response("block not found", { status: 404 });

      const mp = env.ASSETS_BUCKET.resumeMultipartUpload(b.key, b.uploadId);
      await mp.complete(b.parts);
      if (row.video_r2_key && row.video_r2_key !== b.key) {
        await env.ASSETS_BUCKET.delete(row.video_r2_key).catch(() => {});
      }
      await db()
        .prepare(`UPDATE content_blocks SET video_r2_key = ? WHERE id = ?`)
        .bind(b.key, b.block_id)
        .run();
      revalidatePath(`/product/${b.operator_slug}/courses/${b.course_slug}/edit`);
      revalidatePath(`/learn/${b.operator_slug}/${b.course_slug}`);
      return Response.json({ ok: true, key: b.key });
    }

    // ---- abort: discard a pending upload (best effort) ----
    if (phase === "abort") {
      const b = (await req.json()) as { operator_slug?: string; key?: string; uploadId?: string };
      if (!b.key || !b.uploadId) return new Response("missing required fields", { status: 400 });
      try {
        if (b.operator_slug) await requireOperatorMembership(b.operator_slug);
      } catch {
        /* abort is best-effort cleanup; ignore auth races */
      }
      const mp = env.ASSETS_BUCKET.resumeMultipartUpload(b.key, b.uploadId);
      await mp.abort().catch(() => {});
      return Response.json({ ok: true });
    }

    return new Response("unknown phase", { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return new Response(msg, { status: errStatus(msg) });
  }
}
