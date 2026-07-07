// PaperManager.js — Gestión de tamaño de papel y páginas múltiples

import { PAPER_SIZES } from '../pb.config.js?v=1.7.3';

export class PaperManager {
  constructor(paperSize = 'a4') {
    this.paperSize = paperSize;
    this.pagesCount = 1;
    this.activePage = 1;
    this.pageColors  = { 1: '#ffffff' };
    this.sheet = this._sizeOf(paperSize);
  }

  setSize(size) {
    this.paperSize = size;
    this.sheet = this._sizeOf(size);
  }

  get pgSizeLabel() { return PAPER_SIZES[this.paperSize]?.label || 'A4'; }

  printCss() {
    const isA4 = this.paperSize === 'a4';
    return `@page{size:${isA4 ? 'A4' : 'letter'};margin:0}` +
      `@media print{.sheet{width:${isA4 ? '210mm' : '8.5in'}!important;` +
      `height:${isA4 ? '297mm' : '11in'}!important;` +
      `page-break-after: always; break-after: page;}}`;
  }

  addPage() { this.pagesCount++; this.activePage = this.pagesCount; }

  deletePage(items, page) {
    if (this.pagesCount <= 1) return;
    const remaining = items.filter(i => (i.page || 1) !== page);
    remaining.forEach(i => { if ((i.page || 1) > page) i.page--; });
    return remaining;
  }

  setActive(p) { this.activePage = p; }

  setPageColor(page, color) { this.pageColors[page] = color; }
  getPageColor(page) { return this.pageColors[page] || '#ffffff'; }

  reset() {
    this.pagesCount = 1;
    this.activePage = 1;
    this.pageColors  = { 1: '#ffffff' };
  }

  _maxPageFrom(items) {
    let max = 1;
    items.forEach(i => { if ((i.page ?? 1) > max) max = i.page; });
    return max;
  }

  syncFrom(items) {
    this.pagesCount = this._maxPageFrom(items);
    this.activePage = 1;
  }

  _sizeOf(size) { return { w: PAPER_SIZES[size].w, h: PAPER_SIZES[size].h }; }
}