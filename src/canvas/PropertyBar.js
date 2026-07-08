// PropertyBar.js — Renderizado de la barra de propiedades del canvas.
import { SingleItemControls } from './SingleItemControls.js?v=1.8.2';

export class PropertyBar {
  constructor({ FONTS, actions, lifecycle }) {
    this.FONTS = FONTS;
    this.actions = actions;
    this.lifecycle = lifecycle;
    this.singleControls = new SingleItemControls({ FONTS });
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
    const labelClass = 'text-[10px] font-bold text-slate-400 uppercase tracking-wider';
    const groupClass = `flex items-center gap-1.5 ${isMobile ? 'border-r border-slate-200 pr-2' : 'border-r border-slate-200 pr-3'}`;

    // Capas
    h += `<div class="flex items-center gap-${isMobile ? '0.5' : '1'} ${isMobile ? 'border-r border-slate-200 pr-2' : 'border-r border-slate-200 pr-3'}">`;
    if (!isMobile) h += '<span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Capas</span>';
    h += `<button class="prop-bring-forward ${isMobile ? 'p-1.5 hover:bg-slate-200 rounded text-base' : 'p-1 hover:bg-slate-200 rounded'}" title="Al frente">⏫</button>`;
    h += `<button class="prop-send-back ${isMobile ? 'p-1.5 hover:bg-slate-200 rounded text-base' : 'p-1 hover:bg-slate-200 rounded'}" title="Al fondo">⏬</button>`;
    h += `<button class="prop-move-up ${isMobile ? 'px-2 py-1 hover:bg-slate-200 rounded font-bold text-sm' : 'px-1.5 py-0.5 hover:bg-slate-200 rounded font-bold text-xs'}">↑</button>`;
    h += `<button class="prop-move-down ${isMobile ? 'px-2 py-1 hover:bg-slate-200 rounded font-bold text-sm' : 'px-1.5 py-0.5 hover:bg-slate-200 rounded font-bold text-xs'}">↓</button>`;
    h += '</div>';

    if (multi) {
      h += this._alignHtml(groupClass, labelClass, isMobile);
      h += this._distributeHtml(groupClass, labelClass, isMobile);
    } else {
      h += this._lockHtml(sel, isMobile);
      h += this._flipHtml(sel, groupClass, labelClass, isMobile);
      h += this._opacityHtml(sel, groupClass, labelClass, isMobile);
      h += this.singleControls.renderHtml(sel, groupClass, labelClass, isMobile);
    }

    // Grid fill
    h += `<div class="border-l border-slate-200 pl-${isMobile ? '2' : '3'} ${isMobile ? '' : 'ml-auto'} shrink-0">`;
    h += `<button class="prop-grid-fill flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-violet-100 text-slate-700 hover:text-violet-700 text-xs font-semibold transition ${isMobile ? '' : 'border border-slate-200 hover:border-violet-300'}">⊞ ${isMobile ? 'Llenar' : 'Llenar hoja'}</button>`;
    h += '</div>';

    return h;
  }

  _alignHtml(groupClass, labelClass, isMobile) {
    let h = `<div class="${groupClass}">`;
    if (!isMobile) h += `<span class="${labelClass}">Alinear</span>`;
    h += `<button class="prop-align-left px-1.5 py-0.5 hover:bg-slate-200 rounded text-xs" title="Izquierda">⬅</button>`;
    h += `<button class="prop-align-center-h px-1.5 py-0.5 hover:bg-slate-200 rounded text-xs" title="Centro horizontal">↔</button>`;
    h += `<button class="prop-align-right px-1.5 py-0.5 hover:bg-slate-200 rounded text-xs" title="Derecha">➡</button>`;
    h += `<button class="prop-align-top px-1.5 py-0.5 hover:bg-slate-200 rounded text-xs" title="Arriba">⬆</button>`;
    h += `<button class="prop-align-center-v px-1.5 py-0.5 hover:bg-slate-200 rounded text-xs" title="Centro vertical">↕</button>`;
    h += `<button class="prop-align-bottom px-1.5 py-0.5 hover:bg-slate-200 rounded text-xs" title="Abajo">⬇</button>`;
    h += '</div>';
    return h;
  }

  _distributeHtml(groupClass, labelClass, isMobile) {
    let h = `<div class="${groupClass}">`;
    if (!isMobile) h += `<span class="${labelClass}">Distribuir</span>`;
    h += `<button class="prop-distribute-h px-1.5 py-0.5 hover:bg-slate-200 rounded text-xs" title="Distribuir horizontal">↔⇄</button>`;
    h += `<button class="prop-distribute-v px-1.5 py-0.5 hover:bg-slate-200 rounded text-xs" title="Distribuir vertical">↕⇅</button>`;
    h += '</div>';
    return h;
  }

  _lockHtml(sel, isMobile) {
    return `<button class="prop-toggle-lock ${isMobile ? 'px-2 py-1 rounded text-xs font-semibold border-r border-slate-200 pr-2 mr-0 transition' : 'flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold transition border-r border-slate-200 pr-3'}" style="${sel.locked ? 'bg-amber-100 text-amber-700' : (isMobile ? 'bg-white border border-slate-200 text-slate-600' : 'hover:bg-slate-200 text-slate-600')}">${sel.locked ? '🔒 Bloq.' : '🔓 Libre'}</button>`;
  }

  _flipHtml(sel, groupClass, labelClass, isMobile) {
    let h = `<div class="${groupClass}">`;
    if (!isMobile) h += `<span class="${labelClass}">Voltear</span>`;
    h += `<button class="prop-flip-x px-1.5 py-0.5 hover:bg-slate-200 rounded text-xs ${sel.flipX ? 'bg-blue-100 text-blue-700' : 'text-slate-700'}" title="Horizontal">↔</button>`;
    h += `<button class="prop-flip-y px-1.5 py-0.5 hover:bg-slate-200 rounded text-xs ${sel.flipY ? 'bg-blue-100 text-blue-700' : 'text-slate-700'}" title="Vertical">↕</button>`;
    h += '</div>';
    return h;
  }

  _opacityHtml(sel, groupClass, labelClass, isMobile) {
    let h = `<div class="${groupClass}">`;
    if (!isMobile) h += `<span class="${labelClass}">Opacidad</span>`;
    else h += `<span class="${labelClass}">Op</span>`;
    h += `<input type="range" value="${(sel.opacity ?? 1) * 100}" min="5" max="100" step="5" class="prop-opacity ${isMobile ? 'w-16' : 'w-20'} h-1.5 accent-blue-600 cursor-pointer" />`;
    h += `<span class="text-xs text-slate-500 w-7">${Math.round((sel.opacity ?? 1) * 100)}%</span>`;
    h += '</div>';
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
      container.querySelector('.prop-flip-x')?.addEventListener('click', () => {
        sel.flipX = !sel.flipX;
        lifecycle.pushHistory();
        lifecycle.renderSheet();
      });
      container.querySelector('.prop-flip-y')?.addEventListener('click', () => {
        sel.flipY = !sel.flipY;
        lifecycle.pushHistory();
        lifecycle.renderSheet();
      });
      const opacitySlider = container.querySelector('.prop-opacity');
      if (opacitySlider) {
        opacitySlider.addEventListener('input', () => {
          sel.opacity = parseInt(opacitySlider.value) / 100;
          lifecycle.renderPropertyBars();
          lifecycle.sync();
        });
      }
      this.singleControls.bindEvents(container, sel, lifecycle);
    }

    container.querySelector('.prop-grid-fill')?.addEventListener('click', actions.gridFill);
  }
}
