// SingleItemControls.js — Controles de ítem único con iconos SVG de formas.
import { SHAPE_STYLES } from './ShapeItem.js?v=2.0.0';

const mi = (name, cls = '') =>
  `<span class="mi${cls ? ' ' + cls : ''}" style="font-size:18px">${name}</span>`;

const pbBtn = (cls, content, title, active = false, extra = '') =>
  `<button class="pb-btn ${cls}${active ? ' pb-btn-active' : ''}" title="${title}" ${extra}>${content}</button>`;

// SVG silhouettes for each shape (18x18 viewBox)
const shapeSvg = (paths, extra = '') =>
  `<svg viewBox="0 0 18 18" width="18" height="18" fill="currentColor" ${extra}>${paths}</svg>`;

const SHAPE_BTNS = [
  { key: 'rect',     svg: shapeSvg('<rect x="1" y="3" width="16" height="12" rx="2" ry="2"/>'), label: 'Rectángulo' },
  { key: 'circle',   svg: shapeSvg('<circle cx="9" cy="9" r="8"/>'), label: 'Círculo' },
  { key: 'star',     svg: shapeSvg('<polygon points="9,1 11.5,6.5 17,7 13,11 14,17 9,14 4,17 5,11 1,7 6.5,6.5"/>'), label: 'Estrella' },
  { key: 'heart',    svg: shapeSvg('<path d="M9,16 C5,12 1,9 1,5.5 C1,2.5 3,1 5.5,1 C7,1 8.5,2 9,4 C9.5,2 11,1 12.5,1 C15,1 17,2.5 17,5.5 C17,9 13,12 9,16 Z"/>', 'fill-rule="evenodd"'), label: 'Corazón' },
  { key: 'triangle', svg: shapeSvg('<polygon points="9,1 1,17 17,17"/>'), label: 'Triángulo' },
  { key: 'hexagon',  svg: shapeSvg('<polygon points="5,1 13,1 17,9 13,17 5,17 1,9"/>'), label: 'Hexágono' },
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
        h += pbBtn(`prop-shape-${b.key}`, b.svg, b.label, sel.shapeType === b.key);
      }
      h += `</div>`;

      // Color de relleno
      h += `<div class="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">`;
      if (!isMobile) h += `<span class="${LABEL}">Relleno</span>`;
      h += `<input type="color" value="${sel.fillColor || '#3b82f6'}" class="prop-fill-color w-7 h-7 rounded cursor-pointer border border-slate-200 p-0.5 bg-white" title="Color de relleno" />`;
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
      h += pbBtn('prop-text-bold', mi('format_bold'), 'Negrita (B)', isBold);
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
      fillColor.addEventListener('input',  () => {
        sel.fillColor = fillColor.value;
        const el = document.querySelector(`[data-item-id="${sel.id}"]`);
        if (el && sel.type === 'shape') {
          const svgPath = el.querySelector('svg path');
          if (svgPath) svgPath.setAttribute('fill', fillColor.value);
          else el.style.background = fillColor.value;
        }
      });
      fillColor.addEventListener('change', () => { lifecycle.sync(); lifecycle.pushHistory(); lifecycle.renderSheet(); });
    }
    const strokeColor = container.querySelector('.prop-stroke-color');
    if (strokeColor) {
      strokeColor.addEventListener('input',  () => {
        sel.strokeColor = strokeColor.value;
        const el = document.querySelector(`[data-item-id="${sel.id}"]`);
        if (el) {
          const svgPath = el.querySelector('svg path');
          if (svgPath) svgPath.setAttribute('stroke', strokeColor.value);
          else el.style.borderColor = strokeColor.value;
        }
      });
      strokeColor.addEventListener('change', () => { lifecycle.sync(); lifecycle.pushHistory(); lifecycle.renderSheet(); });
    }
    const strokeWidth = container.querySelector('.prop-stroke-width');
    if (strokeWidth) {
      strokeWidth.addEventListener('input',  () => {
        sel.strokeWidth = parseInt(strokeWidth.value);
        const span = strokeWidth.nextElementSibling;
        if (span) span.textContent = strokeWidth.value;
        const el = document.querySelector(`[data-item-id="${sel.id}"]`);
        if (el) {
          const svgPath = el.querySelector('svg path');
          if (svgPath) { svgPath.setAttribute('stroke-width', sel.strokeWidth); svgPath.setAttribute('stroke', sel.strokeWidth > 0 ? (sel.strokeColor || 'none') : 'none'); }
          else el.style.borderWidth = sel.strokeWidth + 'px';
        }
      });
      strokeWidth.addEventListener('change', () => { lifecycle.sync(); lifecycle.pushHistory(); lifecycle.renderSheet(); });
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
      textColor.addEventListener('input',  () => {
        sel.color = textColor.value;
        const el = document.querySelector(`[data-item-id="${sel.id}"]`);
        if (el) { const tb = el.querySelector('.text-box'); if (tb) tb.style.color = textColor.value; }
      });
      textColor.addEventListener('change', () => { lifecycle.sync(); lifecycle.pushHistory(); lifecycle.renderSheet(); });
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
      arcRadius.addEventListener('input',  () => { sel.textArcRadius = parseInt(arcRadius.value); });
      arcRadius.addEventListener('change', () => { lifecycle.sync(); lifecycle.pushHistory(); lifecycle.renderSheet(); });
    }

    container.querySelector('.prop-text-shadow-toggle')?.addEventListener('click', () => {
      sel.textShadow = !sel.textShadow;
      if (sel.textShadow && !sel.shadowColor) { sel.shadowColor = '#000000'; sel.shadowBlur = 4; sel.shadowOffsetX = 2; sel.shadowOffsetY = 2; }
      updateText();
    });
    const shadowColor = container.querySelector('.prop-shadow-color');
    if (shadowColor) {
      shadowColor.addEventListener('input',  () => {
        sel.shadowColor = shadowColor.value;
        const el = document.querySelector(`[data-item-id="${sel.id}"]`);
        if (el) el.style.textShadow = `0 0 ${sel.shadowBlur||0}px ${shadowColor.value}`;
      });
      shadowColor.addEventListener('change', () => { lifecycle.sync(); lifecycle.pushHistory(); lifecycle.renderSheet(); });
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
      outlineColor.addEventListener('input',  () => {
        sel.outlineColor = outlineColor.value;
        const el = document.querySelector(`[data-item-id="${sel.id}"]`);
        if (el) { const tb = el.querySelector('.text-box'); if (tb) tb.style.webkitTextStroke = `${sel.outlineWidth||1}px ${outlineColor.value}`; }
      });
      outlineColor.addEventListener('change', () => { lifecycle.sync(); lifecycle.pushHistory(); lifecycle.renderSheet(); });
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
