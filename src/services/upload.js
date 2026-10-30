// Image uploads to Cloudflare R2 (see api/uploads/sign.js):
//   1. toJpeg: shrink the picture in the browser,
//   2. uploadImage: ask /api/uploads/sign for a presigned URL, PUT the JPEG straight to R2,
//      and return the public URL to save in Firestore.
import { auth } from "../lib/firebase";

// Redraws an image file as a JPEG Blob. square: crop the middle to size×size (avatars);
// otherwise only scale down so the longer side is at most size (covers).
// Rejects with "OPEN_FAIL" if the file can't be read as an image.
export function toJpeg(file, { size, square = false }) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const { width: iw, height: ih } = img;
      const side = Math.min(iw, ih);
      const scale = Math.min(1, size / Math.max(iw, ih));
      const [sx, sy, sw, sh] = square ? [(iw - side) / 2, (ih - side) / 2, side, side] : [0, 0, iw, ih];
      const [w, h] = square ? [size, size] : [Math.round(iw * scale), Math.round(ih * scale)];
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff"; // transparent PNGs get a white background instead of black
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("OPEN_FAIL"))), "image/jpeg", 0.85);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("OPEN_FAIL"));
    };
    img.src = URL.createObjectURL(file);
  });
}

// kind: "avatar" (own profile picture) or "cover" (story cover, owner only). Returns the public URL.
export async function uploadImage(kind, blob) {
  const token = await auth.currentUser.getIdToken();
  const sign = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ kind, size: blob.size }),
  });
  if (!sign.ok) throw new Error("UPLOAD_FAIL");
  const { uploadUrl, publicUrl } = await sign.json();

  const put = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: blob });
  if (!put.ok) throw new Error("UPLOAD_FAIL");
  return publicUrl;
}
