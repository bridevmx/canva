// CanvasEditor.js — Núcleo del editor. Coordina items, paper, history, crop, pointer.

import { StickerItem, clamp, generateId, getRotatedBounds } from './StickerItem.js?v=2.0.0';
import { ImageItem }      from './ImageItem.js?v=2.0.0';
import { TextItem }       from './TextItem.js?v=2.0.0';
import { ShapeItem }     from './ShapeItem.js?v=2.0.0';
import { CropController } from './CropController.js?v=2.0.0';

import { HistoryManager } from './HistoryManager.js?v=2.0.0';
import { GuidesManager }  from './GuidesManager.js?v=2.0.0';
import { PointerController } from './PointerController.js?v=2.0.0';
import { PaperManager }   from './PaperManager.js?v=2.0.0';
import { FONTS }          from '../pb.config.js?v=2.0.0';

const ZOOM_MIN = 0.1, ZOOM_MAX = 3.0;
const PAPER_SIZES_W = { a4: 794, letter: 816 };

export class CanvasEditor {
  constructor() {
    this.items      = [];
    this.selectedIds = new Set();
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

  get selectedId() { const first = this.selectedIds.values().next().value; return first ?? null; }
  get selected() { return this.items.find(i => this.selectedIds.has(i.id)) || null; }
  get selectedCount() { return this.selectedIds.size; }
  isSelected(id) { return this.selectedIds.has(id); }
  select(id, additive = false) {
    if (!id) return;
    if (additive) {
      if (this.selectedIds.has(id)) this.selectedIds.delete(id);
      else this.selectedIds.add(id);
      if (this.selectedIds.size === 0) this.selectedIds.add(id);
    } else {
      this.selectedIds = new Set([id]);
    }
    this._expandSelectionToGroups();
  }

  _expandSelectionToGroups() {
    const groupIds = new Set();
    for (const id of this.selectedIds) {
      const item = this.items.find(i => i.id === id);
      if (item?.groupId) groupIds.add(item.groupId);
    }
    if (groupIds.size === 0) return;
    for (const item of this.items) {
      if (item.groupId && groupIds.has(item.groupId)) this.selectedIds.add(item.id);
    }
  }
  clearSelection() { this.selectedIds.clear(); }

  uid() { return generateId(); }
  nextZ() { return this.items.length ? Math.max(...this.items.map(i => i.z || 1)) + 1 : 1; }
  sortedItems() { return [...this.items].sort((a, b) => a.z - b.z); }
  itemsOnPage(p) { return this.sortedItems().filter(i => (i.page || 1) === p); }

  normalizeZ() { this.sortedItems().forEach((item, i) => item.z = i + 1); }

  toggleGrid() {
    this.showGrid = !this.showGrid;
    if (this.onToggleGrid) this.onToggleGrid(this.showGrid);
  }

  // ── Add elements ───────────────────────────────────
  addText(cfg = {}) {
    const item = new TextItem({ ...cfg, z: this.nextZ(), page: this.paper.activePage });
    this.items.push(item); this.select(item.id); this.history.push();
  }

  addShape(shapeType = 'rect') {
    const item = new ShapeItem({ shapeType, w: 200, h: 200, z: this.nextZ(), page: this.paper.activePage });
    this.items.push(item); this.select(item.id); this.history.push();
  }

  async addImageFromFile(file, offset = {}) {
    const item = await ImageItem.fromFile(file);
    item.x = offset.x ?? 40;
    item.y = offset.y ?? 40;
    item.z = this.nextZ();
    item.page = this.paper.activePage;
    this.items.push(item);
    this.select(item.id);
    this.history.push();
  }

  async addImageFromClipboardFile(file) {
    return this.addImageFromFile(file, { x: 80, y: 80 });
  }

  // ── Manipulaciones ──────────────────────────────────
  deleteSelected() {
    if (this.selectedIds.size === 0) return;
    this.items = this.items.filter(i => !this.selectedIds.has(i.id));
    this.selectedIds.clear();
    this.normalizeZ();
    this.history.push();
  }

  duplicateSelected() {
    if (this.selectedIds.size === 0) return;
    const sheet = this.paper.sheet;
    const newIds = [];
    const groupMap = new Map();
    for (const s of this.items.filter(i => this.selectedIds.has(i.id))) {
      const c = s.clone();
      c.id = this.uid();
      c.x = Math.min(s.x + 25, sheet.w - s.w);
      c.y = Math.min(s.y + 25, sheet.h - s.h);
      c.z = this.nextZ();
      c.page = this.paper.activePage;
      if (c.groupId) {
        if (!groupMap.has(c.groupId)) groupMap.set(c.groupId, this.uid());
        c.groupId = groupMap.get(c.groupId);
      }
      this.items.push(c);
      newIds.push(c.id);
    }
    this.selectedIds = new Set(newIds);
    this.history.push();
  }

  copySelected() {
    if (this.selectedIds.size === 0) return;
    this.clipboard = this.items
      .filter(i => this.selectedIds.has(i.id))
      .map(i => i.clone());
    this.pasteOffset = 0;
  }

  paste() {
    if (!this.clipboard || this.clipboard.length === 0) return;
    this.pasteOffset = (this.pasteOffset || 0) + 30;
    const sheet = this.paper.sheet;
    const newIds = [];
    const groupMap = new Map();
    for (const src of this.clipboard) {
      const c = src.clone();
      c.id = this.uid();
      c.x = Math.min(src.x + this.pasteOffset, sheet.w - c.w);
      c.y = Math.min(src.y + this.pasteOffset, sheet.h - c.h);
      c.z = this.nextZ();
      c.page = this.paper.activePage;
      c.locked = false;
      if (c.groupId) {
        if (!groupMap.has(c.groupId)) groupMap.set(c.groupId, this.uid());
        c.groupId = groupMap.get(c.groupId);
      }
      this.items.push(c);
      newIds.push(c.id);
    }
    this.selectedIds = new Set(newIds);
    this.history.push();
  }

  groupSelected() {
    if (this.selectedIds.size < 2) return;
    const groupId = this.uid();
    for (const item of this.items) {
      if (this.selectedIds.has(item.id)) item.groupId = groupId;
    }
    this.history.push();
  }

  ungroupSelected() {
    if (this.selectedIds.size === 0) return;
    for (const item of this.items) {
      if (this.selectedIds.has(item.id)) item.groupId = null;
    }
    this.history.push();
  }

  toggleVisibility(ids, target) {
    const set = new Set(ids);
    let changed = false;
    for (const item of this.items) {
      if (set.has(item.id)) {
        const next = target !== undefined ? target : !item.visible;
        if (item.visible !== next) { item.visible = next; changed = true; }
      }
    }
    if (changed) this.history.push();
  }

  setItemName(id, name) {
    const item = this.items.find(i => i.id === id);
    if (item) { item.name = name; this.history.push(); }
  }

  reorderLayer(dragId, targetId, position = 'before') {
    const dragItem = this.items.find(i => i.id === dragId);
    const targetItem = this.items.find(i => i.id === targetId);
    if (!dragItem || !targetItem || dragItem === targetItem) return;
    const sorted = this.sortedItems();
    const filtered = sorted.filter(i => i.id !== dragId);
    const targetIdx = filtered.findIndex(i => i.id === targetId);
    const insertIdx = position === 'after' ? targetIdx + 1 : targetIdx;
    filtered.splice(insertIdx, 0, dragItem);
    filtered.forEach((item, i) => item.z = i + 1);
    this.normalizeZ();
    this.history.push();
  }

  bringForward() {
    const selected = this.items.filter(i => this.selectedIds.has(i.id));
    selected.forEach((item, i) => { item.z = this.nextZ() + i; });
    this.normalizeZ();
    this.history.push();
  }
  sendToBack() {
    const selected = this.items.filter(i => this.selectedIds.has(i.id));
    selected.forEach((item, i) => { item.z = -selected.length + i; });
    this.normalizeZ();
    this.history.push();
  }
  moveOneUp() {
    if (this.selectedIds.size === 0) return;
    const items = this.sortedItems();
    const ids = new Set(this.selectedIds);
    const firstIdx = items.findIndex(i => ids.has(i.id));
    const lastIdx = items.reduce((last, item, i) => ids.has(item.id) ? i : last, -1);
    if (firstIdx === -1 || lastIdx === -1 || lastIdx >= items.length - 1) return;
    // Intercambiar z con el item inmediatamente encima del grupo
    const aboveZ = items[lastIdx + 1].z;
    const firstZ = items[firstIdx].z;
    items[lastIdx + 1].z = firstZ;
    for (let i = firstIdx; i <= lastIdx; i++) items[i].z++;
    this.normalizeZ();
    this.history.push();
  }
  moveOneDown() {
    if (this.selectedIds.size === 0) return;
    const items = this.sortedItems();
    const ids = new Set(this.selectedIds);
    const firstIdx = items.findIndex(i => ids.has(i.id));
    const lastIdx = items.reduce((last, item, i) => ids.has(item.id) ? i : last, -1);
    if (firstIdx <= 0 || lastIdx === -1) return;
    const belowZ = items[firstIdx - 1].z;
    const lastZ = items[lastIdx].z;
    items[firstIdx - 1].z = lastZ;
    for (let i = firstIdx; i <= lastIdx; i++) items[i].z--;
    this.normalizeZ();
    this.history.push();
  }

  // ── Alineación y distribución ───────────────────────
  _selectedItems() { return this.items.filter(i => this.selectedIds.has(i.id) && !i.locked); }

  _aabb(item) {
    const b = getRotatedBounds(item.w, item.h, item.rotation);
    return {
      left:   item.x + b.offsetX,
      top:    item.y + b.offsetY,
      right:  item.x + b.offsetX + b.w,
      bottom: item.y + b.offsetY + b.h,
      cx:     item.x + b.offsetX + b.w / 2,
      cy:     item.y + b.offsetY + b.h / 2,
      w: b.w, h: b.h, offsetX: b.offsetX, offsetY: b.offsetY
    };
  }

  alignLeft() {
    const sel = this._selectedItems();
    if (sel.length < 2) return;
    const target = Math.min(...sel.map(i => this._aabb(i).left));
    for (const item of sel) {
      const a = this._aabb(item);
      item.x = target - a.offsetX;
    }
    this.history.push();
  }
  alignCenterH() {
    const sel = this._selectedItems();
    if (sel.length < 2) return;
    const left = Math.min(...sel.map(i => this._aabb(i).left));
    const right = Math.max(...sel.map(i => this._aabb(i).right));
    const target = (left + right) / 2;
    for (const item of sel) {
      const a = this._aabb(item);
      item.x = target - a.offsetX - a.w / 2;
    }
    this.history.push();
  }
  alignRight() {
    const sel = this._selectedItems();
    if (sel.length < 2) return;
    const target = Math.max(...sel.map(i => this._aabb(i).right));
    for (const item of sel) {
      const a = this._aabb(item);
      item.x = target - a.offsetX - a.w;
    }
    this.history.push();
  }
  alignTop() {
    const sel = this._selectedItems();
    if (sel.length < 2) return;
    const target = Math.min(...sel.map(i => this._aabb(i).top));
    for (const item of sel) {
      const a = this._aabb(item);
      item.y = target - a.offsetY;
    }
    this.history.push();
  }
  alignCenterV() {
    const sel = this._selectedItems();
    if (sel.length < 2) return;
    const top = Math.min(...sel.map(i => this._aabb(i).top));
    const bottom = Math.max(...sel.map(i => this._aabb(i).bottom));
    const target = (top + bottom) / 2;
    for (const item of sel) {
      const a = this._aabb(item);
      item.y = target - a.offsetY - a.h / 2;
    }
    this.history.push();
  }
  alignBottom() {
    const sel = this._selectedItems();
    if (sel.length < 2) return;
    const target = Math.max(...sel.map(i => this._aabb(i).bottom));
    for (const item of sel) {
      const a = this._aabb(item);
      item.y = target - a.offsetY - a.h;
    }
    this.history.push();
  }

  distributeHorizontal() {
    const sel = this._selectedItems();
    if (sel.length < 3) return;
    const sorted = sel.map(item => ({ item, a: this._aabb(item) })).sort((a, b) => a.a.left - b.a.left);
    const minLeft = sorted[0].a.left;
    const maxRight = sorted[sorted.length - 1].a.right;
    const totalWidth = sorted.reduce((sum, { a }) => sum + a.w, 0);
    const gap = (maxRight - minLeft - totalWidth) / (sorted.length - 1);
    let x = minLeft;
    for (const { item, a } of sorted) {
      item.x = x - a.offsetX;
      x += a.w + gap;
    }
    this.history.push();
  }
  distributeVertical() {
    const sel = this._selectedItems();
    if (sel.length < 3) return;
    const sorted = sel.map(item => ({ item, a: this._aabb(item) })).sort((a, b) => a.a.top - b.a.top);
    const minTop = sorted[0].a.top;
    const maxBottom = sorted[sorted.length - 1].a.bottom;
    const totalHeight = sorted.reduce((sum, { a }) => sum + a.h, 0);
    const gap = (maxBottom - minTop - totalHeight) / (sorted.length - 1);
    let y = minTop;
    for (const { item, a } of sorted) {
      item.y = y - a.offsetY;
      y += a.h + gap;
    }
    this.history.push();
  }

  flipHorizontal() {
    const items = this._selectedItems();
    for (const item of items) item.flipX = !item.flipX;
    this.history.push();
  }
  flipVertical() {
    const items = this._selectedItems();
    for (const item of items) item.flipY = !item.flipY;
    this.history.push();
  }

  gridFill() {
    if (this.selectedIds.size !== 1) return;
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
    this.clearSelection();
    this.history.push();
    return { cols, rows, total: cols * rows };
  }

  // ── Crop / Trim ─────────────────────────────────────
  startCrop() { if (this.selectedIds.size === 1 && this.selected?.type === 'image') this.crop.start(this.selected); }
  cancelCrop() { this.crop.cancel(); }
  applyCrop()  { return this.crop.apply(); }

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

    if ((ev.key === 'Delete' || ev.key === 'Backspace') && this.selectedIds.size > 0) {
      ev.preventDefault(); this.deleteSelected();
      window.dispatchEvent(new CustomEvent('editor:change'));
    }
    if (ev.key.toLowerCase() === 'd' && (ev.ctrlKey || ev.metaKey) && this.selectedIds.size > 0) {
      ev.preventDefault(); this.duplicateSelected();
      window.dispatchEvent(new CustomEvent('editor:change'));
    }
    if (ev.key.toLowerCase() === 'c' && (ev.ctrlKey || ev.metaKey) && this.selectedIds.size > 0) {
      ev.preventDefault(); this.copySelected();
    }
    if (ev.key.toLowerCase() === 'v' && (ev.ctrlKey || ev.metaKey)) {
      if (this.clipboard && this.clipboard.length > 0) {
        ev.preventDefault(); this.paste();
        window.dispatchEvent(new CustomEvent('editor:change'));
      }
    }
    if (ev.key.toLowerCase() === 'g' && (ev.ctrlKey || ev.metaKey) && !ev.shiftKey && this.selectedIds.size > 1) {
      ev.preventDefault(); this.groupSelected();
      window.dispatchEvent(new CustomEvent('editor:change'));
    }
    if (ev.key.toLowerCase() === 'g' && (ev.ctrlKey || ev.metaKey) && ev.shiftKey && this.selectedIds.size > 0) {
      ev.preventDefault(); this.ungroupSelected();
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
    if (ev.key === '?' && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();
      window.dispatchEvent(new CustomEvent('editor:show-shortcuts'));
    }
    if (ev.key.toLowerCase() === 'l' && (ev.ctrlKey || ev.metaKey)) {
      ev.preventDefault();
      window.dispatchEvent(new CustomEvent('editor:toggle-layers'));
    }
    if (ev.key.toLowerCase() === 'g' && (ev.ctrlKey || ev.metaKey) && ev.altKey) {
      ev.preventDefault(); this.toggleGrid();
      window.dispatchEvent(new CustomEvent('editor:change'));
    }
    if ((ev.key === ']' || ev.key === '}') && (ev.ctrlKey || ev.metaKey) && this.selectedIds.size > 0) {
      ev.preventDefault();
      if (ev.shiftKey || ev.key === '}') this.bringForward();
      else this.moveOneUp();
      window.dispatchEvent(new CustomEvent('editor:change'));
    }
    if ((ev.key === '[' || ev.key === '{') && (ev.ctrlKey || ev.metaKey) && this.selectedIds.size > 0) {
      ev.preventDefault();
      if (ev.shiftKey || ev.key === '{') this.sendToBack();
      else this.moveOneDown();
      window.dispatchEvent(new CustomEvent('editor:change'));
    }
    if (ev.key.startsWith('Arrow') && this.selectedIds.size > 0) {
      ev.preventDefault();
      const step = ev.shiftKey ? 10 : 1;
      for (const item of this.items.filter(i => this.selectedIds.has(i.id) && !i.locked)) {
        if (ev.key === 'ArrowUp')    item.y -= step;
        if (ev.key === 'ArrowDown')  item.y += step;
        if (ev.key === 'ArrowLeft')  item.x -= step;
        if (ev.key === 'ArrowRight') item.x += step;
      }
      this.history.push();
      window.dispatchEvent(new CustomEvent('editor:change'));
    }
  }

  get fonts() { return FONTS; }
}