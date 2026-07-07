// canvasView.js — Adapter entre CanvasEditor (POO) y Alpine (UI)

import { CanvasEditor } from './CanvasEditor.js?v=1.4.0';
import { CanvasPersistence } from './CanvasPersistence.js?v=1.4.0';
import { QuoteCalculator }   from '../ui/QuoteCalculator.js?v=1.4.0';
import { AuthManager }       from '../auth/AuthManager.js?v=1.4.0';
import { PRODUCTS, PAPER_SIZES, ALPINE_CDN_URL } from '../pb.config.js?v=1.4.0';
import { rulerXStyle, rulerYStyle, gridStyle } from './RulerService.js?v=1.4.0';

const PX_PER_CM = 37.8095;

function registerStickerMaker(Alpine) {
  Alpine.data('stickerMaker', () => {
    const editor = new CanvasEditor();
    let persistence = null;
    let calculator  = null;
    let auth        = null;

    function sync() {
      // Copia superficial: mismos objetos, nuevo array reactivo
      this._items = [...editor.items];
      this._selectedId = editor.selectedId;
    }

    return {
      editor,
      products: PRODUCTS,
      materialType: 'RICE_04',
      printQuantity: 1,
      projectTitle: '',
      isSaveModalOpen: false,
      canvasZoom: 1.0,

      // Arrays/ids reactivos sincronizados con el editor raw
      _items: [],
      _selectedId: null,

      get items()          { return this._items; },
      get selectedId()     { return this._selectedId; },
      get selected()       { return this._items.find(i => i.id === this._selectedId) || null; },
      get showGrid()       { return editor.showGrid; },
      get isSaving()       { return editor.isSaving; },
      get isPrinting()     { return editor.isPrinting; },
      get editingTextId()  { return editor.editingTextId; },
      get fonts()          { return editor.fonts; },
      get crop()           { return editor.crop; },
      get guides()         { return editor.guides.guides; },
      get sheet()          { return editor.paper.sheet; },
      get pagesCount()     { return editor.paper.pagesCount; },
      get activePage()     { return editor.paper.activePage; },
      get pageColors()     { return editor.paper.pageColors; },
      get paperSize()      { return editor.paper.paperSize; },
      get _editingAsAdmin(){ return persistence?.editingAsAdmin || false; },
      get pageBg()         { return editor.paper.getPageColor(editor.paper.activePage); },
      get currentPageColor(){ return editor.paper.getPageColor(editor.paper.activePage); },
      set currentPageColor(v) { editor.paper.setPageColor(editor.paper.activePage, v); },

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
        this.syncZoom();
        editor.history.push();
        sync.call(this);

        const main = this.$refs.canvasMain;
        main.addEventListener('touchstart', e => this.onCanvasTouchStart(e), { passive: true });
        main.addEventListener('touchmove',  e => this.onCanvasTouchMove(e),  { passive: false });
        main.addEventListener('touchend',   e => this.onCanvasTouchEnd(e),   { passive: true });

        await persistence.loadUserProjects();

        const qs = new URLSearchParams(window.location.search);
        const id = qs.get('id');
        if (id) {
          try {
            await persistence.loadProject(id);
            this.syncZoom();
          }
          catch { alert('No se pudo cargar el proyecto.'); window.location.replace('/dashboard'); }
        }
      },

      _waitForRefs() { return this.$nextTick(); },
      _bindResize() {
        window.addEventListener('resize', () => {
          editor.fitZoom(this.$refs.canvasMain);
          this.syncZoom();
        });
      },

      // ── Selection
      select(id)         { editor.select(id); sync.call(this); },
      clearSelection()   { editor.clearSelection(); sync.call(this); },

      // ── Zoom
      syncZoom() { this.canvasZoom = editor.canvasZoom; },
      zoomIn()  { editor.zoomIn(); this.syncZoom(); },
      zoomOut() { editor.zoomOut(); this.syncZoom(); },
      zoomPercent() { return Math.round(this.canvasZoom * 100) + '%'; },
      fitZoom()  { editor.fitZoom(this.$refs.canvasMain); this.syncZoom(); },

      // ── Undo/Redo
      undo()        { editor.history.undo(); sync.call(this); },
      redo()        { editor.history.redo(); sync.call(this); },
      canUndo()     { return editor.history.canUndo(); },
      canRedo()     { return editor.history.canRedo(); },
      pushHistory() { editor.history.push(); },

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
        sync.call(this);
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
      addText()     { editor.addText(); sync.call(this); },
      addShape(t)   { editor.addShape(t); sync.call(this); },
      async handleFiles(event) {
        const files = [...(event.target.files || [])];
        for (let i = 0; i < files.length; i++) {
          await editor.addImageFromFile(files[i], { x: 40 + ((i * 30) % 180), y: 40 + ((i * 30) % 180) });
        }
        event.target.value = '';
        sync.call(this);
      },
      async handlePaste(event) {
        const items = [...(event.clipboardData?.items || [])];
        const imgItem = items.find(i => i.type.startsWith('image/'));
        if (!imgItem) return;
        const file = imgItem.getAsFile();
        if (file) await editor.addImageFromClipboardFile(file);
        sync.call(this);
      },
      duplicateSelected() { editor.duplicateSelected(); sync.call(this); },
      deleteSelected()    { editor.deleteSelected(); sync.call(this); },
      bringForward()      { editor.bringForward(); sync.call(this); },
      sendToBack()        { editor.sendToBack(); sync.call(this); },
      moveOneUp()         { editor.moveOneUp(); sync.call(this); },
      moveOneDown()       { editor.moveOneDown(); sync.call(this); },

      sortedItems()  { return [...this._items].sort((a, b) => a.z - b.z); },
      itemsOnPage(p) { return this.sortedItems().filter(i => (i.page || 1) === p); },
      itemStyle(item){ return item.toStyle(editor.paper.sheet.w, editor.paper.sheet.h); },

      get cropHandles() { return ['nw','n','ne','e','se','s','sw','w']; },

      set showGrid(v) { editor.showGrid = v; },

      // ── Crop
      startCropMode()               { editor.startCrop(); },
      async applyCropFromOverlay()  { await editor.applyCrop(); sync.call(this); },
      cancelCropMode()              { editor.cancelCrop(); },
      cropBoxStyle()                { return editor.crop.boxStyle(); },

      // ── Trim
      async trimWhiteBorders() {
        await editor.trimWhiteSelected();
        editor.history.push();
        sync.call(this);
      },
      restoreOriginalImage() { editor.restoreOriginal(); editor.history.push(); sync.call(this); },

      // ── Grid fill
      gridFill() {
        const r = editor.gridFill();
        if (r) alert(`Cuadrícula: ${r.cols}×${r.rows} = ${r.total} stickers`);
        sync.call(this);
      },

      // ── Reset
      resetProject() {
        if (!confirm('¿Borrar todo el lienzo e iniciar un nuevo proyecto?')) return;
        editor.resetProject();
        persistence.reset();
        window.history.replaceState({}, document.title, window.location.pathname);
        sync.call(this);
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
          this.syncZoom();
        }
      },
      onCanvasTouchEnd(e) {
        if (e.touches.length < 2) this.pinch = { active: false, startDist: 0, startZoom: 1 };
      }
    };
  });
}

// ── Bootstrap: registrar con Alpine garantizando el orden de carga ────────
// PROMESA: el listener alpine:init SIEMPRE se añade antes de que Alpine dispare el evento.
// 1. Registramos el listener de alpine:init (sincrono, no espera a imports).
// 2. Cargamos Alpine dinamicamente desde el CDN.
// 3. Cuando Alpine arranca dispara alpine:init, nuestro listener registra stickerMaker.
// 4. Alpine camina el DOM y encuentra el componente ya registrado.
document.addEventListener('alpine:init', () => registerStickerMaker(window.Alpine));

(function loadAlpine() {
  if (window.Alpine) return; // Ya cargado (no deberia, pero por seguridad)
  const s = document.createElement('script');
  s.src = ALPINE_CDN_URL;
  s.defer = true;
  document.head.appendChild(s);
})();