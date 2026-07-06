// AuthManager.js — Clase POO para autenticación y guards

import { PB_URL, ALLOWED_REDIRECTS } from '../pb.config.js';

export class AuthManager {
  constructor() {
    // Usamos la instancia global PocketBase del navegador (que ya carga auth.js como script clásico)
    // Aquí creamos una referencia Pb local compatible con el SDK
    this._pb = null;
    this.user = null;
    this.token = null;
    this.isReady = false;
  }

  async init(alpineRegister = null) {
    // Esperar a que PocketBase global esté disponible (auth.js lo carga)
    if (!window.PocketBase) {
      await new Promise(res => {
        const check = () => window.PocketBase ? res() : setTimeout(check, 20);
        check();
      });
    }
    this._pb = new window.PocketBase(PB_URL);
    this._pb.autoCancellation(false);

    // onChange sincroniza localStorage → AuthManager
    this._pb.authStore.onChange((token, record) => {
      this.token = token;
      this.user  = record;
      if (alpineRegister) alpineRegister(token, record);
    }, true);

    // Validar token contra el servidor (no solo localStorage)
    if (this._pb.authStore.isValid) {
      try {
        await this._pb.collection('users_canva').authRefresh();
      } catch {
        this._pb.authStore.clear();
      }
    }
    this.isReady = true;
  }

  isAuth()   { return !!this.token; }
  isAdmin()  { return this.user?.role === 'admin'; }
  get pb()   { return this._pb; }

  async loginWithPassword(identity, password) {
    await this._pb.collection('users_canva').authWithPassword(identity, password);
  }

  logout() {
    this._pb.authStore.clear();
    window.location.href = '/';
  }

  // Guards síncronos (usados en <script> antes de que Alpine arranque)
  static isAuthenticated() {
    if (!window.PocketBase) return false;
    const pb = new window.PocketBase(PB_URL);
    return pb.authStore.isValid;
  }

  static isAdmin() {
    if (!window.PocketBase) return false;
    const pb = new window.PocketBase(PB_URL);
    if (!pb.authStore.isValid) return false;
    return pb.authStore.record?.role === 'admin';
  }

  static applyRedirect(qsRedirect) {
    const target = ALLOWED_REDIRECTS.includes(qsRedirect) ? qsRedirect : '/dashboard';
    window.location.replace(target);
  }
}