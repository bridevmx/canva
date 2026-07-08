// CropController.js — Lógica de recorte de imágenes.
// FIX BUG A: guard contra reentrancia en applyCropFromOverlay().
// FIX BUG B: actualiza tanto item.w como item.h proporcionalmente al recorte.

import { clamp } from './StickerItem.js?v=1.9.5';

export class CropController {
  constructor(editor) {
    Object.defineProperty(this, 'editor', { value: editor, enumerable: false, writable: true, configurable: true });
    this.active      = false;
    this.id          = null;
    this.x = 0; this.y = 0; this.w = 0; this.h = 0;
    this.bounds = { x: 0, y: 0, w: 0, h: 0 };
    this._applying = false;  // ← FIX BUG A
  }

  start(item) {
    if (!item || item.type !== 'image') return;
    this.active = true;
    this.id     = item.id;
    this.x = 0; this.y = 0;
    this.w = item.w; this.h = item.h;
    this.bounds = { x: 0, y: 0, w: item.w, h: item.h };
  }

  cancel() {
    this.active = false; this.id = null;
    this.x = 0; this.y = 0; this.w = 0; this.h = 0;
    this.bounds = { x: 0, y: 0, w: 0, h: 0 };
  }

  boxStyle() { return { left: this.x + 'px', top: this.y + 'px', width: this.w + 'px', height: this.h + 'px' }; }

  _clamp() {
    const b = this.bounds, min = 20;
    if (this.w < min) this.w = min;
    if (this.h < min) this.h = min;
    if (this.x < b.x) this.x = b.x;
    if (this.y < b.y) this.y = b.y;
    if (this.x + this.w > b.x + b.w) this.w = (b.x + b.w) - this.x;
    if (this.y + this.h > b.y + b.h) this.h = (b.y + b.h) - this.y;
    if (this.w < min) { this.w = min; this.x = Math.max(b.x, (b.x + b.w) - min); }
    if (this.h < min) { this.h = min; this.y = Math.max(b.y, (b.y + b.h) - min); }
  }

  move(deltaX, deltaY, origin) {
    this.x = origin.x + deltaX;
    this.y = origin.y + deltaY;
    this._clamp();
  }

  resize(handle, deltaX, deltaY, origin) {
    let x = origin.x, y = origin.y, w = origin.w, h = origin.h, min = 20;
    if (handle.includes('e')) w = Math.max(min, origin.w + deltaX);
    if (handle.includes('s')) h = Math.max(min, origin.h + deltaY);
    if (handle.includes('w')) { x = Math.min(origin.x + deltaX, origin.x + origin.w - min); w = origin.w - (x - origin.x); }
    if (handle.includes('n')) { y = Math.min(origin.y + deltaY, origin.y + origin.h - min); h = origin.h - (y - origin.y); }
    this.x = x; this.y = y; this.w = w; this.h = h;
    this._clamp();
  }

  async apply() {
    // ── FIX BUG A: si ya está aplicando, ignora la segunda llamada (Enter + click del botón enfocado)
    if (this._applying) return;
    this._applying = true;

    try {
      const item = this.editor.items.find(i => i.id === this.id);
      if (!item || item.type !== 'image') return;
      if (!this.active || this.id !== item.id) return;

      const result = await cropImageToDataUrl(item.src, this.x, this.y, this.w, this.h, item.w, item.h);
      if (!result) return;

      // ── FIX BUG B: actualiza AMBAS dimensiones proporcionalmente al recorte real
      const cropW = this.w, cropH = this.h;

      // primero clamp por sheet para no romper bounds
      const sheet = this.editor.paper.sheet;
      const newW = clamp(cropW, 20, sheet.w);
      const aspectRatio = result.naturalH / result.naturalW;
      const newH = clamp(newW * aspectRatio, 20, sheet.h);

      // mantener centro visual del recorte
      const oldCx = item.x + item.w / 2;
      const oldCy = item.y + item.h / 2;

      item.src = result.dataUrl;
      item.originalSrc = result.dataUrl;
      item.w = newW;
      item.h = newH;
      item.x = oldCx - newW / 2;
      item.y = oldCy - newH / 2;

      // clamp dentro de la hoja
      item.x = clamp(item.x, 0, sheet.w - item.w);
      item.y = clamp(item.y, 0, sheet.h - item.h);

      this.cancel();
      this.editor.history.push();
    } finally {
      this._applying = false;
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    }
  }
}

function cropImageToDataUrl(src, cropX, cropY, cropW, cropH, itemW, itemH) {
  return new Promise(async (res) => {
    const img = new Image();
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.src = src;
    try { await new Promise((r, rr) => { img.onload = r; img.onerror = rr; }); }
    catch { return res(null); }

    const scaleX = img.naturalWidth  / itemW;
    const scaleY = img.naturalHeight / itemH;
    const sx = Math.max(0, Math.round(cropX * scaleX));
    const sy = Math.max(0, Math.round(cropY * scaleY));
    let sw = Math.max(1, Math.round(cropW * scaleX));
    let sh = Math.max(1, Math.round(cropH * scaleY));
    sw = Math.min(sw, img.naturalWidth  - sx);
    sh = Math.min(sh, img.naturalHeight - sy);
    if (sw <= 0 || sh <= 0) return res(null);

    const out = document.createElement('canvas');
    out.width = sw; out.height = sh;
    out.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    res({ dataUrl: out.toDataURL('image/png'), naturalW: sw, naturalH: sh });
  });
}