// canvasView.js — Adaptador entre CanvasEditor (OOP) y Nanostores (reactividad)
import { atom } from 'nanostores';
import { CanvasEditor } from './CanvasEditor.js?v=1.7.4';
import { CanvasPersistence } from './CanvasPersistence.js?v=1.7.4';
import { QuoteCalculator } from '../ui/QuoteCalculator.js?v=1.7.4';
import { AuthManager } from '../auth/AuthManager.js?v=1.7.4';
import { PRODUCTS, PAPER_SIZES, FONTS } from '../pb.config.js?v=1.7.4';
import { rulerXStyle, rulerYStyle, gridStyle } from './RulerService.js?v=1.7.4';

const PX_PER_CM = 37.8095;

const editor = new CanvasEditor();
let persistence = null;
let calculator = null;
let auth = null;

// ── Átomos reactivos ──
const $items = atom([]);
const $selectedId = atom(null);
const $canvasZoom = atom(1.0);
const $showGrid = atom(false);
const $cropActive = atom(false);
const $cropId = atom(null);
const $editingTextId = atom(null);
const $isSaving = atom(false);
const $isPrinting = atom(false);
const $isSaveModalOpen = atom(false);
const $materialType = atom('RICE_04');
const $printQuantity = atom(1);
const $projectTitle = atom('');
const $pagesCount = atom(1);
const $activePage = atom(1);
const $pageColors = atom({ 1: '#ffffff' });
const $guides = atom([]);
const $fonts = atom(FONTS);
const $products = atom(PRODUCTS);

// ── Helpers ──
function getSelected() {
  return $items.get().find(i => i.id === $selectedId.get()) || null;
}

function getSheet() {
  return editor.paper.sheet;
}

function sync() {
  $items.set([...editor.items]);
  $selectedId.set(editor.selectedId);
  $cropActive.set(editor.crop.active);
  $cropId.set(editor.crop.id);
  $canvasZoom.set(editor.canvasZoom);
  $editingTextId.set(editor.editingTextId);
  $isSaving.set(editor.isSaving);
  $isPrinting.set(editor.isPrinting);
  $pagesCount.set(editor.paper.pagesCount);
  $activePage.set(editor.paper.activePage);
  $pageColors.set({ ...editor.paper.pageColors });
}

function sortedItems() {
  return [...editor.items].sort((a, b) => a.z - b.z);
}

function itemsOnPage(p) {
  return sortedItems().filter(i => (i.page || 1) === p);
}

function itemStyle(item) {
  return item.toStyle(getSheet().w, getSheet().h);
}

// ── Inicialización ──
async function initCanvas(canvasMainRef) {
  window.addEventListener('paste', e => handlePaste(e));

  auth = new AuthManager();
  await auth.init();
  persistence = new CanvasPersistence(editor, auth.pb, auth);
  calculator = new QuoteCalculator(
    () => $materialType.get(),
    () => $printQuantity.get(),
    () => editor.paper.pagesCount
  );

  _bindResize(canvasMainRef);
  await waitNextTick();

  editor.pointer.notify = () => sync();
  editor.fitZoom(canvasMainRef);
  syncZoom();
  editor.history.push();
  sync();

  canvasMainRef.addEventListener('touchstart', e => onCanvasTouchStart(e), { passive: true });
  canvasMainRef.addEventListener('touchmove', e => onCanvasTouchMove(e), { passive: false });
  canvasMainRef.addEventListener('touchend', e => onCanvasTouchEnd(e), { passive: true });

  window.addEventListener('editor:change', () => sync());

  await persistence.loadUserProjects();

  const qs = new URLSearchParams(window.location.search);
  const id = qs.get('id');
  if (id) {
    try {
      await persistence.loadProject(id);
      syncZoom();
    } catch {
      alert('No se pudo cargar el proyecto.');
      window.location.replace('/dashboard');
    }
  }
}

function waitNextTick() {
  return new Promise(resolve => requestAnimationFrame(resolve));
}

function _bindResize(canvasMainRef) {
  window.addEventListener('resize', () => {
    editor.fitZoom(canvasMainRef);
    syncZoom();
  });
}

// ── Selection ──
function select(id) {
  editor.select(id);
  $selectedId.set(id);
}
function clearSelection() {
  editor.clearSelection();
  $selectedId.set(null);
}

// ── Zoom ──
function syncZoom() {
  $canvasZoom.set(editor.canvasZoom);
}
function zoomIn() {
  editor.zoomIn();
  $canvasZoom.set(editor.canvasZoom);
}
function zoomOut() {
  editor.zoomOut();
  $canvasZoom.set(editor.canvasZoom);
}
function zoomPercent() {
  return Math.round($canvasZoom.get() * 100) + '%';
}
function fitZoom(el) {
  editor.fitZoom(el);
  $canvasZoom.set(editor.canvasZoom);
}

// ── Undo/Redo ──
function undo() {
  editor.history.undo();
  sync();
}
function redo() {
  editor.history.redo();
  sync();
}
function canUndo() {
  return editor.history.canUndo();
}
function canRedo() {
  return editor.history.canRedo();
}
function pushHistory() {
  editor.history.push();
}

// ── Print ──
async function printCanvas() {
  editor.clearSelection();
  editor.isPrinting = true;
  $isPrinting.set(true);
  await waitNextTick();
  setTimeout(() => {
    window.print();
    editor.isPrinting = false;
    $isPrinting.set(false);
  }, 150);
}

// ── Paper & pages ──
function setPage(p) {
  editor.paper.setActive(p);
  $activePage.set(p);
  editor.clearSelection();
  sync();
}
function addPage() {
  editor.paper.addPage();
  $pagesCount.set(editor.paper.pagesCount);
  $activePage.set(editor.paper.activePage);
  editor.clearSelection();
  sync();
}
function deletePage() {
  const p = $activePage.get();
  if (!confirm(`¿Eliminar la Hoja ${p}?`)) return;
  editor.items = editor.paper.deletePage(editor.items, p) || editor.items;
  if (editor.paper.activePage > editor.paper.pagesCount) editor.paper.activePage = editor.paper.pagesCount;
  editor.clearSelection();
  editor.history.push();
  sync();
}
function updatePaperSize() {
  editor.paper.setSize(editor.paper.paperSize);
}
function injectPrintCss() {
  let el = document.getElementById('print-page-style');
  if (!el) { el = document.createElement('style'); el.id = 'print-page-style'; document.head.appendChild(el); }
  el.innerHTML = editor.paper.printCss();
}

// ── Elementos ──
function addText() {
  editor.addText();
  sync();
}
function addShape(t) {
  editor.addShape(t);
  sync();
}
async function handleFiles(event) {
  const files = [...(event.target.files || [])];
  for (let i = 0; i < files.length; i++) {
    await editor.addImageFromFile(files[i], { x: 40 + ((i * 30) % 180), y: 40 + ((i * 30) % 180) });
  }
  event.target.value = '';
  sync();
}
async function handlePaste(event) {
  const items = [...(event.clipboardData?.items || [])];
  const imgItem = items.find(i => i.type.startsWith('image/'));
  if (!imgItem) return;
  const file = imgItem.getAsFile();
  if (file) await editor.addImageFromClipboardFile(file);
  sync();
}
function duplicateSelected() {
  editor.duplicateSelected();
  sync();
}
function deleteSelected() {
  editor.deleteSelected();
  sync();
}
function bringForward() {
  editor.bringForward();
  sync();
}
function sendToBack() {
  editor.sendToBack();
  sync();
}
function moveOneUp() {
  editor.moveOneUp();
  sync();
}
function moveOneDown() {
  editor.moveOneDown();
  sync();
}

// ── Grid ──
function toggleGrid(value) {
  editor.showGrid = value;
  $showGrid.set(value);
}

// ── Crop ──
function startCropMode() {
  editor.startCrop();
  sync();
}
async function applyCrop() {
  await editor.applyCrop();
  sync();
}
function cancelCropMode() {
  editor.cancelCrop();
  sync();
}
function cropBoxStyle() {
  return editor.crop.boxStyle();
}
function getCropHandles() {
  return ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
}

// ── Trim ──
async function trimWhiteBorders() {
  await editor.trimWhiteSelected();
  editor.history.push();
  sync();
}
function restoreOriginalImage() {
  editor.restoreOriginal();
  editor.history.push();
  sync();
}

// ── Grid fill ──
function gridFill() {
  const r = editor.gridFill();
  if (r) alert(`Cuadrícula: ${r.cols}×${r.rows} = ${r.total} stickers`);
  sync();
}

// ── Reset ──
function resetProject() {
  if (!confirm('¿Borrar todo el lienzo e iniciar un nuevo proyecto?')) return;
  editor.resetProject();
  persistence.reset();
  window.history.replaceState({}, document.title, window.location.pathname);
  sync();
}

// ── Rulers & grid ──
function getRulerXStyle() { return rulerXStyle(); }
function getRulerYStyle() { return rulerYStyle(); }
function getGridStyle() { return gridStyle(); }

// ── Pointer handlers ──
// Capturamos el puntero sobre document.body en lugar del elemento temporal.
// Así, si renderSheet() reemplaza el item durante el arrastre, no perdemos la captura.
function capturePointer(ev) {
  try {
    if (document.body.setPointerCapture) document.body.setPointerCapture(ev.pointerId);
  } catch {}
}

function onItemPointerDown(ev, id) {
  const item = editor.items.find(i => i.id === id);
  if (!item) return;
  if (item.locked) { select(id); return; }
  editor.pointer.startDrag(item, ev);
  $selectedId.set(id);
  capturePointer(ev);
}
function onResizeHandlePointerDown(ev, id) {
  const item = editor.items.find(i => i.id === id);
  if (!item) return;
  editor.pointer.startResize(item, ev);
  $selectedId.set(id);
  capturePointer(ev);
}
function onRotateHandlePointerDown(ev, id) {
  const item = editor.items.find(i => i.id === id);
  if (!item) return;
  const sheetRect = ev.currentTarget.closest('.sheet').getBoundingClientRect();
  editor.pointer.startRotate(item, sheetRect, ev);
  $selectedId.set(id);
  capturePointer(ev);
}

function startCropMove(ev) {
  editor.pointer.startCropMove(ev);
  capturePointer(ev);
}
function startCropResize(ev, handle) {
  editor.pointer.startCropResize(handle, ev);
  capturePointer(ev);
}

function isPointerActive() {
  return !!editor.pointer.action;
}

// ── Save ──
async function saveProject() {
  const baseProd = PRODUCTS.find(p => p.code === $materialType.get());
  const computed = calculator.compute();
  const quote = {
    total: computed.total,
    finalUnitPrice: computed.finalUnitPrice,
    pct: computed.pct,
    warning: computed.warning,
    basePrice: baseProd?.precio
  };
  await persistence.saveProject({
    title: $projectTitle.get(),
    materialType: $materialType.get(),
    printQuantity: $printQuantity.get(),
    quote,
    pageBg: editor.paper.getPageColor(editor.paper.activePage)
  });
  alert(persistence.editingAsAdmin ? 'Cambios guardados' : '¡Pedido enviado!');
}

function getEditableAsAdmin() {
  return persistence?.editingAsAdmin || false;
}

// ── Touch (pinch zoom) ──
let pinchState = { active: false, startDist: 0, startZoom: 1 };

function onCanvasTouchStart(e) {
  if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    pinchState = { active: true, startDist: Math.hypot(dx, dy), startZoom: editor.canvasZoom };
  }
}
function onCanvasTouchMove(e) {
  if (pinchState.active && e.touches.length === 2) {
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    editor.setZoom(pinchState.startZoom * (Math.hypot(dx, dy) / pinchState.startDist));
    $canvasZoom.set(editor.canvasZoom);
  }
}
function onCanvasTouchEnd(e) {
  if (e.touches.length < 2) pinchState = { active: false, startDist: 0, startZoom: 1 };
}

// ── Quote ──
function computeQuote() {
  if (!calculator) return { total: 0, finalUnitPrice: 0, pct: 0, warning: null };
  return calculator.compute();
}

// ── Current Page ──
function currentPageBg() {
  return editor.paper.getPageColor(editor.paper.activePage);
}
function setCurrentPageColor(v) {
  editor.paper.setPageColor(editor.paper.activePage, v);
  $pageColors.set({ ...editor.paper.pageColors });
}

// ── Exports ──
export {
  $items, $selectedId, $canvasZoom, $showGrid, $cropActive, $cropId,
  $editingTextId, $isSaving, $isPrinting, $isSaveModalOpen,
  $materialType, $printQuantity, $projectTitle,
  $pagesCount, $activePage, $pageColors, $guides, $fonts, $products,
};

export {
  initCanvas, sync, getSelected, getSheet, sortedItems, itemsOnPage, itemStyle,
  select, clearSelection,
  syncZoom, zoomIn, zoomOut, zoomPercent, fitZoom,
  undo, redo, canUndo, canRedo, pushHistory,
  printCanvas,
  setPage, addPage, deletePage, updatePaperSize, injectPrintCss,
  addText, addShape, handleFiles, duplicateSelected, deleteSelected,
  bringForward, sendToBack, moveOneUp, moveOneDown,
  toggleGrid,
  startCropMode, applyCrop, cancelCropMode, cropBoxStyle, getCropHandles,
  trimWhiteBorders, restoreOriginalImage,
  gridFill, resetProject,
  getRulerXStyle, getRulerYStyle, getGridStyle,
  onItemPointerDown, onResizeHandlePointerDown, onRotateHandlePointerDown,
  startCropMove, startCropResize,
  saveProject, getEditableAsAdmin,
  computeQuote, currentPageBg, setCurrentPageColor, isPointerActive,
  FONTS, PRODUCTS, PAPER_SIZES,
};
