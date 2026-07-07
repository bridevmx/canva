// TrimService.js — Trim de bordes blancos. FIX BUG B: ahora actualiza item.w/h.

import { clamp } from './StickerItem.js?v=1.7.4';
import { imageDimensions } from './ImageItem.js?v=1.7.4';

export async function trimWhiteBorders(item) {
  if (!item || item.type !== 'image') return;

  const img = new Image();
  if (!item.src.startsWith('data:')) img.crossOrigin = 'anonymous';
  img.src = item.src;
  try { await new Promise((r, rr) => { img.onload = r; img.onerror = rr; }); }
  catch { return; }

  const w = img.naturalWidth, h = img.naturalHeight;
  if (!w || !h) return;

  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);

  const { data } = ctx.getImageData(0, 0, w, h);
  const thr = Number(item.whiteThreshold ?? 245);
  const isBlank = (x, y) => {
    const i = (y * w + x) * 4;
    if (data[i + 3] === 0) return true;
    return data[i] >= thr && data[i + 1] >= thr && data[i + 2] >= thr;
  };
  const rowB = y => { for (let x = 0; x < w; x++) if (!isBlank(x, y)) return false; return true; };
  const colB = x => { for (let y = 0; y < h; y++) if (!isBlank(x, y)) return false; return true; };

  let top = 0;  while (top < h  && rowB(top))  top++;
  let bot = h-1; while (bot >= 0 && rowB(bot)) bot--;
  let left = 0; while (left < w  && colB(left)) left++;
  let right = w-1; while (right >= 0 && colB(right)) right--;
  if (left > right || top > bot) return;

  const cw = right - left + 1;
  const ch = bot - top + 1;
  const out = document.createElement('canvas');
  out.width = cw; out.height = ch;
  out.getContext('2d').drawImage(canvas, left, top, cw, ch, 0, 0, cw, ch);

  // FIX BUG B: recalcular item.w/h según proporción del trim
  const oldCx = item.x + item.w / 2;
  const oldCy = item.y + item.h / 2;
  const aspectRatio = ch / cw;
  const newW = clamp(item.w * (cw / w), 20, 10000);
  const newH = clamp(newW * aspectRatio, 20, 10000);

  item.src = out.toDataURL('image/png');
  item.w = newW;
  item.h = newH;
  item.x = oldCx - newW / 2;
  item.y = oldCy - newH / 2;
}