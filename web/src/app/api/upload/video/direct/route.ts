/**
 * POST /api/upload/video/direct?phase=presign|attach
 *
 * True direct-to-R2 upload (fastest path). The Worker only signs a short-lived
 * presigned S3 PUT URL; the browser then PUTs the whole file STRAIGHT to R2,
 * bypassing the Worker's request-body limit and the extra hop entirely. After
 * the PUT succeeds the browser calls `attach` to record the object on the block.
 *
 *   presign  JSON {operator_slug, course_slug, module_id, block_id, content_type, size}
 *              → {url, key}            (presigned PUT URL, valid ~1h)
 *   attach   JSON {operator_slug, course_slug, module_id, block_id, key}
 *              → {ok}                  (sets content_blocks.video_r2_key)
 *
 * Requires the R2 S3 API token (R2_S3_ACCESS_KEY_ID / R2_S3_SECRET_ACCESS_KEY)
 * and a bucket CORS policy allowing PUT from the site origin. If anything here
 * fails, the client falls back to the chunked multipart route.
 */
import { db } from "@/lib/db";
import { requireOperatorMembership } from "@/lib/roles";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";
import { AwsClient } from "aws4fetch";

export const dynamic = "force-dynamic";

const MAX_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB
const ACCOUNT_ID = "66452b507f2119d3801c757b0272ea98";
const BUCKET = "tourtrain-assets";
const ENDPOINT = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;
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
    if (phase === "presign") {
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
      if (!env.R2_S3_ACCESS_KEY_ID || !env.R2_S3_SECRET_ACCESS_KEY) {
        return new Response("direct upload not configured", { status: 501 });
      }

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
      const aws = new AwsClient({
        accessKeyId: env.R2_S3_ACCESS_KEY_ID,
        secretAccessKey: env.R2_S3_SECRET_ACCESS_KEY,
        service: "s3",
        region: "auto",
      });
      // Presigned PUT, ~1h. Content-Type is left unsigned so the browser can send
      // the file's own type; R2 stores it from the PUT request.
      const signed = await aws.sign(`${ENDPOINT}/${BUCKET}/${key}?X-Amz-Expires=3600`, {
        method: "PUT",
        aws: { signQuery: true },
      });
      return Response.json({ url: signed.url, key });
    }

    if (phase === "attach") {
      const b = (await req.json()) as {
        operator_slug?: string;
        course_slug?: string;
        module_id?: string;
        block_id?: string;
        key?: string;
      };
      if (!b.operator_slug || !b.course_slug || !b.module_id || !b.block_id || !b.key) {
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
      // Guard: the key must belong to this course (don't let a crafted key point
      // the block at someone else's object).
      if (b.key !== `videos/${row.course_id}/${b.block_id}.${b.key.split(".").pop()}`) {
        return new Response("invalid key", { status: 400 });
      }
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

    return new Response("unknown phase", { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return new Response(msg, { status: errStatus(msg) });
  }
}
