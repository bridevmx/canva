// GuidesManager.js — Cálculo de guías de alineación (snap)

const THRESHOLD = 6;

export class GuidesManager {
  constructor() { this.guides = []; }

  clear() { this.guides = []; }

  compute(item, items, nx, ny) {
    const guides = [];
    const iEdgesV = [nx, nx + item.w / 2, nx + item.w];
    const iEdgesH = [ny, ny + item.h / 2, ny + item.h];

    for (const other of items) {
      if (other.id === item.id) continue;
      const oEV = [other.x, other.x + other.w / 2, other.x + other.w];
      const oEH = [other.y, other.y + other.h / 2, other.y + other.h];
      for (const ie of iEdgesV) for (const oe of oEV) if (Math.abs(ie - oe) < THRESHOLD) guides.push({ type: 'v', pos: oe });
      for (const ie of iEdgesH) for (const oe of oEH) if (Math.abs(ie - oe) < THRESHOLD) guides.push({ type: 'h', pos: oe });
    }
    const seen = new Set();
    this.guides = guides.filter(g => {
      const k = g.type + g.pos;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
}