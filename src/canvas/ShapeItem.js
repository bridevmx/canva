import { StickerItem, registerItemFactory, ITEM_TYPES } from './StickerItem.js?v=1.9.9';

const SHAPE_STYLES = {
  rect:     { label: 'Rectángulo', clipPath: '' },
  circle:   { label: 'Círculo',    clipPath: '' },
  star:     { label: 'Estrella',   clipPath: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' },
  heart:    { label: 'Corazón',    clipPath: 'polygon(50% 15%,70% 0%,85% 15%,100% 30%,100% 50%,50% 100%,0% 50%,0% 30%,15% 15%,30% 0%)' },
  triangle: { label: 'Triángulo', clipPath: 'polygon(50% 0%,0% 100%,100% 100%)' },
  hexagon:  { label: 'Hexágono',  clipPath: 'polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)' },
  bubble:   { label: 'Burbuja',   clipPath: '' },
};

export { SHAPE_STYLES };

export class ShapeItem extends StickerItem {
  constructor(cfg = {}) {
    super({ ...cfg, type: ITEM_TYPES.SHAPE });
    this.shapeType   = cfg.shapeType ?? 'rect';
    this.fillColor    = cfg.fillColor ?? '#3b82f6';
    this.strokeColor  = cfg.strokeColor ?? '#1e40af';
    this.strokeWidth  = cfg.strokeWidth ?? 0;
  }

  toShapeStyle() {
    const style = SHAPE_STYLES[this.shapeType] || SHAPE_STYLES.rect;
    return {
      background: this.fillColor,
      borderRadius: ['rect', 'bubble'].includes(this.shapeType) ? '8px' : (this.shapeType === 'circle' ? '50%' : '0'),
      clipPath: style.clipPath || undefined,
      border: (this.strokeWidth ?? 0) > 0 ? `${this.strokeWidth}px solid ${this.strokeColor}` : 'none',
      boxSizing: 'border-box'
    };
  }
}

registerItemFactory(ITEM_TYPES.SHAPE, ShapeItem);
