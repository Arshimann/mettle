// One-off: rasterize the Mettle mark to PWA PNG icons.
// Run: node scripts/gen-icons.mjs
// Keep this in sync with public/icon.svg — same shape, parameterised corner.
import sharp from 'sharp';

const mark = (rx, inset = 0) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0%" stop-color="#7c5cff"/><stop offset="100%" stop-color="#4f8bff"/>` +
      `</linearGradient></defs>` +
      `<rect width="512" height="512" rx="${rx}" fill="#0b0b10"/>` +
      `<g transform="translate(256 256) scale(${1 - inset}) translate(-256 -256)">` +
      `<path d="M104 316 L182 208 L256 300 L330 208 L408 316" fill="none" stroke="url(#g)" ` +
      `stroke-width="54" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<rect x="140" y="372" width="232" height="34" rx="17" fill="#f5f5f7"/>` +
      `</g></svg>`,
  );

const std = mark(112);
// Maskable icons get cropped to a circle by some launchers, so the artwork is
// scaled into the safe zone rather than running to the edges.
const msk = mark(0, 0.2);

await sharp(std, { density: 144 }).resize(192, 192).png().toFile('public/pwa-192.png');
await sharp(std, { density: 144 }).resize(512, 512).png().toFile('public/pwa-512.png');
await sharp(msk, { density: 144 }).resize(512, 512).png().toFile('public/pwa-maskable-512.png');

console.log('Generated pwa-192.png, pwa-512.png, pwa-maskable-512.png');
