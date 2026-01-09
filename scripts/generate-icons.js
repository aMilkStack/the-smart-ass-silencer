import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Read the SVG
const svgBuffer = readFileSync(join(publicDir, 'icon.svg'));

// Icon sizes needed for PWA
const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-maskable-512.png', size: 512, maskable: true }
];

async function generateIcons() {
  console.log('Generating PWA icons...');

  for (const { name, size, maskable } of sizes) {
    let image = sharp(svgBuffer).resize(size, size);

    if (maskable) {
      // For maskable icons, add padding (safe zone is 80% of the icon)
      const safeSize = Math.floor(size * 0.8);
      const padding = Math.floor((size - safeSize) / 2);

      image = sharp(svgBuffer)
        .resize(safeSize, safeSize)
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: '#fffdf5'
        });
    }

    await image.png().toFile(join(publicDir, name));
    console.log(`Created: ${name} (${size}x${size})`);
  }

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
