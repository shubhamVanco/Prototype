/** Read a File into a downscaled JPEG data URL (keeps localStorage small). */
export function fileToDataUrl(file: File, maxSize = 900, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("invalid-image"));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        resolve(drawScaled(img, img.naturalWidth, img.naturalHeight, maxSize, quality));
      } catch (e) {
        reject(e);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("invalid-image"));
    };
    img.src = url;
  });
}

export function videoToDataUrl(video: HTMLVideoElement, maxSize = 900, quality = 0.72): string {
  return drawScaled(video, video.videoWidth, video.videoHeight, maxSize, quality);
}

function drawScaled(
  src: CanvasImageSource, w: number, h: number, maxSize: number, quality: number,
): string {
  if (!w || !h) throw new Error("invalid-image");
  const scale = Math.min(1, maxSize / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no-canvas");
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}
