// StickerItem.js — Clase base para items del lienzo

export const ITEM_TYPES = { IMAGE: 'image', TEXT: 'text', SHAPE: 'shape' };

const FACTORY_REGISTRY = new Map();

export function registerItemFactory(type, klass) { FACTORY_REGISTRY.set(type, klass); }

export function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function clamp(v, min, max) { return Math.max(min, Math.min(max, Number(v))); }

export class StickerItem {
  constructor(cfg = {}) {
    this.id       = cfg.id ?? generateId();
    this.type     = cfg.type ?? 'shape';
    this.x        = cfg.x ?? 80;
    this.y        = cfg.y ?? 80;
    this.w        = cfg.w ?? 200;
    this.h        = cfg.h ?? 200;
    this.rotation = cfg.rotation ?? 0;
    this.opacity  = cfg.opacity ?? 1.0;
    this.locked   = cfg.locked ?? false;
    this.page     = cfg.page ?? 1;
    this.z        = cfg.z ?? 1;
  }

  static fromJSON(data) {
    const Klass = FACTORY_REGISTRY.get(data.type);
    return new (Klass || StickerItem)(data);
  }

  clone() { return StickerItem.fromJSON(JSON.parse(JSON.stringify(this))); }

  get normalizedRotation() { return ((this.rotation % 360) + 360) % 360; }

  isAxisAligned() { return [0, 90, 180, 270].includes(this.normalizedRotation); }

  isHorizontalRotated() { return [90, 270].includes(this.normalizedRotation); }

  swapDimensions() {
    const tmp = this.w;
    this.w = this.h;
    this.h = tmp;
  }

  keepCenterOn(fn) {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    fn(this);
    this.x = cx - this.w / 2;
    this.y = cy - this.h / 2;
  }

  toStyle(sheetW, sheetH) {
    return {
      left:   clamp(this.x, 0, sheetW - this.w) + 'px',
      top:    clamp(this.y, 0, sheetH - this.h) + 'px',
      width:  clamp(this.w, 20, sheetW) + 'px',
      height: clamp(this.h, 20, sheetH) + 'px',
      zIndex: this.z,
      transform: this.rotation ? `rotate(${this.rotation}deg)` : 'none',
      opacity: this.opacity ?? 1.0,
      cursor: this.locked ? 'default' : 'move'
    };
  }
}