// StickerItem.js — Clase base para items del lienzo

export const ITEM_TYPES = { IMAGE: 'image', TEXT: 'text', SHAPE: 'shape' };

const FACTORY_REGISTRY = new Map();

export function registerItemFactory(type, klass) { FACTORY_REGISTRY.set(type, klass); }

export function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function clamp(v, min, max) { return Math.max(min, Math.min(max, Number(v))); }

/**
 * Calcula el Axis-Aligned Bounding Box (AABB) de un rectángulo rotado.
 * Devuelve el tamaño del AABB y el offset desde la esquina superior izquierda
 * del rectángulo original hasta la esquina superior izquierda del AABB.
 */
export function getRotatedBounds(w, h, rotation) {
  const rad = Math.abs(rotation || 0) * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const aabbW = w * cos + h * sin;
  const aabbH = w * sin + h * cos;
  return {
    w: aabbW,
    h: aabbH,
    // AABB top-left = original top-left + offset
    offsetX: (w - aabbW) / 2,
    offsetY: (h - aabbH) / 2
  };
}

export class StickerItem {
  constructor(cfg = {}) {
    this.id       = cfg.id ?? generateId();
    this.type     = cfg.type ?? 'shape';
    this.x        = cfg.x ?? 80;
    this.y        = cfg.y ?? 80;
    this.w        = cfg.w ?? 200;
    this.h        = cfg.h ?? 200;
    this.rotation = cfg.rotation ?? 0;
    this.flipX    = cfg.flipX ?? false;
    this.flipY    = cfg.flipY ?? false;
    this.opacity  = cfg.opacity ?? 1.0;
    this.locked   = cfg.locked ?? false;
    this.page     = cfg.page ?? 1;
    this.z        = cfg.z ?? 1;
    this.groupId  = cfg.groupId ?? null;
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
    // Para items rotados permitimos que el rectángulo original se salga del lienzo
    // hasta el AABB, de forma que el contenido visual pueda llegar al borde.
    const bounds = getRotatedBounds(this.w, this.h, this.rotation);
    const minX = -bounds.offsetX;
    const minY = -bounds.offsetY;
    const maxX = sheetW - this.w + bounds.offsetX;
    const maxY = sheetH - this.h + bounds.offsetY;
    return {
      left:   clamp(this.x, minX, maxX) + 'px',
      top:    clamp(this.y, minY, maxY) + 'px',
      width:  clamp(this.w, 20, sheetW) + 'px',
      height: clamp(this.h, 20, sheetH) + 'px',
      zIndex: this.z,
      transform: this._buildTransform(),
      opacity: this.opacity ?? 1.0,
      cursor: this.locked ? 'default' : 'move'
    };
  }

  _buildTransform() {
    let t = '';
    if (this.flipX) t += ' scaleX(-1)';
    if (this.flipY) t += ' scaleY(-1)';
    if (this.rotation) t += ` rotate(${this.rotation}deg)`;
    return t.trim() || 'none';
  }
}