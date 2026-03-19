const PB_URL = 'https://scraping.pockethost.io';
const APP_NAME = 'StickerMaker'; // ¡CAMBIA ESTO PARA ACTUALIZAR EL NOMBRE EN TODA LA APP!

document.addEventListener('alpine:init', () => {
  const _pb = new PocketBase(PB_URL);
  _pb.autoCancellation(false);

  Alpine.store('app', { name: APP_NAME });

  Alpine.store('auth', {
    get pb() { return _pb; },
    user: null, 
    token: null,
    isAuth()  { return !!this.token; },
    isAdmin() { return !!(this.user?.role === 'admin' || this.user?.isAdmin === true || this.user?.admin === true); },
    init() {
      this.restore();
    },
    restore() {
      try {
        const token = localStorage.getItem('sm_token');
        const user  = localStorage.getItem('sm_user');
        if (token && user && user !== 'undefined') {
          this.token = token; this.user = JSON.parse(user);
          _pb.authStore.save(token, this.user);
        }
      } catch (e) {
        console.error("Error restoring auth:", e);
        localStorage.removeItem('sm_token');
        localStorage.removeItem('sm_user');
      }
    },
    async loginWithPassword(identity, password) {
      // Identity puede ser el "username" (tu campo de 24 caracteres) o el correo real
      await _pb.collection('users_canva').authWithPassword(identity, password);
      this.token = _pb.authStore.token; this.user = _pb.authStore.record;
      localStorage.setItem('sm_token', this.token);
      localStorage.setItem('sm_user', JSON.stringify(this.user));
    },
    logout() {
      _pb.authStore.clear(); this.token = null; this.user = null;
      localStorage.removeItem('sm_token'); localStorage.removeItem('sm_user');
      window.location.href = 'index.html';
    }
  });
});

function isAuthenticated() { return !!localStorage.getItem('sm_token'); }
function isAdmin() {
  const u = localStorage.getItem('sm_user');
  if (!u) return false;
  try {
    const user = JSON.parse(u);
    return user.role === 'admin' || user.isAdmin === true || user.admin === true;
  } catch(e) { return false; }
}
