const PB_URL  = 'https://scraping.pockethost.io'
const APP_NAME = 'StickerMaker'

document.addEventListener('alpine:init', () => {
    const _pb = new PocketBase(PB_URL)
    _pb.autoCancellation(false)

    Alpine.store('app', { name: APP_NAME })

    Alpine.store('auth', {
        get pb()   { return _pb },
        user:    null,
        token:   null,
        isReady: false,

        isAuth()  { return !!this.token },
        isAdmin() { return this.user?.role === 'admin' },

        async init() {
            // onChange con fireImmediately=true sincroniza localStorage → Alpine al arrancar
            // y reacciona a cualquier cambio futuro (login, logout, expiración)
            _pb.authStore.onChange((token, record) => {
                this.token = token
                this.user  = record
            }, true)

            // Validar token contra el SERVIDOR, no solo localStorage
            if (_pb.authStore.isValid) {
                try {
                    await _pb.collection('users_canva').authRefresh()
                } catch {
                    // Token inválido o expirado → limpiar sesión
                    _pb.authStore.clear()
                }
            }

            this.isReady = true
        },

        async loginWithPassword(identity, password) {
            await _pb.collection('users_canva').authWithPassword(identity, password)
            // onChange se dispara automáticamente — no se necesita setItem manual
        },

        logout() {
            _pb.authStore.clear()
            window.location.href = '/'
        }
    })

    Alpine.store('auth').init()
})

// Funciones globales para los guards síncronos en <script> de cada página
// Usan pb.authStore que ya restaura desde localStorage internamente
function isAuthenticated() {
    const pb = new PocketBase(PB_URL)
    return pb.authStore.isValid
}

function isAdmin() {
    const pb = new PocketBase(PB_URL)
    if (!pb.authStore.isValid) return false
    const model = pb.authStore.record
    return model?.role === 'admin'
}
