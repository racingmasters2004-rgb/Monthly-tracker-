import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="navyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1F3A52" />
      <stop offset="100%" stop-color="#10202B" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D9A017" />
      <stop offset="100%" stop-color="#B8860B" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000" flood-opacity="0.25" />
    </filter>
  </defs>

  <!-- Background base -->
  <rect width="512" height="512" rx="110" fill="url(#navyGrad)" />

  <!-- Paper Card with shadow -->
  <g filter="url(#shadow)">
    <rect x="96" y="80" width="320" height="352" rx="24" fill="#FBFAF7" stroke="#DCD6C7" stroke-width="4" />
    <!-- Header band on paper -->
    <path d="M96 104 C96 90.7 106.7 80 120 80 L392 80 C405.3 80 416 90.7 416 104 L416 148 L96 148 Z" fill="#1F3A52" />
    <!-- Planner lines -->
    <line x1="140" y1="200" x2="372" y2="200" stroke="#DCD6C7" stroke-width="6" stroke-linecap="round" />
    <line x1="140" y1="260" x2="372" y2="260" stroke="#DCD6C7" stroke-width="6" stroke-linecap="round" />
    <line x1="140" y1="320" x2="372" y2="320" stroke="#DCD6C7" stroke-width="6" stroke-linecap="round" />
    <line x1="140" y1="380" x2="280" y2="380" stroke="#DCD6C7" stroke-width="6" stroke-linecap="round" />
  </g>

  <!-- Golden Checkmark Seal -->
  <circle cx="340" cy="350" r="54" fill="url(#goldGrad)" filter="url(#shadow)" stroke="#FBFAF7" stroke-width="6" />
  <path d="M316 350 L332 366 L366 332" fill="none" stroke="#FBFAF7" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />

  <!-- Teal Currency / Expense Accent badge -->
  <circle cx="160" cy="114" r="16" fill="#2A7F73" />
  <text x="160" y="120" font-family="system-ui, sans-serif" font-weight="bold" font-size="16" fill="#FBFAF7" text-anchor="middle">₹</text>

  <!-- Title on top band -->
  <text x="264" y="121" font-family="system-ui, sans-serif" font-weight="700" font-size="16" fill="#FBFAF7" letter-spacing="2">PLANNER</text>
</svg>`;

async function generate() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Save SVG
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon);

  // Generate PNGs
  const svgBuffer = Buffer.from(svgIcon);

  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✓ Generated icon-512.png');

  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✓ Generated icon-192.png');

  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Generated apple-touch-icon.png');

  // Maskable icon with safe zone padding (10% on each side)
  const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <rect width="512" height="512" fill="#1F3A52" />
    <g transform="translate(51.2, 51.2) scale(0.8)">
      ${svgIcon.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}
    </g>
  </svg>`;

  await sharp(Buffer.from(maskableSvg)).resize(512, 512).png().toFile(path.join(publicDir, 'icon-maskable-512.png'));
  console.log('✓ Generated icon-maskable-512.png');
}

generate().catch(console.error);
