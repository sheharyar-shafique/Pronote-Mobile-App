// Rasterize the SVG brand sources into PNGs that @capacitor/assets and the
// build pipeline consume. Idempotent — safe to re-run any time the SVGs change.
//
//   node scripts/rasterize-logos.mjs

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');

const targets = [
  { svg: 'resources/icon-source.svg', png: 'resources/icon.png',   size: 1024 },
  { svg: 'resources/logo-source.svg', png: 'resources/splash.png', size: 2732 },
  // A square-cropped icon-only version for in-app branding fallbacks.
  { svg: 'resources/icon-source.svg', png: 'resources/icon-foreground.png', size: 1024 },
];

await mkdir(resolve(root, 'resources'), { recursive: true });

for (const { svg, png, size } of targets) {
  const svgBuf = await readFile(resolve(root, svg));
  const out = await sharp(svgBuf, { density: 300 })
    .resize(size, size, { fit: 'contain', background: { r: 81, g: 100, b: 81, alpha: 1 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(resolve(root, png), out);
  console.log(`✓ ${png}  (${size}×${size}, ${(out.length / 1024).toFixed(1)} KB)`);
}
