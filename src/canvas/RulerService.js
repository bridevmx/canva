// RulerService.js — Genera los data-URIs SVG para reglas y cuadrícula

export const PX_PER_CM = 37.8095;

export function rulerXStyle() {
  const w = 794;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20"><rect width="100%" height="100%" fill="white"/>`;
  for (let i = 0; i <= 21; i++) {
    const x = i * PX_PER_CM;
    svg += `<line x1="${x}" y1="0" x2="${x}" y2="20" stroke="#64748b" stroke-width="1.5"/>`;
    if (i > 0) svg += `<text x="${x + 3}" y="10" font-family="sans-serif" font-size="9" font-weight="bold" fill="#475569">${i}</text>`;
    for (let j = 1; j < 10; j++) {
      if (i === 21) break;
      const mx = x + j * (PX_PER_CM / 10);
      const mY = (j === 5) ? 10 : 15;
      svg += `<line x1="${mx}" y1="${mY}" x2="${mx}" y2="20" stroke="#94a3b8" stroke-width="1"/>`;
    }
  }
  svg += `</svg>`;
  return { backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}')`, backgroundRepeat: 'no-repeat' };
}

export function rulerYStyle() {
  const h = 1123;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="${h}"><rect width="100%" height="100%" fill="white"/>`;
  for (let i = 0; i <= 29; i++) {
    const y = i * PX_PER_CM;
    svg += `<line x1="0" y1="${y}" x2="20" y2="${y}" stroke="#64748b" stroke-width="1.5"/>`;
    if (i > 0) svg += `<text x="2" y="${y + 10}" font-family="sans-serif" font-size="9" font-weight="bold" fill="#475569">${i}</text>`;
    for (let j = 1; j < 10; j++) {
      if (i === 29) break;
      const my = y + j * (PX_PER_CM / 10);
      const mX = (j === 5) ? 10 : 15;
      svg += `<line x1="${mX}" y1="${my}" x2="20" y2="${my}" stroke="#94a3b8" stroke-width="1"/>`;
    }
  }
  svg += `</svg>`;
  return { backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}')`, backgroundRepeat: 'no-repeat' };
}

export function gridStyle() {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PX_PER_CM}" height="${PX_PER_CM}"><rect width="${PX_PER_CM}" height="${PX_PER_CM}" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="1" stroke-dasharray="2,2"/></svg>`;
  return { backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}')` };
}