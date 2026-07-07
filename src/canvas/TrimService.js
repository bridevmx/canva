// TrimService.js — Trim de bordes blancos con preview y umbral configurable.

import { clamp } from './StickerItem.js?v=1.7.8';
import { imageDimensions } from './ImageItem.js?v=1.7.8';

export async function computeTrimBounds(src, threshold = 245) {
  const img = new Image();
  if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
  img.src = src;
  try { await new Promise((r, rr) => { img.onload = r; img.onerror = rr; }); }
  catch { return null; }

  const w = img.naturalWidth, h = img.naturalHeight;
  if (!w || !h) return null;

  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);

  const { data } = ctx.getImageData(0, 0, w, h);
  const thr = Number(threshold);
  const isBlank = (x, y) => {
    const i = (y * w + x) * 4;
    if (data[i + 3] === 0) return true;
    return data[i] >= thr && data[i + 1] >= thr && data[i + 2] >= thr;
  };
  const rowB = y => { for (let x = 0; x < w; x++) if (!isBlank(x, y)) return false; return true; };
  const colB = x => { for (let y = 0; y < h; y++) if (!isBlank(x, y)) return false; return true; };

  let top = 0;     while (top < h     && rowB(top))  top++;
  let bottom = h-1; while (bottom >= 0 && rowB(bottom)) bottom--;
  let left = 0;    while (left < w     && colB(left))  left++;
  let right = w-1;  while (right >= 0  && colB(right))  right--;
  if (left > right || top > bottom) return null;

  const cw = right - left + 1;
  const ch = bottom - top + 1;
  return { img, canvas, w, h, top, bottom, left, right, cw, ch };
}

export async function previewTrim(src, threshold = 245) {
  const bounds = await computeTrimBounds(src, threshold);
  if (!bounds || bounds.cw <= 0 || bounds.ch <= 0) return null;

  const out = document.createElement('canvas');
  out.width = bounds.cw; out.height = bounds.ch;
  out.getContext('2d').drawImage(bounds.canvas, bounds.left, bounds.top, bounds.cw, bounds.ch, 0, 0, bounds.cw, bounds.ch);
  return out.toDataURL('image/png');
}

export async function trimWhiteBorders(item, threshold = item.whiteThreshold) {
  if (!item || item.type !== 'image') return;

  // Siempre partimos del original para poder re-trim con distinto umbral.
  const src = item.originalSrc || item.src;
  const bounds = await computeTrimBounds(src, threshold);
  if (!bounds || bounds.cw <= 0 || bounds.ch <= 0) return;

  const out = document.createElement('canvas');
  out.width = bounds.cw; out.height = bounds.ch;
  out.getContext('2d').drawImage(bounds.canvas, bounds.left, bounds.top, bounds.cw, bounds.ch, 0, 0, bounds.cw, bounds.ch);

  const oldCx = item.x + item.w / 2;
  const oldCy = item.y + item.h / 2;
  const aspectRatio = bounds.ch / bounds.cw;
  const newW = clamp(item.w * (bounds.cw / bounds.w), 20, 10000);
  const newH = clamp(newW * aspectRatio, 20, 10000);

  item.src = out.toDataURL('image/png');
  if (!item.originalSrc) item.originalSrc = src;
  item.w = newW;
  item.h = newH;
  item.x = oldCx - newW / 2;
  item.y = oldCy - newH / 2;
  item.whiteThreshold = Number(threshold);
}
