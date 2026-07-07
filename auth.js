const PB_URL  = 'https://scraping.pockethost.io'
const APP_NAME = 'StickerMaker'

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
