// One-off: rasterize the M mark to PWA PNG icons. Run: node scripts/gen-icons.mjs
import sharp from 'sharp';

const mark = (rx) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">` +
      `<rect width="512" height="512" rx="${rx}" fill="#101010"/>` +
      `<path d="M150 350 L150 168 L256 300 L362 168 L362 350" fill="none" stroke="#fafafa" stroke-width="46" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<rect x="186" y="386" width="140" height="20" rx="10" fill="#2f6df6"/>` +
      `</svg>`,
  );

const std = mark(112); // rounded square (any)
const msk = mark(0); // full-bleed (maskable)

await sharp(std, { density: 144 }).resize(192, 192).png().toFile('public/pwa-192.png');
await sharp(std, { density: 144 }).resize(512, 512).png().toFile('public/pwa-512.png');
await sharp(msk, { density: 144 }).resize(512, 512).png().toFile('public/pwa-maskable-512.png');

console.log('Generated pwa-192.png, pwa-512.png, pwa-maskable-512.png');
