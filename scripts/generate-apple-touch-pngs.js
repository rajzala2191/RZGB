/**
 * Generates 180×180 PNGs from apple-touch-icon SVGs so iOS uses the correct
 * home screen icon (iOS does not reliably use SVG for apple-touch-icon).
 * Run before build: node scripts/generate-apple-touch-pngs.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const logosDir = path.join(root, 'public', 'logos');
const size = 180;

const tasks = [
  { svg: 'apple-touch-icon-light.svg', png: path.join(logosDir, 'apple-touch-icon-light.png') },
  { svg: 'apple-touch-icon-dark.svg', png: path.join(logosDir, 'apple-touch-icon-dark.png') },
  { svg: 'apple-touch-icon-dark.svg', png: path.join(root, 'public', 'apple-touch-icon.png') },
];

async function main() {
  let Resvg;
  try {
    const mod = await import('@resvg/resvg-js');
    Resvg = mod.Resvg || mod.default?.Resvg;
  } catch {
    console.warn('@resvg/resvg-js not installed. Run: npm install -D @resvg/resvg-js');
    console.warn('Skipping PNG generation. iOS may show an old icon until PNGs exist.');
    return;
  }
  if (!Resvg) {
    console.warn('Resvg not found in @resvg/resvg-js');
    return;
  }

  for (const { svg, png } of tasks) {
    const svgPath = path.join(logosDir, svg);
    try {
      const svgString = readFileSync(svgPath, 'utf8');
      const resvg = new Resvg(svgString, { fitTo: { mode: 'width', value: size } });
      const pngData = resvg.render();
      const pngBuffer = pngData.asPng();
      writeFileSync(png, pngBuffer);
      console.log('Generated', path.basename(png));
    } catch (err) {
      console.error('Failed', path.basename(png), err.message);
    }
  }
}

main();
