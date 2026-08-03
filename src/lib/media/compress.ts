/** Compress image File → JPEG Blob for IDB (local-only heroes/cover).
 * Canvas re-encode strips EXIF / GPS metadata (P14).
 */

const MAX_EDGE = 1280;
const QUALITY = 0.82;

export async function compressImageFile(file: File, maxEdge = MAX_EDGE): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Pick an image file.');
  }
  // createImageBitmap + canvas JPEG → no EXIF passthrough
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Canvas unavailable.');
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', QUALITY),
  );
  if (!blob) throw new Error('Could not compress image.');
  return blob;
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error ?? new Error('read failed'));
    r.readAsDataURL(blob);
  });
}
