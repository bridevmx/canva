// PropertyBar.js — Barra de propiedades con Material Icons Round.
import { SingleItemControls } from './SingleItemControls.js?v=2.0.0';

const mi = (name, cls = '') =>
  `<span class="mi${cls ? ' ' + cls : ''}" style="font-size:18px">${name}</span>`;

const pbBtn = (cls, icon, title, extra = '') =>
  `<button class="pb-btn ${cls}" title="${title}" ${extra}>${mi(icon)}</button>`;

export class PropertyBar {
  constructor({ FONTS, actions, lifecycle }) {
    this.FONTS = FONTS;
    this.actions = actions;
    this.lifecycle = lifecycle;
    this.singleControls = new SingleItemControls({ FONTS });
    this._delegatedClickContainers = new WeakSet();
    this._delegatedClickHandler = e => {
      if (e.target.closest('.prop-flip-x')) this.actions.flipHorizontal();
      if (e.target.closest('.prop-flip-y')) this.actions.flipVertical();
    };
  }

  render(container, sel, selectedAll, isMobile) {
    if (selectedAll.length === 0) { container.innerHTML = ''; return; }
    const multi = selectedAll.length > 1;
    const html = this._buildHtml(sel, multi, isMobile);
    container.innerHTML = html;
    this._bindEvents(container, sel, multi);
  }

  _buildHtml(sel, multi, isMobile) {
    let h = '';

    // ── Capas ──────────────────────────────────────────────────────────────
    h += `<div class="flex items-center gap-0.5 border-r border-slate-200 pr-2 mr-1">`;
    if (!isMobile) h += `<span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-1">Capas</span>`;
    h += pbBtn('prop-bring-forward', 'vertical_align_top', 'Traer al frente (Ctrl+Shift+])');
    h += pbBtn('prop-send-back',    'vertical_align_bottom',  'Enviar al fondo (Ctrl+Shift+[)');
    h += pbBtn('prop-move-up',      'arrow_upward',  'Subir capa (Ctrl+])');
    h += pbBtn('prop-move-down',    'arrow_downward','Bajar capa (Ctrl+[)');
    h += `</div>`;

    if (multi) {
      h += this._alignHtml(isMobile);
      h += this._distributeHtml(isMobile);
    } else {
      h += this._lockHtml(sel, isMobile);
      h += this._flipHtml(sel, isMobile);
      h += this._opacityHtml(sel, isMobile);
      h += this.singleControls.renderHtml(sel, isMobile);
    }

    // ── Llenar hoja ────────────────────────────────────────────────────────
    h += `<div class="border-l border-slate-200 pl-2 ml-auto shrink-0">`;
    h += `<button class="prop-grid-fill flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-violet-100 text-slate-700 hover:text-violet-700 text-xs font-semibold transition border border-slate-200 hover:border-violet-300">`;
    h += `${mi('grid_view')} <span class="${isMobile ? '' : ''}">${isMobile ? 'Llenar' : 'Llenar hoja'}</span>`;
    h += `</button></div>`;

    return h;
  }

  _alignHtml(isMobile) {
    let h = `<div class="flex items-center gap-0.5 border-r border-slate-200 pr-2 mr-1">`;
    if (!isMobile) h += `<span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-1">Alinear</span>`;
    h += pbBtn('prop-align-left',     'align_horizontal_left',   'Alinear izquierda');
    h += pbBtn('prop-align-center-h', 'align_horizontal_center', 'Centrar horizontal');
    h += pbBtn('prop-align-right',    'align_horizontal_right',  'Alinear derecha');
    h += pbBtn('prop-align-top',      'align_vertical_top',      'Alinear arriba');
    h += pbBtn('prop-align-center-v', 'align_vertical_center',   'Centrar vertical');
    h += pbBtn('prop-align-bottom',   'align_vertical_bottom',   'Alinear abajo');
    h += `</div>`;
    return h;
  }

  _distributeHtml(isMobile) {
    let h = `<div class="flex items-center gap-0.5 border-r border-slate-200 pr-2 mr-1">`;
    if (!isMobile) h += `<span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-1">Distribuir</span>`;
    h += pbBtn('prop-distribute-h', 'horizontal_distribute', 'Distribuir horizontal');
    h += pbBtn('prop-distribute-v', 'vertical_distribute',   'Distribuir vertical');
    h += `</div>`;
    return h;
  }

  _lockHtml(sel, isMobile) {
    const locked = sel.locked;
    return `<button class="pb-btn prop-toggle-lock border-r border-slate-200 pr-2 mr-1 rounded-none ${locked ? 'pb-btn-active' : ''}" title="${locked ? 'Desbloquear' : 'Bloquear'}">${mi(locked ? 'lock' : 'lock_open')}</button>`;
  }

  _flipHtml(sel, isMobile) {
    let h = `<div class="flex items-center gap-0.5 border-r border-slate-200 pr-2 mr-1">`;
    if (!isMobile) h += `<span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-1">Voltear</span>`;
    h += `<button class="pb-btn prop-flip-x ${sel.flipX ? 'pb-btn-active' : ''}" title="Voltear horizontal">${mi('swap_horiz')}</button>`;
    h += `<button class="pb-btn prop-flip-y ${sel.flipY ? 'pb-btn-active' : ''}" title="Voltear vertical">${mi('swap_vert')}</button>`;
    h += `</div>`;
    return h;
  }

  _opacityHtml(sel, isMobile) {
    const val = Math.round((sel.opacity ?? 1) * 100);
    let h = `<div class="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">`;
    h += `${mi('opacity', 'text-slate-400')}`;
    h += `<input type="range" value="${val}" min="5" max="100" step="5" class="prop-opacity ${isMobile ? 'w-16' : 'w-20'} h-1.5 accent-violet-600 cursor-pointer" />`;
    h += `<span class="text-[10px] text-slate-500 w-7 tabular-nums">${val}%</span>`;
    h += `</div>`;
    return h;
  }

  _bindEvents(container, sel, multi) {
    const { actions, lifecycle } = this;

    container.querySelector('.prop-bring-forward')?.addEventListener('click', actions.bringForward);
    container.querySelector('.prop-send-back')?.addEventListener('click', actions.sendToBack);
    container.querySelector('.prop-move-up')?.addEventListener('click', actions.moveOneUp);
    container.querySelector('.prop-move-down')?.addEventListener('click', actions.moveOneDown);

    if (multi) {
      container.querySelector('.prop-align-left')?.addEventListener('click', () => { actions.alignLeft(); lifecycle.pushHistory(); lifecycle.renderSheet(); });
      container.querySelector('.prop-align-center-h')?.addEventListener('click', () => { actions.alignCenterH(); lifecycle.pushHistory(); lifecycle.renderSheet(); });
      container.querySelector('.prop-align-right')?.addEventListener('click', () => { actions.alignRight(); lifecycle.pushHistory(); lifecycle.renderSheet(); });
      container.querySelector('.prop-align-top')?.addEventListener('click', () => { actions.alignTop(); lifecycle.pushHistory(); lifecycle.renderSheet(); });
      container.querySelector('.prop-align-center-v')?.addEventListener('click', () => { actions.alignCenterV(); lifecycle.pushHistory(); lifecycle.renderSheet(); });
      container.querySelector('.prop-align-bottom')?.addEventListener('click', () => { actions.alignBottom(); lifecycle.pushHistory(); lifecycle.renderSheet(); });
      container.querySelector('.prop-distribute-h')?.addEventListener('click', () => { actions.distributeHorizontal(); lifecycle.pushHistory(); lifecycle.renderSheet(); });
      container.querySelector('.prop-distribute-v')?.addEventListener('click', () => { actions.distributeVertical(); lifecycle.pushHistory(); lifecycle.renderSheet(); });
    } else {
      container.querySelector('.prop-toggle-lock')?.addEventListener('click', () => {
        sel.locked = !sel.locked;
        lifecycle.pushHistory();
        lifecycle.renderPropertyBars();
        lifecycle.renderSheet();
      });
      if (!this._delegatedClickContainers.has(container)) {
        container.addEventListener('click', this._delegatedClickHandler);
        this._delegatedClickContainers.add(container);
      }
      const opacitySlider = container.querySelector('.prop-opacity');
      if (opacitySlider) {
        opacitySlider.addEventListener('input', () => {
          sel.opacity = parseInt(opacitySlider.value) / 100;
          const span = opacitySlider.nextElementSibling;
          if (span) span.textContent = opacitySlider.value + '%';
          lifecycle.sync();
        });
        opacitySlider.addEventListener('change', () => {
          lifecycle.pushHistory();
          lifecycle.renderSheet();
        });
      }
      this.singleControls.bindEvents(container, sel, lifecycle);
    }

    container.querySelector('.prop-grid-fill')?.addEventListener('click', actions.gridFill);
  }
}
