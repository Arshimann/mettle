/**
 * Canvas → upload-ready blob.
 *
 * The subtle trap this exists to avoid: per the HTML spec, `canvas.toBlob`
 * falls back to `image/png` when the requested type isn't supported, and still
 * returns a perfectly valid blob. Safari can't encode WebP on older versions,
 * so asking for WebP hands you a PNG with no error — which then gets uploaded
 * with the wrong content type and rejected by a bucket allowlist.
 *
 * So: never trust the type you asked for, only `blob.type`.
 */

export interface EncodedImage {
  blob: Blob;
  /** The type the encoder actually produced. */
  type: string;
  /** File extension matching `type`, so path and content can't disagree. */
  ext: string;
  width: number;
  height: number;
}

const EXT: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Encode preferring webp, then jpeg, accepting whatever the browser gives. */
async function encodeCanvas(canvas: HTMLCanvasElement, quality: number): Promise<EncodedImage | null> {
  for (const type of ['image/webp', 'image/jpeg'] as const) {
    const blob = await toBlob(canvas, type, quality);
    if (!blob) continue;
    // A mismatch means the encoder silently substituted something else.
    if (blob.type === type) {
      return { blob, type, ext: EXT[type], width: canvas.width, height: canvas.height };
    }
    // Take the substitute only if we recognise it — it's still a real image.
    if (EXT[blob.type]) {
      return { blob, type: blob.type, ext: EXT[blob.type], width: canvas.width, height: canvas.height };
    }
  }
  return null;
}

/**
 * Draw an image file to a canvas and encode it.
 * `mode: 'cover'` centre-crops to a square (avatars); `'contain'` preserves
 * aspect ratio within maxEdge (physique photos, which must never be cropped).
 */
export async function encodeImage(
  file: File,
  opts: { maxEdge: number; quality?: number; mode?: 'cover' | 'contain' },
): Promise<EncodedImage | null> {
  const { maxEdge, quality = 0.85, mode = 'contain' } = opts;

  let bitmap: ImageBitmap;
  try {
    // from-image bakes in EXIF rotation, so phone photos don't arrive sideways.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return null;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return null;
  }

  if (mode === 'cover') {
    canvas.width = maxEdge;
    canvas.height = maxEdge;
    const side = Math.min(bitmap.width, bitmap.height);
    ctx.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      maxEdge,
      maxEdge,
    );
  } else {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  }
  bitmap.close();

  return encodeCanvas(canvas, quality);
}
