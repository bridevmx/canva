import { SHAPE_STYLES } from './ShapeItem.js?v=1.9.9';

const SHAPE_BTNS = [
  { key: 'rect',     icon: '▭' },
  { key: 'circle',   icon: '⬤' },
  { key: 'star',     icon: '★' },
  { key: 'heart',    icon: '♥' },
  { key: 'triangle', icon: '▲' },
  { key: 'hexagon',  icon: '⬡' },
  { key: 'bubble',   icon: '💬' },
];

export class SingleItemControls {
  constructor({ FONTS }) {
    this.FONTS = FONTS;
  }

  renderHtml(sel, groupClass, labelClass, isMobile) {
    let h = '';

    if (sel.type === 'image') {
      h += `<div class="${groupClass}">`;
      if (!isMobile) h += `<span class="${labelClass}">Ajuste</span>`;
      h += `<select class="prop-image-fit px-1 py-0.5 border border-slate-200 rounded text-xs bg-white focus:outline-none">`;
      h += `<option value="fill" ${sel.fit === 'fill' ? 'selected' : ''}>Fill</option>`;
      h += `<option value="contain" ${sel.fit === 'contain' ? 'selected' : ''}>Contain</option>`;
      h += `<option value="cover" ${sel.fit === 'cover' ? 'selected' : ''}>Cover</option>`;
      h += '</select></div>';
    }

    if (sel.type === 'shape') {
      h += `<div class="${groupClass}">`;
      if (!isMobile) h += `<span class="${labelClass}">Forma</span>`;
      for (const b of SHAPE_BTNS) {
        const active = sel.shapeType === b.key;
        h += `<button class="prop-shape-${b.key} px-1.5 py-0.5 rounded text-xs font-medium transition ${active ? 'bg-slate-700 text-white' : 'bg-white text-slate-700 border border-slate-200'}">${b.icon}</button>`;
      }
      h += '</div>';

      h += `<div class="${groupClass}">`;
      if (!isMobile) h += `<span class="${labelClass}">Relleno</span>`;
      h += `<input type="color" value="${sel.fillColor || '#3b82f6'}" class="prop-fill-color w-7 h-7 rounded cursor-pointer border border-slate-200 p-0 bg-white" />`;
      h += '</div>';

      h += `<div class="${groupClass}">`;
      if (!isMobile) h += `<span class="${labelClass}">Borde</span>`;
      h += `<input type="color" value="${sel.strokeColor || '#1d4ed8'}" class="prop-stroke-color w-7 h-7 rounded cursor-pointer border border-slate-200 p-0 bg-white" />`;
      h += `<input type="range" value="${sel.strokeWidth ?? 0}" min="0" max="20" step="1" class="prop-stroke-width w-12 h-1.5 accent-blue-600 cursor-pointer" />`;
      h += `<span class="text-xs text-slate-500 w-4">${sel.strokeWidth ?? 0}</span>`;
      h += '</div>';
    }

    if (sel.type === 'text') {
      h += `<div class="${groupClass}">`;
      if (!isMobile) h += `<span class="${labelClass}">Fuente</span>`;
      h += `<select class="prop-font-family px-1 py-0.5 border border-slate-200 rounded text-xs bg-white focus:outline-none ${isMobile ? 'max-w-[90px]' : 'max-w-[130px]'}">`;
      this.FONTS.forEach(f => {
        h += `<option value="${this._escapeHtml(f.value)}" ${sel.fontFamily === f.value ? 'selected' : ''}>${this._escapeHtml(f.label)}</option>`;
      });
      h += '</select></div>';

      h += `<div class="${groupClass}">`;
      if (!isMobile) h += `<span class="${labelClass}">Tamaño</span>`;
      h += `<input type="number" value="${sel.fontSize}" min="8" max="300" class="prop-font-size w-12 px-1 py-0.5 border border-slate-200 rounded text-xs text-center" />`;
      h += '</div>';

      h += `<div class="${groupClass}">`;
      if (!isMobile) h += `<span class="${labelClass}">Color</span>`;
      h += `<input type="color" value="${sel.color || '#000000'}" class="prop-text-color w-7 h-7 rounded cursor-pointer border border-slate-200 p-0 bg-white" />`;
      h += '</div>';

      h += `<div class="${groupClass}">`;
      h += `<button class="prop-text-bold px-2 py-0.5 rounded text-xs font-semibold transition ${sel.fontWeight === 'bold' || sel.fontWeight >= 700 ? 'bg-slate-700 text-white' : 'bg-white text-slate-700 border border-slate-200'}">B</button>`;
      h += '</div>';

      h += `<div class="${groupClass}">`;
      if (!isMobile) h += `<span class="${labelClass}">Curvo</span>`;
      h += `<input type="checkbox" class="prop-text-curve-toggle" ${sel.textCurved ? 'checked' : ''} />`;
      if (sel.textCurved) {
        h += `<input type="range" value="${sel.textArcRadius ?? 200}" min="30" max="600" step="10" class="prop-text-arc-radius w-16 h-1.5 accent-blue-600 cursor-pointer" />`;
        h += `<span class="text-xs text-slate-500 w-6">${sel.textArcRadius ?? 200}</span>`;
      }
      h += '</div>';

      h += `<div class="${groupClass}">`;
      if (!isMobile) h += `<span class="${labelClass}">Sombra</span>`;
      h += `<input type="checkbox" class="prop-text-shadow-toggle" ${sel.textShadow ? 'checked' : ''} />`;
      if (sel.textShadow) {
        h += `<input type="color" value="${sel.shadowColor || '#000000'}" class="prop-shadow-color w-6 h-6 rounded cursor-pointer border border-slate-200 p-0 bg-white" />`;
        h += `<input type="number" value="${sel.shadowBlur ?? 4}" min="0" max="50" class="prop-shadow-blur w-10 px-1 py-0.5 border border-slate-200 rounded text-xs text-center" title="Blur" />`;
      }
      h += '</div>';

      h += `<div class="${groupClass}">`;
      if (!isMobile) h += `<span class="${labelClass}">Contorno</span>`;
      h += `<input type="checkbox" class="prop-text-outline-toggle" ${sel.textOutline ? 'checked' : ''} />`;
      if (sel.textOutline) {
        h += `<input type="color" value="${sel.outlineColor || '#ffffff'}" class="prop-outline-color w-6 h-6 rounded cursor-pointer border border-slate-200 p-0 bg-white" />`;
        h += `<input type="number" value="${sel.outlineWidth ?? 1}" min="0.5" max="10" step="0.5" class="prop-outline-width w-10 px-1 py-0.5 border border-slate-200 rounded text-xs text-center" title="Ancho" />`;
      }
      h += '</div>';
    }

    return h;
  }

  bindEvents(container, sel, lifecycle) {
    const updateText = () => { lifecycle.pushHistory(); lifecycle.renderSheet(); lifecycle.renderPropertyBars(); };

    const fitSelect = container.querySelector('.prop-image-fit');
    if (fitSelect) {
      fitSelect.addEventListener('change', () => {
        sel.fit = fitSelect.value;
        lifecycle.pushHistory();
        lifecycle.renderSheet();
      });
    }

    for (const b of SHAPE_BTNS) {
      const btn = container.querySelector(`.prop-shape-${b.key}`);
      if (btn) {
        btn.addEventListener('click', () => {
          sel.shapeType = b.key;
          lifecycle.pushHistory();
          lifecycle.renderPropertyBars();
          lifecycle.renderSheet();
        });
      }
    }

    const fillColor = container.querySelector('.prop-fill-color');
    if (fillColor) {
      fillColor.addEventListener('input', () => { sel.fillColor = fillColor.value; lifecycle.sync(); });
      fillColor.addEventListener('change', () => { lifecycle.pushHistory(); lifecycle.renderSheet(); });
    }
    const strokeColor = container.querySelector('.prop-stroke-color');
    if (strokeColor) {
      strokeColor.addEventListener('input', () => { sel.strokeColor = strokeColor.value; lifecycle.sync(); });
      strokeColor.addEventListener('change', () => { lifecycle.pushHistory(); lifecycle.renderSheet(); });
    }
    const strokeWidth = container.querySelector('.prop-stroke-width');
    if (strokeWidth) {
      strokeWidth.addEventListener('input', () => {
        sel.strokeWidth = parseInt(strokeWidth.value);
        lifecycle.renderPropertyBars();
        lifecycle.sync();
      });
      strokeWidth.addEventListener('change', () => { lifecycle.pushHistory(); lifecycle.renderSheet(); });
    }

    const fontFamily = container.querySelector('.prop-font-family');
    if (fontFamily) {
      fontFamily.addEventListener('change', () => { sel.fontFamily = fontFamily.value; updateText(); });
    }
    const fontSize = container.querySelector('.prop-font-size');
    if (fontSize) {
      fontSize.addEventListener('change', () => {
        sel.fontSize = Math.max(8, Math.min(300, parseInt(fontSize.value) || 24));
        updateText();
      });
    }
    const textColor = container.querySelector('.prop-text-color');
    if (textColor) {
      textColor.addEventListener('input', () => { sel.color = textColor.value; lifecycle.sync(); });
      textColor.addEventListener('change', () => { lifecycle.pushHistory(); lifecycle.renderSheet(); });
    }
    const textBold = container.querySelector('.prop-text-bold');
    if (textBold) {
      textBold.addEventListener('click', () => {
        sel.fontWeight = (sel.fontWeight === 'bold' || sel.fontWeight >= 700) ? 'normal' : 'bold';
        updateText();
      });
    }

    const curveToggle = container.querySelector('.prop-text-curve-toggle');
    if (curveToggle) {
      curveToggle.addEventListener('change', () => {
        sel.textCurved = curveToggle.checked;
        if (sel.textCurved && !sel.textArcRadius) sel.textArcRadius = 200;
        updateText();
      });
    }
    const arcRadius = container.querySelector('.prop-text-arc-radius');
    if (arcRadius) {
      arcRadius.addEventListener('input', () => {
        sel.textArcRadius = parseInt(arcRadius.value);
        lifecycle.sync();
      });
      arcRadius.addEventListener('change', () => { lifecycle.pushHistory(); lifecycle.renderSheet(); });
    }

    const shadowToggle = container.querySelector('.prop-text-shadow-toggle');
    if (shadowToggle) {
      shadowToggle.addEventListener('change', () => {
        sel.textShadow = shadowToggle.checked;
        if (sel.textShadow && !sel.shadowColor) {
          sel.shadowColor = '#000000';
          sel.shadowBlur = 4;
          sel.shadowOffsetX = 2;
          sel.shadowOffsetY = 2;
        }
        updateText();
      });
    }
    const shadowColor = container.querySelector('.prop-shadow-color');
    if (shadowColor) {
      shadowColor.addEventListener('input', () => { sel.shadowColor = shadowColor.value; lifecycle.sync(); });
      shadowColor.addEventListener('change', () => { lifecycle.pushHistory(); lifecycle.renderSheet(); });
    }
    const shadowBlur = container.querySelector('.prop-shadow-blur');
    if (shadowBlur) {
      shadowBlur.addEventListener('change', () => { sel.shadowBlur = Math.max(0, parseInt(shadowBlur.value) || 0); updateText(); });
    }
    const outlineToggle = container.querySelector('.prop-text-outline-toggle');
    if (outlineToggle) {
      outlineToggle.addEventListener('change', () => {
        sel.textOutline = outlineToggle.checked;
        if (sel.textOutline && !sel.outlineColor) {
          sel.outlineColor = '#ffffff';
          sel.outlineWidth = 1;
        }
        updateText();
      });
    }
    const outlineColor = container.querySelector('.prop-outline-color');
    if (outlineColor) {
      outlineColor.addEventListener('input', () => { sel.outlineColor = outlineColor.value; lifecycle.sync(); });
      outlineColor.addEventListener('change', () => { lifecycle.pushHistory(); lifecycle.renderSheet(); });
    }
    const outlineWidth = container.querySelector('.prop-outline-width');
    if (outlineWidth) {
      outlineWidth.addEventListener('change', () => { sel.outlineWidth = Math.max(0.5, parseFloat(outlineWidth.value) || 1); updateText(); });
    }
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
