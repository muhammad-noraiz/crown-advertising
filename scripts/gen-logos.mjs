import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../public/client-logos');

// Each brand: { file, label, color (text), bg }
const brands = [
  { file: 'rivaj.png',    label: 'RIVAJ',     color: '#c41e3a', bg: '#fff' },
  { file: 'al-hilal.png', label: 'AL-HILAL',  color: '#0a6e3a', bg: '#fff' },
  { file: 'menu.png',     label: 'MENU',       color: '#e63900', bg: '#fff' },
  { file: 'fast.png',     label: 'FAST',       color: '#002060', bg: '#fff' },
  { file: 'care.png',     label: 'CARE',       color: '#007bbd', bg: '#fff' },
  { file: 'eagle.png',    label: 'EAGLE',      color: '#b8860b', bg: '#fff' },
  { file: 'rainbow.png',  label: 'RAINBOW',    color: '#c00080', bg: '#fff' },
  { file: 'crystal.png',  label: 'CRYSTAL',    color: '#1a6b8a', bg: '#fff' },
  // Replacing 16x16 favicons with proper wordmarks
  { file: 'brite.png',    label: 'BRITE',      color: '#0055a4', bg: '#fff' },
  { file: 'top-food.png', label: 'TOP FOOD',   color: '#d4360b', bg: '#fff' },
];

const W = 200;
const H = 80;

for (const brand of brands) {
  const fontSize = brand.label.length > 7 ? 22 : 28;
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${brand.bg}"/>
  <text
    x="${W / 2}"
    y="${H / 2 + fontSize * 0.36}"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="900"
    font-size="${fontSize}"
    fill="${brand.color}"
    text-anchor="middle"
    letter-spacing="2"
  >${brand.label}</text>
</svg>`.trim();

  const outPath = join(OUT_DIR, brand.file);
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`✓ ${brand.file}`);
}

console.log('\nDone!');
