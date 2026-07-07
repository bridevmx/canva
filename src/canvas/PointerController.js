// PointerController.js — Drag/resize/rotate. FIX BUG B: swap w/h en rotación 90°/270°.

import { clamp } from './StickerItem.js';

const ACTION = { DRAG:'drag', RESIZE:'resize', ROTATE:'rotate', CROP_MOVE:'crop-move', CROP_RESIZE:'crop-resize' };

export class PointerController {
  constructor(editor) {
    Object.defineProperty(this, 'editor', { value: editor, enumerable: false, writable: true, configurable: true });
    this.action = null;
    this.notify = null;
    this._bindGlobal();
  }

  _itemEl(id) { return document.querySelector(`[data-item-id="${id}"]`); }

  startDrag(item, ev) {
    if (this.editor.crop.active || item.locked) { this.editor.select(item.id); return; }
    this.editor.select(item.id);
    this.action = { mode: ACTION.DRAG, id: item.id, startX: ev.clientX, startY: ev.clientY, itemX: item.x, itemY: item.y };
    document.body.classList.add('drag-locked');
  }

  startResize(item, ev) {
    if (this.editor.crop.active || item.locked) return;
    this.editor.select(item.id);
    this.action = { mode: ACTION.RESIZE, id: item.id, startX: ev.clientX, startY: ev.clientY, itemW: item.w, itemH: item.h };
    document.body.classList.add('drag-locked');
  }

  startRotate(item, sheetRect, ev) {
    this.editor.select(item.id);
    const scaleX = this.editor.canvasZoom;
    const cx = sheetRect.left + (item.x + item.w / 2) * scaleX;
    const cy = sheetRect.top  + (item.y + item.h / 2) * scaleX;
    const startAngle = Math.atan2(ev.clientY - cy, ev.clientX - cx);
    this.action = {
      mode: ACTION.ROTATE, id: item.id,
      centerX: cx, centerY: cy, startAngle, startRot: item.rotation || 0,
      _lastSnapped: item.rotation
    };
    document.body.classList.add('drag-locked');
  }

  // crop handlers delegados a CropController
  startCropMove(ev) {
    this.action = {
      mode: ACTION.CROP_MOVE, startX: ev.clientX, startY: ev.clientY,
      cropX: this.editor.crop.x, cropY: this.editor.crop.y
    };
    document.body.classList.add('drag-locked');
  }

  startCropResize(handle, ev) {
    this.action = {
      mode: ACTION.CROP_RESIZE, handle, startX: ev.clientX, startY: ev.clientY,
      cropX: this.editor.crop.x, cropY: this.editor.crop.y,
      cropW: this.editor.crop.w, cropH: this.editor.crop.h
    };
    document.body.classList.add('drag-locked');
  }

  _applyStyle(item) {
    const el = this._itemEl(item.id);
    if (!el) return;
    el.style.left    = item.x + 'px';
    el.style.top     = item.y + 'px';
    el.style.width   = item.w + 'px';
    el.style.height  = item.h + 'px';
    el.style.transform = item.rotation ? `rotate(${item.rotation}deg)` : 'none';
  }

  onMove(ev) {
    if (!this.action) return;
    const action = this.action;
    const editor = this.editor;
    const z = editor.canvasZoom;
    const item = editor.items.find(i => i.id === action.id);

    if (action.mode === ACTION.DRAG && item) {
      const dx = (ev.clientX - action.startX) / z;
      const dy = (ev.clientY - action.startY) / z;
      const sheet = editor.paper.sheet;
      item.x = clamp(action.itemX + dx, 0, sheet.w - item.w);
      item.y = clamp(action.itemY + dy, 0, sheet.h - item.h);
      editor.guides.compute(item, editor.items, item.x, item.y);
      this._applyStyle(item);
    }

    else if (action.mode === ACTION.RESIZE && item) {
      const dx = (ev.clientX - action.startX) / z;
      const dy = (ev.clientY - action.startY) / z;
      const sheet = editor.paper.sheet;
      item.w = clamp(action.itemW + dx, 20, sheet.w - item.x);
      item.h = clamp(action.itemH + dy, 20, sheet.h - item.y);
      this._applyStyle(item);
    }

    else if (action.mode === ACTION.ROTATE && item) {
      const cur  = Math.atan2(ev.clientY - action.centerY, ev.clientX - action.centerX);
      let diff = (cur - action.startAngle) * (180 / Math.PI);
      let newRot = action.startRot + diff;
      if (ev.shiftKey) newRot = Math.round(newRot / 15) * 15;
      item.rotation = Math.round(newRot) % 360;
      if (item.rotation < 0) item.rotation += 360;
      this._applyStyle(item);
    }

    else if (action.mode === ACTION.CROP_MOVE) {
      const dx = (ev.clientX - action.startX) / z;
      const dy = (ev.clientY - action.startY) / z;
      editor.crop.move(dx, dy, { x: action.cropX, y: action.cropY });
    }

    else if (action.mode === ACTION.CROP_RESIZE) {
      const dx = (ev.clientX - action.startX) / z;
      const dy = (ev.clientY - action.startY) / z;
      editor.crop.resize(action.handle, dx, dy, { x: action.cropX, y: action.cropY, w: action.cropW, h: action.cropH });
    }
  }

  end() {
    if (this.action && [ACTION.DRAG, ACTION.RESIZE, ACTION.ROTATE].includes(this.action.mode)) {
      this.editor.history.push();
    }
    this.action = null;
    this.editor.guides.clear();
    document.body.classList.remove('drag-locked');
    if (this.notify) this.notify();
  }

  _bindGlobal() {
    window.addEventListener('pointermove', ev => this.onMove(ev));
    window.addEventListener('pointerup',   () => this.end());
  }

  // FIX BUG B: intercambia w/h del item al rotar 90° o 270°, manteniendo centro
  snapRotateTo90(item) {
    if (![90, 270].includes(item.normalizedRotation)) return;
    const oldCx = item.x + item.w / 2;
    const oldCy = item.y + item.h / 2;
    const tmp = item.w;
    item.w = item.h;
    item.h = tmp;
    const sheet = this.editor.paper.sheet;
    item.x = clamp(oldCx - item.w / 2, 0, sheet.w - item.w);
    item.y = clamp(oldCy - item.h / 2, 0, sheet.h - item.h);
  }
}