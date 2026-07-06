// canvasView.js — Adapter entre CanvasEditor (POO) y Alpine (UI)

import { CanvasEditor } from './CanvasEditor.js';
import { CanvasPersistence } from './CanvasPersistence.js';
import { QuoteCalculator }   from '../ui/QuoteCalculator.js';
import { AuthManager }       from '../auth/AuthManager.js';
import { PRODUCTS, PAPER_SIZES } from '../pb.config.js';
import { rulerXStyle, rulerYStyle, gridStyle } from './RulerService.js';

const PX_PER_CM = 37.8095;

function registerStickerMaker(Alpine) {
  Alpine.data('stickerMaker', () => {
    const editor = new CanvasEditor();
    let persistence = null;
    let calculator  = null;
    let auth        = null;

    return {
      editor,
      products: PRODUCTS,
      materialType: 'RICE_04',
      printQuantity: 1,
      projectTitle: '',
      isSaveModalOpen: false,

      // ── getters delegados al editor
      get items()        { return editor.items; },
      get selected()     { return editor.selected; },
      get selectedId()   { return editor.selectedId; },
      get canvasZoom()   { return editor.canvasZoom; },
      get showGrid()     { return editor.showGrid; },
      get isSaving()     { return editor.isSaving; },
      get isPrinting()   { return editor.isPrinting; },
      get editingTextId(){ return editor.editingTextId; },
      get fonts()        { return editor.fonts; },
      get crop()         { return editor.crop; },
      get guides()       { return editor.guides.guides; },
      get sheet()        { return editor.paper.sheet; },
      get pagesCount()   { return editor.paper.pagesCount; },
      get activePage()   { return editor.paper.activePage; },
      get pageColors()   { return editor.paper.pageColors; },
      get paperSize()    { return editor.paper.paperSize; },
      get _editingAsAdmin() { return persistence?.editingAsAdmin || false; },

      get pageBg()       { return editor.paper.getPageColor(editor.paper.activePage); },

      get currentPageColor() { return editor.paper.getPageColor(editor.paper.activePage); },
      set currentPageColor(v) { editor.paper.setPageColor(editor.paper.activePage, v); },

      // ── Cotización reactiva
      get quote() {
        if (!calculator) return { total: 0, finalUnitPrice: 0, pct: 0, warning: null };
        return calculator.compute();
      },

      // ── Init ──────────────────────────────────────────
      async init() {
        window.addEventListener('paste', e => this.handlePaste(e));

        auth = new AuthManager();
        await auth.init();
        persistence = new CanvasPersistence(editor, auth.pb, auth);
        calculator = new QuoteCalculator(
          () => this.materialType,
          () => this.printQuantity,
          () => editor.paper.pagesCount
        );

        this._bindResize();
        await this._waitForRefs();

        editor.fitZoom(this.$refs.canvasMain);
        editor.history.push();

        // Touch listeners
        const main = this.$refs.canvasMain;
        main.addEventListener('touchstart', e => this.onCanvasTouchStart(e), { passive: true });
        main.addEventListener('touchmove',  e => this.onCanvasTouchMove(e),  { passive: false });
        main.addEventListener('touchend',   e => this.onCanvasTouchEnd(e),   { passive: true });

        // Load user projects
        await persistence.loadUserProjects();

        // Load project from ?id=
        const qs = new URLSearchParams(window.location.search);
        const id = qs.get('id');
        if (id) {
          try { await persistence.loadProject(id); }
          catch { alert('No se pudo cargar el proyecto.'); window.location.replace('/dashboard'); }
        }
      },

      _waitForRefs() { return this.$nextTick(); },
      _bindResize() {
        window.addEventListener('resize', () => editor.fitZoom(this.$refs.canvasMain));
      },

      // ── Selection
      select(id)         { editor.select(id); },
      clearSelection()   { editor.clearSelection(); },

      // ── Zoom
      zoomIn()  { editor.zoomIn(); },
      zoomOut() { editor.zoomOut(); },
      zoomPercent() { return editor.zoomPercent(); },
      fitZoom()  { editor.fitZoom(this.$refs.canvasMain); },

      // ── Print
      async printCanvas() {
        editor.clearSelection();
        editor.isPrinting = true;
        await this.$nextTick();
        setTimeout(() => { window.print(); editor.isPrinting = false; }, 150);
      },

      // ── Paper & pages
      setPage(p)        { editor.paper.setActive(p); editor.clearSelection(); },
      addPage()         { editor.paper.addPage(); editor.clearSelection(); },
      deletePage() {
        const p = this.activePage;
        if (!confirm(`¿Eliminar la Hoja ${p}?`)) return;
        editor.items = editor.paper.deletePage(editor.items, p) || editor.items;
        if (editor.paper.activePage > editor.paper.pagesCount) editor.paper.activePage = editor.paper.pagesCount;
        editor.clearSelection();
        editor.history.push();
      },
      updatePaperSize() {
        editor.paper.setSize(this.paperSize);
        this.$nextTick(() => editor.fitZoom(this.$refs.canvasMain));
        this._injectPrintCss();
      },
      _injectPrintCss() {
        let el = document.getElementById('print-page-style');
        if (!el) { el = document.createElement('style'); el.id = 'print-page-style'; document.head.appendChild(el); }
        el.innerHTML = editor.paper.printCss();
      },

      // ── Elementos
      addText()     { editor.addText(); },
      addShape(t)   { editor.addShape(t); },
      async handleFiles(event) {
        const files = [...(event.target.files || [])];
        for (let i = 0; i < files.length; i++) {
          await editor.addImageFromFile(files[i], { x: 40 + ((i * 30) % 180), y: 40 + ((i * 30) % 180) });
        }
        event.target.value = '';
      },
      async handlePaste(event) {
        const items = [...(event.clipboardData?.items || [])];
        const imgItem = items.find(i => i.type.startsWith('image/'));
        if (!imgItem) return;
        const file = imgItem.getAsFile();
        if (file) await editor.addImageFromClipboardFile(file);
      },
      duplicateSelected() { editor.duplicateSelected(); },
      deleteSelected()    { editor.deleteSelected(); },
      bringForward()      { editor.bringForward(); },
      sendToBack()        { editor.sendToBack(); },
      moveOneUp()         { editor.moveOneUp(); },
      moveOneDown()       { editor.moveOneDown(); },

      sortedItems()  { return editor.sortedItems(); },
      itemsOnPage(p) { return editor.itemsOnPage(p); },
      itemStyle(item){ return item.toStyle(editor.paper.sheet.w, editor.paper.sheet.h); },

      // crop handles (Array estable para x-for)
      get cropHandles() { return ['nw','n','ne','e','se','s','sw','w']; },

      set showGrid(v) { editor.showGrid = v; },

      // ── Crop
      startCropMode()             { editor.startCrop(); },
      async applyCropFromOverlay() { await editor.applyCrop(); },
      cancelCropMode()            { editor.cancelCrop(); },

      // ── Trim
      async trimWhiteBorders() {
        await editor.trimWhiteSelected();
        editor.history.push();
      },
      restoreOriginalImage() { editor.restoreOriginal(); editor.history.push(); },

      // ── Grid fill
      gridFill() {
        const r = editor.gridFill();
        if (r) alert(`Cuadrícula: ${r.cols}×${r.rows} = ${r.total} stickers`);
      },

      // ── Reset
      resetProject() {
        if (!confirm('¿Borrar todo el lienzo e iniciar un nuevo proyecto?')) return;
        editor.resetProject();
        persistence.reset();
        window.history.replaceState({}, document.title, window.location.pathname);
      },

      // ── Rulers & grid
      getRulerXStyle() { return rulerXStyle(); },
      getRulerYStyle() { return rulerYStyle(); },
      getGridStyle()   { return gridStyle(); },

      // ── Pointer handlers (delegados a PointerController)
      onItemPointerDown(ev, id) {
        const item = editor.items.find(i => i.id === id);
        if (!item) return;
        if (item.locked) { editor.select(id); return; }
        editor.pointer.startDrag(item, ev);
        ev.currentTarget?.setPointerCapture?.(ev.pointerId);
      },
      onResizeHandlePointerDown(ev, id) {
        const item = editor.items.find(i => i.id === id);
        if (!item) return;
        editor.pointer.startResize(item, ev);
        ev.currentTarget?.setPointerCapture?.(ev.pointerId);
      },
      onRotateHandlePointerDown(ev, id) {
        const item = editor.items.find(i => i.id === id);
        if (!item) return;
        const sheetRect = this.$refs.sheet.getBoundingClientRect();
        editor.pointer.startRotate(item, sheetRect, ev);
        ev.currentTarget?.setPointerCapture?.(ev.pointerId);
      },

      // Crop pointer handlers (delegados a PointerController)
      startCropMove(ev) {
        editor.pointer.startCropMove(ev);
        ev.currentTarget?.setPointerCapture?.(ev.pointerId);
      },
      startCropResize(ev, handle) {
        editor.pointer.startCropResize(handle, ev);
        ev.currentTarget?.setPointerCapture?.(ev.pointerId);
      },

      // ── Save
      async saveProject() {
        const baseProd = PRODUCTS.find(p => p.code === this.materialType);
        await persistence.saveProject({
          title: this.projectTitle,
          materialType: this.materialType,
          printQuantity: this.printQuantity,
          quote: { ...this.quote, basePrice: baseProd?.precio },
          pageBg: this.pageBg
        });
        alert(persistence.editingAsAdmin ? 'Cambios guardados' : '¡Pedido enviado!');
      },

      // ── Touch (pinch zoom)
      pinch: { active: false, startDist: 0, startZoom: 1 },
      onCanvasTouchStart(e) {
        if (e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          this.pinch = { active: true, startDist: Math.hypot(dx, dy), startZoom: editor.canvasZoom };
        }
      },
      onCanvasTouchMove(e) {
        if (this.pinch.active && e.touches.length === 2) {
          e.preventDefault();
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          editor.setZoom(this.pinch.startZoom * (Math.hypot(dx, dy) / this.pinch.startDist));
        }
      },
      onCanvasTouchEnd(e) {
        if (e.touches.length < 2) this.pinch = { active: false, startDist: 0, startZoom: 1 };
      }
    };
  });
}

// ── Bootstrap: registrar con Alpine (maneja race condition con defer) ──────
if (window.Alpine) {
  registerStickerMaker(window.Alpine);
} else {
  document.addEventListener('alpine:init', () => registerStickerMaker(window.Alpine));
}