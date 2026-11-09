// Decal art for the race-livery look. Everything is generated or inline SVG so the
// build stays free of extra image files (the standalone export only embeds fonts and can photos).

function rng(seed) {
  let state = seed >>> 0;
  return () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/**
 * A ragged claw slash from (x0,y0) to (x1,y1): blunt torn head, fattest early on, then a long
 * taper to a point. Edges wobble slowly and tear outward here and there, like ripped sheet metal.
 */
export function slash(x0, y0, x1, y1, width, seed = 1, steps = 44) {
  const rand = rng(seed);
  const dx = x1 - x0, dy = y1 - y0, length = Math.hypot(dx, dy);
  const ux = dx / length, uy = dy / length, nx = -uy, ny = ux;
  const phases = [rand() * 6.28, rand() * 6.28, rand() * 6.28, rand() * 6.28];
  const edge = (side, t, i) => {
    const wobble = Math.sin(t * 9 + phases[side]) * .09 + Math.sin(t * 23 + phases[side + 2]) * .05;
    const tear = rand() < .22 ? .12 + rand() * .2 : rand() < .2 ? -.1 : 0;
    return 1 + wobble + (i % 2 ? tear : tear * .4);
  };
  const left = [], right = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const profile = t < .1 ? .55 + .45 * Math.sin(t / .1 * Math.PI / 2) : Math.pow(1 - (t - .1) / .9, .78);
    const bow = Math.sin(t * Math.PI) * width * .22;
    const cx = x0 + dx * t + nx * bow, cy = y0 + dy * t + ny * bow;
    const half = width / 2 * profile;
    const slip = (rand() - .5) * length / steps * .9;
    const head = t === 0 ? (rand() - .5) * width * .3 : 0;
    left.push([cx + nx * half * edge(0, t, i) + ux * (slip + head), cy + ny * half * edge(0, t, i) + uy * (slip + head)]);
    right.push([cx - nx * half * edge(1, t, i) + ux * (slip - head), cy - ny * half * edge(1, t, i) + uy * (slip - head)]);
  }
  return 'M' + [...left, ...right.reverse()].map(point => point.map(value => value.toFixed(1)).join(' ')).join('L') + 'Z';
}

const clawPaths = [slash(13, 4, 9, 60, 13, 7, 26), slash(32, 1, 29, 63, 15, 21, 26), slash(51, 5, 50, 58, 13, 33, 26)];

/** Three-slash mark used for the brand, the favicon and the "tried" strike. */
export const clawMark = `<svg class="claw" viewBox="0 0 64 64" aria-hidden="true">${clawPaths.map(d => `<path d="${d}"/>`).join('')}</svg>`;

/** The big rip behind the hero cans. */
export const heroRip = `<svg class="hero-rip" viewBox="0 0 700 640" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
  <defs>
    <linearGradient id="rip-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9ff8a"/><stop offset=".35" stop-color="#a2f500"/><stop offset="1" stop-color="#3f7400"/></linearGradient>
    <pattern id="rip-dots" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><circle cx="4.5" cy="4.5" r="1.9" fill="#050505"/></pattern>
    <linearGradient id="rip-fade" x1="0" y1="0" x2="0" y2="1"><stop offset=".25" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".75"/></linearGradient>
    <mask id="rip-mask"><rect width="700" height="640" fill="url(#rip-fade)"/></mask>
  </defs>
  <g transform="rotate(14 350 320)">
    ${[[150, 50, 92, 622, 138, 11], [356, 26, 300, 640, 168, 29], [560, 56, 524, 610, 138, 47]].map(([x0, y0, x1, y1, width, seed]) => {
      const d = slash(x0, y0, x1, y1, width, seed, 60);
      return `<path d="${d}" fill="#050505" transform="translate(14 16)"/><path d="${d}" fill="url(#rip-fill)" stroke="#050505" stroke-width="7" stroke-linejoin="round"/><path d="${d}" fill="url(#rip-dots)" mask="url(#rip-mask)" opacity=".5"/>`;
    }).join('')}
  </g>
</svg>`;

/** Y2K four-point chrome sparkle. The gradient is referenced as an attribute so CSS holds no url() besides fonts. */
export const sparkle = (className = '') => `<svg class="sparkle ${className}" viewBox="0 0 100 100" fill="url(#chrome)" aria-hidden="true"><path d="M50 0C53 36 64 47 100 50 64 53 53 64 50 100 47 64 36 53 0 50 36 47 47 36 50 0Z"/></svg>`;

/** Rotating circular sticker text. */
export const spinBadge = text => `<svg viewBox="0 0 200 200" aria-hidden="true"><defs><path id="spin-path" d="M100 100m-74 0a74 74 0 1 1 148 0a74 74 0 1 1-148 0"/></defs>
  <circle cx="100" cy="100" r="97" fill="#050505" stroke="#a2f500" stroke-width="5"/><circle cx="100" cy="100" r="52" fill="none" stroke="#a2f500" stroke-width="2" stroke-dasharray="3 6"/>
  <g class="spin"><text><textPath href="#spin-path" textLength="455" lengthAdjust="spacing">${text}</textPath></text></g>
  <g fill="#a2f500" transform="translate(68 68)">${clawPaths.map(d => `<path d="${d}"/>`).join('')}</g></svg>`;

/** Decorative barcode strip. */
export function barcode(seed = 5, bars = 34) {
  const rand = rng(seed);
  let x = 0, out = '';
  for (let i = 0; i < bars; i++) {
    const width = 1 + Math.floor(rand() * 3);
    if (i % 2 === 0) out += `<rect x="${x}" width="${width}" height="30"/>`;
    x += width + (rand() > .7 ? 2 : 1);
  }
  return `<svg class="barcode" viewBox="0 0 ${x} 30" preserveAspectRatio="none" aria-hidden="true">${out}</svg>`;
}

/** Three slashes that tear across a card when a can is marked tried. */
export const cardStrike = `<svg class="strike" viewBox="0 0 200 200" preserveAspectRatio="none" aria-hidden="true">${[[60, -10, 20, 210, 46, 3], [112, -14, 78, 214, 54, 9], [166, -10, 138, 210, 46, 15]].map(([x0, y0, x1, y1, width, seed]) => `<path d="${slash(x0, y0, x1, y1, width, seed, 30)}"/>`).join('')}</svg>`;

const polar = (cx, cy, radius, degrees) => {
  const radians = (degrees - 90) * Math.PI / 180;
  return [cx + radius * Math.cos(radians), cy + radius * Math.sin(radians)];
};
const arc = (cx, cy, radius, from, to) => {
  const [x0, y0] = polar(cx, cy, radius, from), [x1, y1] = polar(cx, cy, radius, to);
  return `M${x0.toFixed(1)} ${y0.toFixed(1)}A${radius} ${radius} 0 ${to - from > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
};

/** Tachometer for tried progress. The needle sweeps from the previous to the current ratio. */
export function tach(ratio, previous = ratio) {
  const start = -120, sweep = 240, cx = 120, cy = 120, radius = 96;
  const angle = value => start + sweep * Math.max(0, Math.min(1, value));
  let ticks = '';
  for (let i = 0; i <= 20; i++) {
    const major = i % 2 === 0, degrees = start + sweep * i / 20;
    const [x0, y0] = polar(cx, cy, radius - (major ? 17 : 10), degrees), [x1, y1] = polar(cx, cy, radius - 3, degrees);
    ticks += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" class="${i >= 17 ? 'hot' : ''} ${major ? 'major' : ''}"/>`;
    if (major && i > 0 && i < 20) {
      const [tx, ty] = polar(cx, cy, radius - 31, degrees);
      ticks += `<text x="${tx.toFixed(1)}" y="${(ty + 4).toFixed(1)}" class="${i >= 17 ? 'hot' : ''}">${i / 2}</text>`;
    }
  }
  return `<svg class="tach" viewBox="0 0 240 190" aria-hidden="true">
    <path class="tach-track" d="${arc(cx, cy, radius, start, start + sweep)}"/>
    <path class="tach-red" d="${arc(cx, cy, radius, start + sweep * .85, start + sweep)}"/>
    ${ratio > 0 ? `<path class="tach-fill" d="${arc(cx, cy, radius, start, angle(ratio))}"/>` : ''}
    ${ticks}
    <g class="tach-needle" style="--from:${angle(previous).toFixed(1)}deg;--to:${angle(ratio).toFixed(1)}deg"><path d="M${cx - 5} ${cy + 16}L${cx} ${cy - radius + 14}L${cx + 5} ${cy + 16}Z"/></g>
    <circle class="tach-hub" cx="${cx}" cy="${cy}" r="11"/>
  </svg>`;
}
