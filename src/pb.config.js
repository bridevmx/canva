// pb.config.js — Única fuente de verdad para PocketBase y configuración de la app.
// Cualquier cambio de URL, colección o nombre de campo se hace aquí.

export const PB_CONFIG = {
  // Endpoint de la instancia PocketBase
  url: 'https://scraping.pockethost.io',

  // Versión del SDK cargada via CDN (fija por seguridad)
  sdkVersion: '0.26.0',
  sdkCdnUrl: 'https://cdn.jsdelivr.net/npm/pocketbase@0.26.0/dist/pocketbase.umd.js',

  // Nombres de colecciones
  collections: {
    users:     'users_canva',
    orders:    'sticker_orders'
  },

  // Campos relevantes de cada colección (referencia centralizada)
  fields: {
    users: {
      role:           'role',
      username:       'username',
      email:          'email',
      phone:          'phone',
      emailVisibility:'emailVisibility'
    },
    orders: {
      id:             'id',
      title:          'title',
      status:         'status',
      paperSize:      'paper_size',
      pageBg:         'page_bg',
      canvasData:     'canvas_data',
      adminCanvasData:'admin_canvas_data',
      uploadAssets:   'upload_assets',
      user:           'user',
      materialType:   'material_type'
    }
  },

  // Endpoint del servicio externo de impresión
  printerApiUrl: 'https://printer.tiendagenesis.com/print-edible-media'
};

// ── Configuración de la app (no relacionada con PB) ─────────────────────────

export const APP_CONFIG = {
  name: 'StickerMaker',

  // Tamaños de papel soportados (px a 96 DPI)
  paperSizes: {
    a4:     { w: 794, h: 1123, label: 'A4' },
    letter: { w: 816, h: 1056, label: 'Letter' }
  },

  // Lista blanca de redirecciones tras login (sin /admin ni /register por seguridad)
  allowedRedirects: ['/canvas', '/dashboard'],

  // Productos para impresión comestible
  products: [
    { code: 'RICE_03',          title: 'Oblea de Arroz 0.3 mm (La delicada)',   desc: 'Flexible, ideal para encajes y arte floral. No se quiebra.',                precio: 85  },
    { code: 'RICE_04',          title: 'Oblea de Arroz 0.4 mm (La todoterreno)', desc: 'Equilibrio exacto y colores nítidos. La favorita de los reposteros.',   precio: 85  },
    { code: 'RICE_06',          title: 'Oblea de Arroz 0.6 mm (Gran soporte)',   desc: 'Rigidez extrema. Perfecta para Toppers que deben mantenerse de pie.',      precio: 100 },
    { code: 'SUGAR_SHEET',      title: 'Hoja de Azúcar (La de lujo)',             desc: 'Calidad fotográfica con colores vibrantes y negros profundos.',            precio: 175 },
    { code: 'GELATIN_TRANSFER', title: 'Transfer para Gelatina (La técnica)',    desc: 'Diseñada para transferir diseños artísticos con gran precisión.',         precio: 165 }
  ],

  fonts: [
    { label: 'Inter', value: 'Inter, sans-serif' },           { label: 'Montserrat', value: 'Montserrat, sans-serif' },
    { label: 'Oswald', value: 'Oswald, sans-serif' },         { label: 'Anton', value: 'Anton, sans-serif' },
    { label: 'Pacifico', value: 'Pacifico, cursive' },        { label: 'Bebas Neue', value: '"Bebas Neue", sans-serif' },
    { label: 'Lobster', value: 'Lobster, cursive' },         { label: 'Luckiest Guy', value: '"Luckiest Guy", cursive' },
    { label: 'Fredoka', value: 'Fredoka, sans-serif' },      { label: 'Baloo 2', value: '"Baloo 2", cursive' },
    { label: 'Chewy', value: 'Chewy, cursive' },              { label: 'Permanent Marker', value: '"Permanent Marker", cursive' },
    { label: 'Nunito', value: 'Nunito, sans-serif' },        { label: 'Raleway', value: 'Raleway, sans-serif' },
    { label: 'Poppins', value: 'Poppins, sans-serif' },      { label: 'Archivo Black', value: '"Archivo Black", sans-serif' },
    { label: 'Passion One', value: '"Passion One", sans-serif' }, { label: 'Comfortaa', value: 'Comfortaa, sans-serif' },
    { label: 'Abril Fatface', value: '"Abril Fatface", cursive' },  { label: 'Amatic SC', value: '"Amatic SC", cursive' },
    { label: 'Caveat', value: 'Caveat, cursive' },           { label: 'Cinzel', value: 'Cinzel, serif' },
    { label: 'Courgette', value: 'Courgette, cursive' },     { label: 'Dancing Script', value: '"Dancing Script", cursive' },
    { label: 'Righteous', value: 'Righteous, cursive' },      { label: 'Russo One', value: '"Russo One", sans-serif' },
    { label: 'Sacramento', value: 'Sacramento, cursive' },    { label: 'Satisfy', value: 'Satisfy, cursive' }
  ],

  // Umbrales de descuento por volumen
  discountTiers: [
    { minQty: 50, pct: 20 },
    { minQty: 25, pct: 15 },
    { minQty: 10, pct: 10 }
  ],

  minOrderTotal: 80,

  // AlpineJS CDN (versión exacta fijada por seguridad — fix #7)
  alpineCdnUrl: 'https://cdn.jsdelivr.net/npm/alpinejs@3.14.8/dist/cdn.min.js'
};

// ── Helpers de acceso rápido ─────────────────────────────────────────────────

export const PB_URL     = PB_CONFIG.url;
export const PB_SDK_URL = PB_CONFIG.sdkCdnUrl;
export const COLLECTIONS = PB_CONFIG.collections;
export const FIELDS = PB_CONFIG.fields;

export const APP_NAME          = APP_CONFIG.name;
export const PAPER_SIZES       = APP_CONFIG.paperSizes;
export const ALLOWED_REDIRECTS = APP_CONFIG.allowedRedirects;
export const PRODUCTS          = APP_CONFIG.products;
export const FONTS             = APP_CONFIG.fonts;
export const DISCOUNT_TIERS    = APP_CONFIG.discountTiers;
export const MIN_ORDER_TOTAL   = APP_CONFIG.minOrderTotal;
export const ALPINE_CDN_URL    = APP_CONFIG.alpineCdnUrl;
export const PRINTER_API_URL   = PB_CONFIG.printerApiUrl;