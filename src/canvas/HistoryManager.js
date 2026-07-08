// HistoryManager.js — Snapshots JSON para undo/redo

import { StickerItem } from './StickerItem.js?v=1.9.1';

const MAX_HISTORY = 60;

export class HistoryManager {
  constructor(editor) {
    Object.defineProperty(this, 'editor', { value: editor, enumerable: false, writable: true, configurable: true });
    this.history = [];
    this.index   = -1;
  }

  push() {
    this.history = this.history.slice(0, this.index + 1);
    this.history.push(JSON.stringify(this.editor.items));
    if (this.history.length > MAX_HISTORY) this.history.shift();
    this.index = this.history.length - 1;
  }

  canUndo() { return this.index > 0; }
  canRedo() { return this.index < this.history.length - 1; }

  undo() {
    if (!this.canUndo()) return;
    this.index--;
    this._restore();
  }

  redo() {
    if (!this.canRedo()) return;
    this.index++;
    this._restore();
  }

  reset() { this.history = []; this.index = -1; }

  _restore() {
    const data = JSON.parse(this.history[this.index]);
    this.editor.items = data.map(d => StickerItem.fromJSON(d));
    this.editor.clearSelection();
  }
}