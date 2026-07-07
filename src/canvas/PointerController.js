// PointerController.js — Drag/resize/rotate. FIX BUG B: swap w/h en rotación 90°/270°.

import { clamp } from './StickerItem.js?v=1.7.4';

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

  _applyCropStyle() {
    const el = document.querySelector('.crop-box');
    if (!el) return;
    el.style.left   = this.editor.crop.x + 'px';
    el.style.top    = this.editor.crop.y + 'px';
    el.style.width  = this.editor.crop.w + 'px';
    el.style.height = this.editor.crop.h + 'px';
  }

  _applyGuidesStyle(sheetEl, guides, sheetW, sheetH) {
    sheetEl.querySelectorAll('.temp-guide').forEach(el => el.remove());
    for (const guide of guides) {
      const gEl = document.createElement('div');
      gEl.className = 'temp-guide ' + (guide.type === 'v' ? 'guide-v' : 'guide-h');
      if (guide.type === 'v') {
        gEl.style.left = guide.pos + 'px';
        gEl.style.height = sheetH + 'px';
        gEl.style.top = '0';
      } else {
        gEl.style.top = guide.pos + 'px';
        gEl.style.width = sheetW + 'px';
        gEl.style.left = '0';
      }
      sheetEl.appendChild(gEl);
    }
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
      let nx = action.itemX + dx;
      let ny = action.itemY + dy;
      
      // Calcular guías para snapping
      editor.guides.compute(item, editor.items, nx, ny);
      
      // Aplicar snapping magnético si está a menos de 6px
      for (const guide of editor.guides.guides) {
        if (guide.type === 'v') {
          if (Math.abs(nx - guide.pos) < 6) { nx = guide.pos; }
          else if (Math.abs(nx + item.w / 2 - guide.pos) < 6) { nx = guide.pos - item.w / 2; }
          else if (Math.abs(nx + item.w - guide.pos) < 6) { nx = guide.pos - item.w; }
        } else if (guide.type === 'h') {
          if (Math.abs(ny - guide.pos) < 6) { ny = guide.pos; }
          else if (Math.abs(ny + item.h / 2 - guide.pos) < 6) { ny = guide.pos - item.h / 2; }
          else if (Math.abs(ny + item.h - guide.pos) < 6) { ny = guide.pos - item.h; }
        }
      }
      
      item.x = clamp(nx, 0, sheet.w - item.w);
      item.y = clamp(ny, 0, sheet.h - item.h);
      
      // Re-calcular guías en la posición final (snapped/clamped) para dibujarlas
      editor.guides.compute(item, editor.items, item.x, item.y);
      this._applyStyle(item);
      
      // Dibujar guías temporalmente en el DOM
      const el = this._itemEl(item.id);
      const sheetEl = el ? el.closest('.sheet') : null;
      if (sheetEl) {
        this._applyGuidesStyle(sheetEl, editor.guides.guides, sheet.w, sheet.h);
      }
    }

    else if (action.mode === ACTION.RESIZE && item) {
      let dx = (ev.clientX - action.startX) / z;
      let dy = (ev.clientY - action.startY) / z;
      const sheet = editor.paper.sheet;

      // Cuando el item está rotado, proyectamos el movimiento del mouse
      // sobre los ejes locales del item para que el resize sea natural.
      if (item.rotation) {
        const rad = item.rotation * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const localDx = dx * cos + dy * sin;
        const localDy = -dx * sin + dy * cos;
        dx = localDx;
        dy = localDy;
      }

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
      this._applyCropStyle();
    }

    else if (action.mode === ACTION.CROP_RESIZE) {
      const dx = (ev.clientX - action.startX) / z;
      const dy = (ev.clientY - action.startY) / z;
      editor.crop.resize(action.handle, dx, dy, { x: action.cropX, y: action.cropY, w: action.cropW, h: action.cropH });
      this._applyCropStyle();
    }
  }

  end() {
    if (this.action && [ACTION.DRAG, ACTION.RESIZE, ACTION.ROTATE].includes(this.action.mode)) {
      this.editor.history.push();
    }
    document.querySelectorAll('.temp-guide').forEach(el => el.remove());
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