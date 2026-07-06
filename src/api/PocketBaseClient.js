// PocketBaseClient.js — Wrapper singleton de la conexión a PocketBase

import { PB_URL, PB_SDK_URL } from '../pb.config.js';

let pbLib = null;

function loadPB() {
  if (window.PocketBase) return Promise.resolve(window.PocketBase);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = PB_SDK_URL;
    s.onload = () => resolve(window.PocketBase);
    s.onerror = () => reject(new Error('No se pudo cargar PocketBase'));
    document.head.appendChild(s);
  });
}

let instance = null;

export class PocketBaseClient {
  static async getInstance() {
    if (instance) return instance;
    const PB = await loadPB();
    instance = new PB(PB_URL);
    instance.autoCancellation(false);
    return instance;
  }

  static get raw() {
    if (!instance) throw new Error('PocketBaseClient no inicializado. Llama getInstance() primero.');
    return instance;
  }
}

export function pb() { return PocketBaseClient.raw; }