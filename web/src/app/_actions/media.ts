"use server";

import { db } from "@/lib/db";
import { requireSupplierMembership, requireOperatorMembership, requireAdmin } from "@/lib/roles";
import { revalidatePath } from "next/cache";

export interface MediaAsset {
  id: string;
  r2_key: string;
  filename: string | null;
  mime: string;
  created_at: number;
}

export interface PlatformMediaAsset extends MediaAsset {
  supplier_id: string;
  supplier_name: string;
  supplier_slug: string;
}

/** Platform-wide media: every supplier's library, aggregated. Admin only. */
export async function listAllMedia(
  q?: string,
): Promise<{ ok: boolean; assets?: PlatformMediaAsset[]; error?: string }> {
  try {
    await requireAdmin();
    const query = (q ?? "").trim();
    const base = `SELECT m.id, m.r2_key, m.filename, m.mime, m.created_at,
              m.supplier_id, s.name AS supplier_name, s.slug AS supplier_slug
       FROM media_assets m JOIN suppliers s ON s.id = m.supplier_id`;
    const stmt = query
      ? db().prepare(`${base} WHERE s.name LIKE ? OR m.filename LIKE ? ORDER BY m.created_at DESC`).bind(`%${query}%`, `%${query}%`)
      : db().prepare(`${base} ORDER BY m.created_at DESC`);
    const { results = [] } = await stmt.all<PlatformMediaAsset>();
    return { ok: true, assets: results };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "failed" };
  }
}

/** List a supplier's media library (newest first). */
export async function listSupplierMedia(
  supplierSlug: string,
): Promise<{ ok: boolean; assets?: MediaAsset[]; error?: string }> {
  try {
    const access = await requireSupplierMembership(supplierSlug);
    const { results = [] } = await db()
      .prepare(
        `SELECT id, r2_key, filename, mime, created_at
         FROM media_assets WHERE supplier_id = ? ORDER BY created_at DESC`,
      )
      .bind(access.supplierId)
      .all<MediaAsset>();
    return { ok: true, assets: results };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "failed" };
  }
}

type CoverTarget =
  | { target: "supplier"; supplierSlug: string }
  | { target: "product"; operatorSlug: string }
  | { target: "course"; operatorSlug: string; courseId: string }
  | { target: "block"; operatorSlug: string; blockId: string };

/**
 * Point an entity's cover/image column at a library asset's R2 key (or clear
 * it with r2Key=null). Centralises auth + the per-target UPDATE so every
 * consumer of the media picker shares one code path.
 */
export async function setCoverFromMedia(
  input: CoverTarget & { r2Key: string | null },
): Promise<{ ok: boolean; error?: string }> {
  try {
    const r2Key = input.r2Key;
    // r2Key, when set, must belong to a real library asset (don't let a caller
    // point a column at an arbitrary R2 key).
    if (r2Key) {
      const exists = await db()
        .prepare(`SELECT 1 AS x FROM media_assets WHERE r2_key = ?`)
        .bind(r2Key)
        .first<{ x: number }>();
      if (!exists) throw new Error("unknown media asset");
    }

    if (input.target === "supplier") {
      await requireSupplierMembership(input.supplierSlug);
      await db()
        .prepare(`UPDATE suppliers SET cover_r2_key = ? WHERE slug = ?`)
        .bind(r2Key, input.supplierSlug)
        .run();
      revalidatePath(`/supplier/${input.supplierSlug}`);
      return { ok: true };
    }

    const access = await requireOperatorMembership(input.operatorSlug);

    if (input.target === "product") {
      await db()
        .prepare(`UPDATE operators SET cover_r2_key = ? WHERE id = ?`)
        .bind(r2Key, access.operatorId)
        .run();
      revalidatePath(`/product/${input.operatorSlug}`);
      revalidatePath(`/explore`);
      return { ok: true };
    }

    if (input.target === "course") {
      await db()
        .prepare(`UPDATE courses SET cover_r2_key = ? WHERE id = ? AND operator_id = ?`)
        .bind(r2Key, input.courseId, access.operatorId)
        .run();
      revalidatePath(`/product/${input.operatorSlug}`);
      return { ok: true };
    }

    // block
    await db()
      .prepare(
        `UPDATE content_blocks SET image_r2_key = ?
         WHERE id = ? AND module_id IN (
           SELECT m.id FROM modules m JOIN courses c ON c.id = m.course_id
           WHERE c.operator_id = ?
         )`,
      )
      .bind(r2Key, input.blockId, access.operatorId)
      .run();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "failed" };
  }
}
