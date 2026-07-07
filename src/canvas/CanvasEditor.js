// CanvasEditor.js — Núcleo del editor. Coordina items, paper, history, crop, pointer.

import { StickerItem, clamp, generateId } from './StickerItem.js?v=1.7.7';
import { ImageItem }      from './ImageItem.js?v=1.7.7';
import { TextItem }       from './TextItem.js?v=1.7.7';
import { ShapeItem }     from './ShapeItem.js?v=1.7.7';
import { CropController } from './CropController.js?v=1.7.7';
import { trimWhiteBorders } from './TrimService.js?v=1.7.7';
import { HistoryManager } from './HistoryManager.js?v=1.7.7';
import { GuidesManager }  from './GuidesManager.js?v=1.7.7';
import { PointerController } from './PointerController.js?v=1.7.7';
import { PaperManager }   from './PaperManager.js?v=1.7.7';
import { FONTS }          from '../pb.config.js?v=1.7.7';

const ZOOM_MIN = 0.1, ZOOM_MAX = 3.0;
const PAPER_SIZES_W = { a4: 794, letter: 816 };

export class CanvasEditor {
  constructor() {
    this.items      = [];
    this.selectedId = null;
    this.canvasZoom = 1.0;
    this.editingTextId = null;
    this.showGrid    = false;
    this.isPrinting  = false;
    this.isSaving    = false;

    this.paper      = new PaperManager('a4');
    this.history    = new HistoryManager(this);
    this.guides     = new GuidesManager();
    this.crop       = new CropController(this);
    this.pointer    = new PointerController(this);

    this._bindKeyboard();
  }

  get selected() { return this.items.find(i => i.id === this.selectedId) || null; }
  select(id) { this.selectedId = id; }
  clearSelection() { this.selectedId = null; }

  uid() { return generateId(); }
  nextZ() { return this.items.length ? Math.max(...this.items.map(i => i.z || 1)) + 1 : 1; }
  sortedItems() { return [...this.items].sort((a, b) => a.z - b.z); }
  itemsOnPage(p) { return this.sortedItems().filter(i => (i.page || 1) === p); }

  normalizeZ() { this.sortedItems().forEach((item, i) => item.z = i + 1); }

  // ── Add elements ───────────────────────────────────
  addText(cfg = {}) {
    const item = new TextItem({ ...cfg, z: this.nextZ(), page: this.paper.activePage });
    this.items.push(item); this.selectedId = item.id; this.history.push();
  }

  addShape(shapeType = 'rect') {
    const item = new ShapeItem({ shapeType, w: 200, h: 200, z: this.nextZ(), page: this.paper.activePage });
    this.items.push(item); this.selectedId = item.id; this.history.push();
  }

  async addImageFromFile(file, offset = {}) {
    const item = await ImageItem.fromFile(file);
    item.x = offset.x ?? 40;
    item.y = offset.y ?? 40;
    item.z = this.nextZ();
    item.page = this.paper.activePage;
    this.items.push(item);
    this.selectedId = item.id;
    this.history.push();
  }

  async addImageFromClipboardFile(file) {
    return this.addImageFromFile(file, { x: 80, y: 80 });
  }

  // ── Manipulaciones ──────────────────────────────────
  deleteSelected() {
    if (!this.selected) return;
    this.items = this.items.filter(i => i.id !== this.selectedId);
    this.selectedId = null; this.normalizeZ(); this.history.push();
  }

  duplicateSelected() {
    if (!this.selected) return;
    const s = this.selected;
    const c = s.clone();
    c.id = this.uid();
    const sheet = this.paper.sheet;
    c.x = Math.min(s.x + 25, sheet.w - s.w);
    c.y = Math.min(s.y + 25, sheet.h - s.h);
    c.z = this.nextZ();
    c.page = this.paper.activePage;
    this.items.push(c);
    this.selectedId = c.id;
    this.history.push();
  }

  bringForward() { if (this.selected) { this.selected.z = this.nextZ(); this.normalizeZ(); } }
  sendToBack()   { if (this.selected) { this.selected.z = 0; this.normalizeZ(); } }
  moveOneUp() {
    if (!this.selected) return;
    const items = this.sortedItems();
    const idx = items.findIndex(i => i.id === this.selectedId);
    if (idx === items.length - 1) return;
    [items[idx].z, items[idx + 1].z] = [items[idx + 1].z, items[idx].z];
    this.normalizeZ();
  }
  moveOneDown() {
    if (!this.selected) return;
    const items = this.sortedItems();
    const idx = items.findIndex(i => i.id === this.selectedId);
    if (idx <= 0) return;
    [items[idx].z, items[idx - 1].z] = [items[idx - 1].z, items[idx].z];
    this.normalizeZ();
  }

  gridFill() {
    if (!this.selected) return;
    const item = this.selected;
    const gap = 8;
    const sheet = this.paper.sheet;
    const cols = Math.max(1, Math.floor((sheet.w + gap) / (item.w + gap)));
    const rows = Math.max(1, Math.floor((sheet.h + gap) / (item.h + gap)));
    const newItems = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const copy = item.clone();
        copy.id = this.uid();
        copy.x = c * (item.w + gap);
        copy.y = r * (item.h + gap);
        copy.z = r * cols + c + 1;
        copy.locked = false;
        copy.page = this.paper.activePage;
        newItems.push(copy);
      }
    }
    this.items = this.items.filter(i => (i.page || 1) !== this.paper.activePage).concat(newItems);
    this.selectedId = null;
    this.history.push();
    return { cols, rows, total: cols * rows };
  }

  // ── Crop / Trim ─────────────────────────────────────
  startCrop() { if (this.selected?.type === 'image') this.crop.start(this.selected); }
  cancelCrop() { this.crop.cancel(); }
  applyCrop()  { return this.crop.apply(); }

  trimWhiteSelected() { if (this.selected?.type === 'image') return trimWhiteBorders(this.selected); }
  restoreOriginal()    { if (this.selected?.type === 'image' && this.selected.originalSrc) this.selected.src = this.selected.originalSrc; }

  // ── Zoom ───────────────────────────────────────────
  setZoom(z) { this.canvasZoom = Math.round(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z)) * 100) / 100; }
  zoomIn()   { this.setZoom(this.canvasZoom + 0.1); }
  zoomOut()  { this.setZoom(this.canvasZoom - 0.1); }
  zoomPercent() { return Math.round(this.canvasZoom * 100) + '%'; }

  fitZoom(container) {
    if (!container || container.clientWidth <= 0 || container.clientHeight <= 0) {
      this.canvasZoom = 0.8; // Fallback seguro si el contenedor aún no tiene dimensiones en el DOM
      return;
    }
    const availW = container.clientWidth - 48;
    const availH = container.clientHeight - 80;
    const fit = Math.min(availW / this.paper.sheet.w, availH / this.paper.sheet.h, 1.0);
    this.setZoom(fit); // Usa setZoom para asegurar el limitador de escala ZOOM_MIN/MAX
  }

  // ── Reset ───────────────────────────────────────────
  resetProject() {
    this.items = []; this.history.reset(); this.editingTextId = null;
    this.paper.reset(); this._currentRecordId = null; this.editingAsAdmin = false;
    this.history.push();
  }

  // ── Keyboard ───────────────────────────────────────
  _bindKeyboard() {
    window.addEventListener('keydown', ev => this._onKey(ev));
  }

  async _onKey(ev) {
    if (this.crop.active) {
      if (ev.key === 'Enter')    { ev.preventDefault(); ev.stopImmediatePropagation(); await this.applyCrop(); window.dispatchEvent(new CustomEvent('editor:change')); }
      else if (ev.key === 'Escape') { ev.preventDefault(); this.cancelCrop(); window.dispatchEvent(new CustomEvent('editor:change')); }
      return;
    }

    const tag = (ev.target.tagName || '').toLowerCase();
    const typing = ['input', 'textarea', 'select'].includes(tag) || ev.target.isContentEditable;
    if (typing) return;

    if ((ev.key === 'Delete' || ev.key === 'Backspace') && this.selectedId) {
      ev.preventDefault(); this.deleteSelected();
      window.dispatchEvent(new CustomEvent('editor:change'));
    }
    if (ev.key.toLowerCase() === 'd' && (ev.ctrlKey || ev.metaKey) && this.selectedId) {
      ev.preventDefault(); this.duplicateSelected();
      window.dispatchEvent(new CustomEvent('editor:change'));
    }
    if (ev.key.toLowerCase() === 'z' && (ev.ctrlKey || ev.metaKey)) {
      ev.preventDefault(); ev.shiftKey ? this.history.redo() : this.history.undo();
      window.dispatchEvent(new CustomEvent('editor:change'));
    }
    if (ev.key.toLowerCase() === 'y' && (ev.ctrlKey || ev.metaKey)) {
      ev.preventDefault(); this.history.redo();
      window.dispatchEvent(new CustomEvent('editor:change'));
    }
    if (ev.key.startsWith('Arrow') && this.selected && !this.selected.locked) {
      ev.preventDefault();
      const step = ev.shiftKey ? 10 : 1;
      if (ev.key === 'ArrowUp')    this.selected.y -= step;
      if (ev.key === 'ArrowDown')  this.selected.y += step;
      if (ev.key === 'ArrowLeft')  this.selected.x -= step;
      if (ev.key === 'ArrowRight') this.selected.x += step;
      this.history.push();
      window.dispatchEvent(new CustomEvent('editor:change'));
    }
  }

  get fonts() { return FONTS; }
}