// TextItem.js — Item tipo texto con tipografía, sombra y contorno

import { StickerItem, registerItemFactory, ITEM_TYPES } from './StickerItem.js?v=1.8.4';

export class TextItem extends StickerItem {
  constructor(cfg = {}) {
    super({ ...cfg, type: ITEM_TYPES.TEXT });
    this.text          = cfg.text ?? 'Nuevo texto';
    this.fontFamily    = cfg.fontFamily ?? 'Montserrat, sans-serif';
    this.fontSize      = cfg.fontSize ?? 42;
    this.color         = cfg.color ?? '#111827';
    this.fontWeight    = cfg.fontWeight ?? '700';

    this.textShadow    = cfg.textShadow ?? false;
    this.shadowColor    = cfg.shadowColor ?? '#000000';
    this.shadowBlur    = cfg.shadowBlur ?? 4;
    this.shadowOffsetX = cfg.shadowOffsetX ?? 2;
    this.shadowOffsetY = cfg.shadowOffsetY ?? 2;

    this.textOutline    = cfg.textOutline ?? false;
    this.outlineColor   = cfg.outlineColor ?? '#000000';
    this.outlineWidth   = cfg.outlineWidth ?? 2;
  }

  toTextStyle() {
    const style = {
      fontFamily: this.fontFamily,
      color: this.color,
      fontSize: this.fontSize + 'px',
      fontWeight: this.fontWeight
    };
    if (this.textShadow) {
      style.textShadow = `${this.shadowOffsetX}px ${this.shadowOffsetY}px ${this.shadowBlur}px ${this.shadowColor}`;
    }
    if (this.textOutline) {
      style['-webkit-text-stroke'] = `${this.outlineWidth}px ${this.outlineColor}`;
    }
    return style;
  }
}

registerItemFactory(ITEM_TYPES.TEXT, TextItem);