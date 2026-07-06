// ShapeItem.js — Item tipo forma (rectángulo o círculo) con relleno y borde

import { StickerItem, registerItemFactory, ITEM_TYPES } from './StickerItem.js';

export class ShapeItem extends StickerItem {
  constructor(cfg = {}) {
    super({ ...cfg, type: ITEM_TYPES.SHAPE });
    this.shapeType   = cfg.shapeType ?? 'rect';
    this.fillColor    = cfg.fillColor ?? '#3b82f6';
    this.strokeColor  = cfg.strokeColor ?? '#1e40af';
    this.strokeWidth  = cfg.strokeWidth ?? 0;
  }

  toShapeStyle() {
    return {
      background: this.fillColor,
      borderRadius: this.shapeType === 'circle' ? '50%' : '4px',
      border: (this.strokeWidth ?? 0) > 0 ? `${this.strokeWidth}px solid ${this.strokeColor}` : 'none',
      boxSizing: 'border-box'
    };
  }
}

registerItemFactory(ITEM_TYPES.SHAPE, ShapeItem);