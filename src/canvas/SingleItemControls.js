// SingleItemControls.js — Controles de ítem único con Material Icons Round.
import { SHAPE_STYLES } from './ShapeItem.js?v=2.0.0';

const mi = (name, cls = '') =>
  `<span class="mi${cls ? ' ' + cls : ''}" style="font-size:18px">${name}</span>`;

const pbBtn = (cls, icon, title, active = false, extra = '') =>
  `<button class="pb-btn ${cls}${active ? ' pb-btn-active' : ''}" title="${title}" ${extra}>${mi(icon)}</button>`;

// Material icon per shape type
const SHAPE_BTNS = [
  { key: 'rect',     icon: 'rectangle',    label: 'Rectángulo' },
  { key: 'circle',   icon: 'circle',       label: 'Círculo'    },
  { key: 'star',     icon: 'star',         label: 'Estrella'   },
  { key: 'heart',    icon: 'favorite',     label: 'Corazón'    },
  { key: 'triangle', icon: 'change_history', label: 'Triángulo' },
  { key: 'hexagon',  icon: 'hexagon',      label: 'Hexágono'   },
  { key: 'bubble',   icon: 'chat_bubble',  label: 'Bocadillo'  },
];

const LABEL = 'text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-1';
const GROUP = 'flex items-center gap-0.5 border-r border-slate-200 pr-2 mr-1';

export class SingleItemControls {
  constructor({ FONTS }) {
    this.FONTS = FONTS;
  }

  /** Called by PropertyBar._buildHtml(); isMobile passed from there. */
  renderHtml(sel, isMobile) {
    let h = '';

    // ── Imagen ──────────────────────────────────────────────────────────────
    if (sel.type === 'image') {
      h += `<div class="${GROUP}">`;
      if (!isMobile) h += `<span class="${LABEL}">Ajuste</span>`;
      h += `<select class="prop-image-fit px-1 py-0.5 border border-slate-200 rounded text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-violet-400 cursor-pointer">`;
      for (const [v, l] of [['fill','Fill'],['contain','Contain'],['cover','Cover']]) {
        h += `<option value="${v}"${sel.fit === v ? ' selected' : ''}>${l}</option>`;
      }
      h += `</select></div>`;
    }

    // ── Forma ───────────────────────────────────────────────────────────────
    if (sel.type === 'shape') {
      // Selector de tipo de forma
      h += `<div class="${GROUP}">`;
      if (!isMobile) h += `<span class="${LABEL}">Forma</span>`;
      for (const b of SHAPE_BTNS) {
        h += pbBtn(`prop-shape-${b.key}`, b.icon, b.label, sel.shapeType === b.key);
      }
      h += `</div>`;

      // Color de relleno
      h += `<div class="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">`;
      if (!isMobile) h += `<span class="${LABEL}">Relleno</span>`;
      h += `<input type="color" value="${sel.fillColor || '#3b82f6'}" class="prop-fill-color w-7 h-7 rounded cursor-pointer border border-slate-200 p-0.5 bg-white" title="Color de relleno" />`;
      h += `</div>`;

      // Borde
      h += `<div class="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">`;
      if (!isMobile) h += `<span class="${LABEL}">Borde</span>`;
      h += `<input type="color" value="${sel.strokeColor || '#1d4ed8'}" class="prop-stroke-color w-7 h-7 rounded cursor-pointer border border-slate-200 p-0.5 bg-white" title="Color de borde" />`;
      h += `<input type="range" value="${sel.strokeWidth ?? 0}" min="0" max="20" step="1" class="prop-stroke-width ${isMobile ? 'w-12' : 'w-16'} h-1.5 accent-violet-600 cursor-pointer" title="Grosor de borde" />`;
      h += `<span class="text-[10px] text-slate-500 w-5 tabular-nums">${sel.strokeWidth ?? 0}</span>`;
      h += `</div>`;
    }

    // ── Texto ───────────────────────────────────────────────────────────────
    if (sel.type === 'text') {
      const isBold = sel.fontWeight === 'bold' || sel.fontWeight >= 700;

      // Fuente
      h += `<div class="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">`;
      if (!isMobile) h += `<span class="${LABEL}">Fuente</span>`;
      h += `<select class="prop-font-family px-1 py-0.5 border border-slate-200 rounded text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-violet-400 cursor-pointer ${isMobile ? 'max-w-[90px]' : 'max-w-[130px]'}">`;
      this.FONTS.forEach(f => {
        h += `<option value="${this._esc(f.value)}"${sel.fontFamily === f.value ? ' selected' : ''}>${this._esc(f.label)}</option>`;
      });
      h += `</select></div>`;

      // Tamaño
      h += `<div class="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">`;
      if (!isMobile) h += `<span class="${LABEL}">Tamaño</span>`;
      h += `<input type="number" value="${sel.fontSize}" min="8" max="300" class="prop-font-size w-12 px-1 py-0.5 border border-slate-200 rounded text-[11px] text-center focus:outline-none focus:ring-1 focus:ring-violet-400" />`;
      h += `</div>`;

      // Color de texto
      h += `<div class="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">`;
      if (!isMobile) h += `<span class="${LABEL}">Color</span>`;
      h += `<input type="color" value="${sel.color || '#000000'}" class="prop-text-color w-7 h-7 rounded cursor-pointer border border-slate-200 p-0.5 bg-white" title="Color de texto" />`;
      h += `</div>`;

      // Negrita
      h += `<div class="flex items-center gap-0.5 border-r border-slate-200 pr-2 mr-1">`;
      h += pbBtn('prop-text-bold', 'format_bold', 'Negrita (B)', isBold);
      h += `</div>`;

      // Texto curvo
      h += `<div class="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">`;
      if (!isMobile) h += `<span class="${LABEL}">Curvo</span>`;
      h += `<button class="pb-btn prop-text-curve-toggle${sel.textCurved ? ' pb-btn-active' : ''}" title="Texto curvo">${mi('text_rotation_down')}</button>`;
      if (sel.textCurved) {
        h += `<input type="range" value="${sel.textArcRadius ?? 200}" min="30" max="600" step="10" class="prop-text-arc-radius ${isMobile ? 'w-14' : 'w-20'} h-1.5 accent-violet-600 cursor-pointer" title="Radio del arco" />`;
        h += `<span class="text-[10px] text-slate-500 w-7 tabular-nums">${sel.textArcRadius ?? 200}</span>`;
      }
      h += `</div>`;

      // Sombra
      h += `<div class="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">`;
      if (!isMobile) h += `<span class="${LABEL}">Sombra</span>`;
      h += `<button class="pb-btn prop-text-shadow-toggle${sel.textShadow ? ' pb-btn-active' : ''}" title="Sombra de texto">${mi('blur_on')}</button>`;
      if (sel.textShadow) {
        h += `<input type="color" value="${sel.shadowColor || '#000000'}" class="prop-shadow-color w-6 h-6 rounded cursor-pointer border border-slate-200 p-0.5 bg-white" title="Color de sombra" />`;
        h += `<input type="number" value="${sel.shadowBlur ?? 4}" min="0" max="50" class="prop-shadow-blur w-10 px-1 py-0.5 border border-slate-200 rounded text-[11px] text-center focus:outline-none" title="Desenfoque" />`;
      }
      h += `</div>`;

      // Contorno
      h += `<div class="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">`;
      if (!isMobile) h += `<span class="${LABEL}">Contorno</span>`;
      h += `<button class="pb-btn prop-text-outline-toggle${sel.textOutline ? ' pb-btn-active' : ''}" title="Contorno de texto">${mi('border_color')}</button>`;
      if (sel.textOutline) {
        h += `<input type="color" value="${sel.outlineColor || '#ffffff'}" class="prop-outline-color w-6 h-6 rounded cursor-pointer border border-slate-200 p-0.5 bg-white" title="Color de contorno" />`;
        h += `<input type="number" value="${sel.outlineWidth ?? 1}" min="0.5" max="10" step="0.5" class="prop-outline-width w-10 px-1 py-0.5 border border-slate-200 rounded text-[11px] text-center focus:outline-none" title="Ancho" />`;
      }
      h += `</div>`;
    }

    return h;
  }

  bindEvents(container, sel, lifecycle) {
    const updateText = () => { lifecycle.pushHistory(); lifecycle.renderSheet(); lifecycle.renderPropertyBars(); };

    // Imagen
    const fitSelect = container.querySelector('.prop-image-fit');
    if (fitSelect) {
      fitSelect.addEventListener('change', () => { sel.fit = fitSelect.value; lifecycle.pushHistory(); lifecycle.renderSheet(); });
    }

    // Formas
    for (const b of SHAPE_BTNS) {
      container.querySelector(`.prop-shape-${b.key}`)?.addEventListener('click', () => {
        sel.shapeType = b.key;
        lifecycle.pushHistory();
        lifecycle.renderPropertyBars();
        lifecycle.renderSheet();
      });
    }

    const fillColor = container.querySelector('.prop-fill-color');
    if (fillColor) {
      fillColor.addEventListener('input',  () => { sel.fillColor = fillColor.value; lifecycle.sync(); });
      fillColor.addEventListener('change', () => { lifecycle.pushHistory(); lifecycle.renderSheet(); });
    }
    const strokeColor = container.querySelector('.prop-stroke-color');
    if (strokeColor) {
      strokeColor.addEventListener('input',  () => { sel.strokeColor = strokeColor.value; lifecycle.sync(); });
      strokeColor.addEventListener('change', () => { lifecycle.pushHistory(); lifecycle.renderSheet(); });
    }
    const strokeWidth = container.querySelector('.prop-stroke-width');
    if (strokeWidth) {
      strokeWidth.addEventListener('input',  () => { sel.strokeWidth = parseInt(strokeWidth.value); const span = strokeWidth.nextElementSibling; if (span) span.textContent = strokeWidth.value; console.log(`[strokeWidth input] value=${strokeWidth.value}`); lifecycle.sync(); });
      strokeWidth.addEventListener('change', () => { console.log(`[strokeWidth change] pushing history`); lifecycle.pushHistory(); lifecycle.renderSheet(); });
    }

    // Texto
    const fontFamily = container.querySelector('.prop-font-family');
    if (fontFamily) fontFamily.addEventListener('change', () => { sel.fontFamily = fontFamily.value; updateText(); });

    const fontSize = container.querySelector('.prop-font-size');
    if (fontSize) fontSize.addEventListener('change', () => {
      sel.fontSize = Math.max(8, Math.min(300, parseInt(fontSize.value) || 24));
      updateText();
    });

    const textColor = container.querySelector('.prop-text-color');
    if (textColor) {
      textColor.addEventListener('input',  () => { sel.color = textColor.value; lifecycle.sync(); });
      textColor.addEventListener('change', () => { lifecycle.pushHistory(); lifecycle.renderSheet(); });
    }

    container.querySelector('.prop-text-bold')?.addEventListener('click', () => {
      sel.fontWeight = (sel.fontWeight === 'bold' || sel.fontWeight >= 700) ? 'normal' : 'bold';
      updateText();
    });

    // Toggle buttons (ahora son <button>, no <input type=checkbox>)
    container.querySelector('.prop-text-curve-toggle')?.addEventListener('click', () => {
      sel.textCurved = !sel.textCurved;
      if (sel.textCurved && !sel.textArcRadius) sel.textArcRadius = 200;
      updateText();
    });
    const arcRadius = container.querySelector('.prop-text-arc-radius');
    if (arcRadius) {
      arcRadius.addEventListener('input',  () => { sel.textArcRadius = parseInt(arcRadius.value); lifecycle.sync(); });
      arcRadius.addEventListener('change', () => { lifecycle.pushHistory(); lifecycle.renderSheet(); });
    }

    container.querySelector('.prop-text-shadow-toggle')?.addEventListener('click', () => {
      sel.textShadow = !sel.textShadow;
      if (sel.textShadow && !sel.shadowColor) { sel.shadowColor = '#000000'; sel.shadowBlur = 4; sel.shadowOffsetX = 2; sel.shadowOffsetY = 2; }
      updateText();
    });
    const shadowColor = container.querySelector('.prop-shadow-color');
    if (shadowColor) {
      shadowColor.addEventListener('input',  () => { sel.shadowColor = shadowColor.value; lifecycle.sync(); });
      shadowColor.addEventListener('change', () => { lifecycle.pushHistory(); lifecycle.renderSheet(); });
    }
    const shadowBlur = container.querySelector('.prop-shadow-blur');
    if (shadowBlur) shadowBlur.addEventListener('change', () => { sel.shadowBlur = Math.max(0, parseInt(shadowBlur.value) || 0); updateText(); });

    container.querySelector('.prop-text-outline-toggle')?.addEventListener('click', () => {
      sel.textOutline = !sel.textOutline;
      if (sel.textOutline && !sel.outlineColor) { sel.outlineColor = '#ffffff'; sel.outlineWidth = 1; }
      updateText();
    });
    const outlineColor = container.querySelector('.prop-outline-color');
    if (outlineColor) {
      outlineColor.addEventListener('input',  () => { sel.outlineColor = outlineColor.value; lifecycle.sync(); });
      outlineColor.addEventListener('change', () => { lifecycle.pushHistory(); lifecycle.renderSheet(); });
    }
    const outlineWidth = container.querySelector('.prop-outline-width');
    if (outlineWidth) outlineWidth.addEventListener('change', () => { sel.outlineWidth = Math.max(0.5, parseFloat(outlineWidth.value) || 1); updateText(); });
  }

  _esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }
}
