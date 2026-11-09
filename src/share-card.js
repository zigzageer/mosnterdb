import QRCode from 'qrcode';
import { SITE_URL, trackingLink, normalizeProfile } from './tracking.js';
import { slash } from './art.js';

const GREEN = '#a2f500', INK = '#050505', BONE = '#f3f2e7', HAZARD = '#ffe500', MUTED = '#a9ad9a', PANEL = '#14170e';
const display = size => `italic 900 ${size}px Tomorrow`;
const head = size => `italic 900 ${size}px "Barlow Condensed"`;
const ui = size => `700 ${size}px "Chakra Petch"`;
const goth = size => `${size}px "New Rocker"`;

const imageCache = new Map();
function loadImage(src) {
  if (!imageCache.has(src)) imageCache.set(src, new Promise((resolve,reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => { imageCache.delete(src); reject(new Error('A can photo could not load. Check your connection and try again.')); };
    image.src = new URL(src, document.baseURI).href;
  }));
  return imageCache.get(src);
}
function text(ctx, value, x, y, font, color = BONE, spacing = 0) {
  ctx.font = font; ctx.fillStyle = color;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${spacing}px`;
  ctx.fillText(value, x, y);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
}
function fit(ctx, value, x, y, maxWidth, size, color) {
  while (size > 24) { ctx.font = display(size); if (ctx.measureText(value).width <= maxWidth) break; size--; }
  text(ctx, value, x, y, display(size), color);
}
function wrapped(ctx, value, x, y, width, lineHeight) {
  const words = value.split(/\s+/); let line = ''; const lines = [];
  for (const word of words) { const test = line ? `${line} ${word}` : word; if (ctx.measureText(test).width > width && line) { lines.push(line); line = word; } else line = test; }
  if (line) lines.push(line);
  lines.slice(0,2).forEach((value,index) => {
    if (index === 1 && lines.length > 2) { while (ctx.measureText(value + '…').width > width) value = value.slice(0,-1); value += '…'; }
    ctx.fillText(value, x, y + index * lineHeight);
  });
}
function hazard(ctx, x, y, width, height, step = 16) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, width, height); ctx.clip();
  ctx.fillStyle = HAZARD; ctx.fillRect(x, y, width, height); ctx.fillStyle = INK;
  for (let i = x - height; i < x + width + height; i += step * 2) {
    ctx.beginPath(); ctx.moveTo(i, y + height); ctx.lineTo(i + height, y); ctx.lineTo(i + height + step, y); ctx.lineTo(i + step, y + height); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function slanted(ctx, x, y, width, height, lean = 18) {
  ctx.beginPath(); ctx.moveTo(x + lean, y); ctx.lineTo(x + width, y); ctx.lineTo(x + width - lean, y + height); ctx.lineTo(x, y + height); ctx.closePath();
}
function claws(ctx, x, y, scale, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.fillStyle = color;
  [slash(13, 4, 9, 60, 13, 7, 26), slash(32, 1, 29, 63, 15, 21, 26), slash(51, 5, 50, 58, 13, 33, 26)].forEach(d => ctx.fill(new Path2D(d)));
  ctx.restore();
}
function ratingStar(ctx, x, y, r, filled) {
  ctx.save(); ctx.translate(x, y); ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = i * Math.PI / 5 - Math.PI / 2, radius = i % 2 ? r * .44 : r;
    i ? ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius) : ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  ctx.closePath(); ctx.strokeStyle = filled ? HAZARD : '#5a604c'; ctx.lineWidth = 1.4;
  if (filled) { ctx.fillStyle = HAZARD; ctx.fill(); } ctx.stroke(); ctx.restore();
}

export async function makeShareCard(value, catalog) {
  const profile = normalizeProfile(value);
  const selected = new Set(profile.tried);
  const cans = catalog.filter(can => selected.has(can.id));
  const columns = cans.length <= 4 ? 4 : cans.length <= 15 ? 5 : cans.length <= 36 ? 6 : 8;
  const width = 1080, padding = 48, cell = (width - padding * 2) / columns;
  const photoHeight = columns === 8 ? 150 : columns === 6 ? 180 : 220;
  const hasRatings = Boolean(profile.ratings);
  const rowHeight = photoHeight + (hasRatings ? 126 : 92);
  const rows = Math.max(1, Math.ceil(cans.length / columns));
  const height = Math.max(1350, 500 + rows * rowHeight + 250);
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  canvas.id = 'share-canvas'; canvas.setAttribute('role','img'); canvas.setAttribute('aria-label', `Share graphic with ${cans.length} tried cans and a QR code linking to this list`);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not create the share graphic. You can still copy your tracking link.');
  await Promise.all([display(80), head(22), ui(18), goth(44)].map(font => document.fonts.load(font)));
  const [images, qr] = await Promise.all([
    Promise.all(cans.map(can => loadImage(can.image))),
    QRCode.toDataURL(trackingLink(profile), {width:164, margin:2, errorCorrectionLevel:'M', color:{dark:INK, light:GREEN}}).then(loadImage),
  ]);

  // Asphalt, speed lines and a halftone fade.
  ctx.fillStyle = '#080907'; ctx.fillRect(0, 0, width, height);
  ctx.save(); ctx.strokeStyle = '#ffffff08'; ctx.lineWidth = 2;
  for (let x = -height; x < width; x += 46) { ctx.beginPath(); ctx.moveTo(x, height); ctx.lineTo(x + height * .47, 0); ctx.stroke(); }
  ctx.restore();
  for (let y = 40; y < 470; y += 11) for (let x = 560 + (y % 22 ? 0 : 5.5); x < width; x += 11) {
    const strength = Math.max(0, (x - 560) / 520) * Math.max(0, 1 - y / 470);
    if (strength > .05) { ctx.fillStyle = `rgba(162,245,0,${(strength * .55).toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y, 1.2 + strength * 2.2, 0, Math.PI * 2); ctx.fill(); }
  }
  hazard(ctx, 0, 0, width, 18);

  // Masthead.
  claws(ctx, padding - 4, 46, 1.05, GREEN);
  text(ctx, 'Monster', padding + 72, 98, goth(50));
  ctx.font = goth(50); const brandWidth = ctx.measureText('Monster').width;
  text(ctx, '//DB', padding + 78 + brandWidth, 98, display(32), GREEN);
  ctx.textAlign = 'right';
  text(ctx, 'THE UNOFFICIAL', width - padding, 72, ui(15), MUTED, 3);
  text(ctx, 'FLAVOR PASSPORT', width - padding, 96, ui(15), GREEN, 3);
  ctx.textAlign = 'left';

  // Title.
  fit(ctx, profile.name ? `${profile.name.toUpperCase()}’S` : 'MY MONSTER', padding, 212, width - padding * 2, 74, BONE);
  text(ctx, 'TRIED LIST.', padding + 6, 316, display(96), '#3f7400');
  text(ctx, 'TRIED LIST.', padding, 310, display(96), GREEN);

  // Scoreboard.
  const percent = Math.round(cans.length / catalog.length * 100);
  ctx.fillStyle = GREEN; slanted(ctx, padding, 342, width - padding * 2, 104); ctx.fill();
  ctx.fillStyle = PANEL; slanted(ctx, padding + 5, 346, width - padding * 2 - 10, 96, 16); ctx.fill();
  text(ctx, String(cans.length).padStart(2,'0'), padding + 34, 422, display(70), GREEN);
  ctx.font = display(70); const countWidth = ctx.measureText(String(cans.length).padStart(2,'0')).width;
  text(ctx, `OF ${catalog.length} FLAVORS TRIED`, padding + 56 + countWidth, 388, ui(21), BONE, 1.5);
  text(ctx, `${catalog.length - cans.length} STILL ON THE HIT LIST`, padding + 56 + countWidth, 420, ui(15), MUTED, 1.5);
  ctx.textAlign = 'right'; text(ctx, `${percent}% DONE`, width - padding - 40, 388, display(24), GREEN); ctx.textAlign = 'left';
  ctx.fillStyle = '#2d3222'; ctx.fillRect(width - padding - 266, 404, 226, 12);
  hazard(ctx, width - padding - 266, 404, 226 * percent / 100, 12, 8);
  text(ctx, 'THE LINEUP. EVERY CAN BELOW IS MARKED AS TRIED.', padding, 482, ui(13), MUTED, 1.5);
  if (hasRatings) { ctx.textAlign = 'right'; text(ctx, 'STARS = MY RATINGS', width - padding, 482, ui(13), HAZARD, 1.5); ctx.textAlign = 'left'; }
  if (!cans.length) {
    text(ctx, 'FIRST CAN.', padding + 60, 700, display(84), GREEN);
    text(ctx, 'NEXT CHAPTER.', padding + 60, 800, display(84));
    text(ctx, 'YOUR FLAVOR HUNT STARTS AT MONSTERDB.', padding + 64, 858, ui(18), MUTED, 2);
  }

  cans.forEach((can, index) => {
    const row = Math.floor(index / columns), col = index % columns;
    const remaining = Math.min(columns, cans.length - row * columns);
    const x = padding + col * cell + (columns - remaining) * cell / 2, y = 504 + row * rowHeight;
    const left = x + 3, cardWidth = cell - 6, stage = photoHeight + 42;
    ctx.fillStyle = PANEL; ctx.fillRect(left, y, cardWidth, rowHeight - 12);
    // Livery stage with an angled cut.
    const paint = ctx.createLinearGradient(left, y, left + cardWidth, y + stage);
    paint.addColorStop(0, can.color); paint.addColorStop(1, '#00000055');
    ctx.fillStyle = can.color; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(left + cardWidth, y); ctx.lineTo(left + cardWidth, y + stage - 16); ctx.lineTo(left, y + stage); ctx.closePath(); ctx.fill();
    ctx.fillStyle = paint; ctx.fill();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(left + 52, y); ctx.lineTo(left + 45, y + 22); ctx.lineTo(left, y + 22); ctx.closePath(); ctx.fill();
    text(ctx, can.number, left + 6, y + 17, display(14), BONE);
    const image = images[index]; const scale = Math.min((cell - 32) / image.width, photoHeight / image.height);
    const iw = image.width * scale, ih = image.height * scale;
    ctx.save(); ctx.shadowColor = '#0008'; ctx.shadowOffsetX = 6; ctx.shadowOffsetY = 7; ctx.drawImage(image, x + (cell - iw) / 2, y + 30 + (photoHeight - ih) / 2, iw, ih); ctx.restore();
    ctx.font = head(columns === 8 ? 17 : 21); ctx.fillStyle = BONE; ctx.textAlign = 'center';
    wrapped(ctx, can.name.toUpperCase(), x + cell / 2, y + photoHeight + 62, cell - 16, columns === 8 ? 17 : 21);
    ctx.textAlign = 'left';
    if (hasRatings) {
      const rating = profile.ratings[can.id] || 0;
      if (rating) for (let i = 0; i < 5; i++) ratingStar(ctx, x + cell / 2 + (i - 2) * 17, y + photoHeight + 105, 7, i < rating);
      else { ctx.textAlign = 'center'; text(ctx, 'UNRATED', x + cell / 2, y + photoHeight + 110, ui(11), '#8d937f', 1); ctx.textAlign = 'left'; }
    }
  });

  const footer = height - 220;
  ctx.fillStyle = GREEN; ctx.fillRect(0, footer, width, 220);
  hazard(ctx, 0, footer, width - 232, 12);
  text(ctx, 'YOUR TASTE. YOUR RULES.', padding, footer + 72, display(38), INK);
  text(ctx, 'BUILD YOUR OWN TRIED LIST', padding, footer + 108, ui(18), INK, 2);
  text(ctx, SITE_URL.replace(/^https:\/\//,'').replace(/\/$/,''), padding, footer + 156, head(34), INK);
  text(ctx, 'FAN-MADE. NOT AFFILIATED WITH MONSTER ENERGY.', padding, footer + 192, ui(11), '#2c4a00', 1.5);
  ctx.drawImage(qr, width - 212, footer + 24, 164, 164);
  text(ctx, 'SCAN MY TRIED LIST', width - 212, footer + 207, ui(12), INK, 1);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('The PNG could not be created. Try again or copy your link.');
  return { canvas, blob, link: trackingLink(profile), count: cans.length };
}
