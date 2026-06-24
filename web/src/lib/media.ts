/**
 * Public R2 custom domain. Images and videos are served DIRECTLY from this CDN
 * host (cached at the edge, no Worker in the path) instead of streaming through
 * the `/api/*-cover`, `/api/video`, `/api/media` Worker routes — much faster,
 * especially for video playback/seeking.
 *
 * Objects are public by key (the bucket is exposed on this domain). Only use it
 * for content that is meant to be public (covers, course images, course videos).
 */
const MEDIA_HOST = "https://media.libretour.com";

/** Build a direct CDN URL for an R2 object key (path separators preserved). */
export function mediaUrl(key: string): string {
  return `${MEDIA_HOST}/${key.split("/").map(encodeURIComponent).join("/")}`;
}
