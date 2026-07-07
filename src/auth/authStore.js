import { atom } from 'https://cdn.jsdelivr.net/npm/nanostores@0.11.3/+esm';
import { PB_URL } from '../pb.config.js';

const _pb = new PocketBase(PB_URL);
_pb.autoCancellation(false);

export const $authUser = atom(null);
export const $authToken = atom(null);
export const $authReady = atom(false);

export const getAuthPb = () => _pb;

export const isAuthStore = () => !!$authToken.get();
export const isAdminStore = () => $authUser.get()?.role === 'admin';

export async function initAuth() {
  _pb.authStore.onChange((token, record) => {
    $authToken.set(token);
    $authUser.set(record);
  }, true);

  if (_pb.authStore.isValid) {
    try {
      await _pb.collection('users_canva').authRefresh();
    } catch {
      _pb.authStore.clear();
    }
  }
  $authReady.set(true);
}

export async function loginWithPassword(identity, password) {
  await _pb.collection('users_canva').authWithPassword(identity, password);
}

export function logout() {
  _pb.authStore.clear();
  window.location.href = '/';
}
