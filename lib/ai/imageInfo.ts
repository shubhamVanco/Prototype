/** Read pixel dimensions from raw JPEG/PNG/WEBP bytes (proves the file actually decodes as an image). */
export function imageDimensions(b: Uint8Array): { width: number; height: number } | null {
  // PNG: IHDR at byte 16
  if (b[0] === 0x89 && b[1] === 0x50) {
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    return b.length > 24 ? { width: dv.getUint32(16), height: dv.getUint32(20) } : null;
  }
  // JPEG: walk markers to the first SOFn
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: (b[i + 5] << 8) | b[i + 6], width: (b[i + 7] << 8) | b[i + 8] };
      }
      i += 2 + ((b[i + 2] << 8) | b[i + 3]);
    }
    return null;
  }
  // WEBP: VP8 / VP8L / VP8X
  if (b[0] === 0x52 && b[8] === 0x57) {
    const tag = String.fromCharCode(b[12], b[13], b[14], b[15]);
    if (tag === "VP8X") return { width: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), height: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)) };
    if (tag === "VP8 ") return { width: (b[26] | (b[27] << 8)) & 0x3fff, height: (b[28] | (b[29] << 8)) & 0x3fff };
    if (tag === "VP8L") {
      const v = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
      return { width: (v & 0x3fff) + 1, height: ((v >> 14) & 0x3fff) + 1 };
    }
  }
  return null;
}

export const debugEnabled = () =>
  process.env.NODE_ENV === "development" || process.env.TYREVISION_DEBUG === "1";

/** Dev-only. Never pass base64 data, keys or user data here. */
export function debugLog(lines: string[]) {
  if (debugEnabled()) console.info(["[TYREVISION]", ...lines].join("\n"));
}
