/**
 * Shared card-cover fallback.
 *
 * Every marketplace / dashboard card shows a photo in its top half. When an
 * operator, course, or supplier has no uploaded cover (cover_r2_key) and no
 * hotlinked cover (cover_image_url), we fall back to one of these NZ scenics —
 * chosen deterministically from a seed (slug / id) so a given entity always gets
 * the same image and a grid still looks varied. This replaces the old emoji
 * placeholders (🌳 / 📚 / 📘) that used to stand in for a missing cover.
 *
 * TODO: download into R2 / public with srcset + lazy-loading before scaling
 * traffic (these are hotlinked from Pexels, free for commercial use).
 */
const FALLBACK_COVERS = [
  "https://images.pexels.com/photos/11032559/pexels-photo-11032559.jpeg?auto=compress&cs=tinysrgb&w=900",
  "https://images.pexels.com/photos/9485548/pexels-photo-9485548.jpeg?auto=compress&cs=tinysrgb&w=900",
  "https://images.pexels.com/photos/1118861/pexels-photo-1118861.jpeg?auto=compress&cs=tinysrgb&w=900",
  "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=900",
];

/** Deterministic NZ-scenic fallback cover for an entity with no real cover. */
export function fallbackCover(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return FALLBACK_COVERS[h % FALLBACK_COVERS.length];
}
