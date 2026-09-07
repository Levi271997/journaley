import "server-only";
import {
  AVATAR_EXTENSIONS,
  MAX_AVATAR_BYTES,
  MAX_AVATAR_LABEL,
} from "./avatar-formats";
import { createClient } from "./supabase/server";

export const AVATAR_BUCKET = "avatars";

export type AvatarUpload = { url: string } | { error: string };

export async function uploadAvatar(userId: string, file: File): Promise<AvatarUpload> {
  const extension = AVATAR_EXTENSIONS[file.type];
  if (!extension) return { error: "Choose a PNG, JPEG, WebP or GIF image." };
  if (file.size > MAX_AVATAR_BYTES) {
    return { error: `That image is larger than ${MAX_AVATAR_LABEL}.` };
  }

  // A random name, not a fixed one. The bucket is public, so an unguessable
  // path is what keeps an avatar from being found by working forward from an
  // account; it also means a replacement is never served from a stale cache.
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;

  const supabase = await createClient();
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "3600" });

  if (error) return { error: `Could not upload that image: ${error.message}` };

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

/**
 * Unlinks a picture the account no longer points at. Best effort on purpose:
 * an orphaned file is untidy, while a failure here should not cost someone the
 * profile change they actually asked for.
 */
export async function removeAvatar(userId: string, url: string) {
  const path = pathFromPublicUrl(userId, url);
  if (!path) return;

  const supabase = await createClient();
  await supabase.storage.from(AVATAR_BUCKET).remove([path]);
}

/** Null unless the URL really is a file inside this user's own folder. */
function pathFromPublicUrl(userId: string, url: string) {
  const marker = `/${AVATAR_BUCKET}/`;
  const at = url.indexOf(marker);
  if (at === -1) return null;

  const path = decodeURIComponent(url.slice(at + marker.length));
  return path.startsWith(`${userId}/`) ? path : null;
}
