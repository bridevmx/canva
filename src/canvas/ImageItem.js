// ImageItem.js — Item tipo imagen con crop y trim de bordes blancos

import { StickerItem, registerItemFactory, ITEM_TYPES, clamp } from './StickerItem.js?v=1.9.0';

export class ImageItem extends StickerItem {
  constructor(cfg = {}) {
    super({ ...cfg, type: ITEM_TYPES.IMAGE });
    this.src             = cfg.src ?? '';
    this.originalSrc    = cfg.originalSrc ?? cfg.src ?? '';
    this.fit            = cfg.fit ?? 'fill';
    this.whiteThreshold = cfg.whiteThreshold ?? 245;
  }

  static async fromFile(file) {
    const dataUrl = await fileToDataURL(file);
    const dims    = await imageDimensions(dataUrl);
    const maxSide = 280;
    let w, h;
    if (dims.w >= dims.h) { w = maxSide; h = Math.round(maxSide * dims.h / dims.w); }
    else                  { h = maxSide; w = Math.round(maxSide * dims.w / dims.h); }
    return new ImageItem({ src: dataUrl, originalSrc: dataUrl, w, h, fit: 'fill', whiteThreshold: 245 });
  }
}

registerItemFactory(ITEM_TYPES.IMAGE, ImageItem);

function fileToDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function imageDimensions(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = rej;
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

export { imageDimensions };