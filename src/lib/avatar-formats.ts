// Client-safe: the file picker filters by this list and the upload re-checks
// it, so both sides agree on what a profile picture may be.

/**
 * The formats a browser will render without help. The stored extension comes
 * from this table rather than from the uploaded file name, which is only the
 * caller's word for what the file is.
 */
export const AVATAR_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const AVATAR_ACCEPT = Object.keys(AVATAR_EXTENSIONS).join(",");

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const MAX_AVATAR_LABEL = "2 MB";
