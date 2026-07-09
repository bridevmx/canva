const PB_URL = 'https://scraping.pockethost.io';
const COLLECTION = 'stiker_com_settings';

let _records = [];
let _config = {};
let _initialized = false;

/**
 * Busca un valor por key directamente.
 * Ej: getVal('landing.hero_title') → "Eleva la repostería"
 */
export function getVal(key, fallback = '') {
  return _config[key] ?? fallback;
}

/**
 * Obtiene todas las keys que empiezan con un prefijo.
 * Ej: getSection('landing') → { 'landing.hero_title': "Eleva...", ... }
 */
export function getSection(prefix) {
  const result = {};
  for (const [k, v] of Object.entries(_config)) {
    if (k.startsWith(prefix + '.') || k.startsWith(prefix + '_')) {
      result[k] = v;
    }
  }
  return result;
}

/**
 * Obtiene el array de productos parseado desde keys como product_N_title, product_N_desc, etc.
 */
export function getProducts() {
  const products = [];
  const productKeys = Object.keys(_config).filter(k => /^products\.p\d+\./.test(k));

  const indices = [...new Set(
    productKeys.map(k => {
      const m = k.match(/products\.p(\d+)\./);
      return m ? m[1] : null;
    }).filter(Boolean)
  )].sort((a, b) => Number(a) - Number(b));

  for (const idx of indices) {
    const prefix = `products.p${idx}.`;
    const obj = {};
    for (const [k, v] of Object.entries(_config)) {
      if (k.startsWith(prefix)) {
        obj[k.slice(prefix.length)] = v;
      }
    }
    if (obj.title) products.push(obj);
  }
  return products;
}

/**
 * Obtiene los tags del footer desde la key footer.tags (separados por coma).
 */
export function getFooterTags() {
  const raw = _config['footer.tags'] || '';
  return raw.split(',').map(t => t.trim()).filter(Boolean);
}

/**
 * Carga los registros desde PocketBase y construye el config plano.
 */
export async function initConfig(records) {
  if (records) {
    _records = records;
  } else {
    const res = await fetch(`${PB_URL}/api/collections/${COLLECTION}/records?page=1&perPage=500`);
    if (!res.ok) throw new Error(`Config fetch failed: ${res.status}`);
    const data = await res.json();
    _records = data.items || [];
  }

  _config = {};
  for (const r of _records) {
    _config[r.key] = r.value;
  }
  _initialized = true;
}

/**
 * Obtiene el valor raw de un key sin punto.
 * Ej: getRaw('site_brand_name') → "StickerMaker"
 */
export function getRaw(key, fallback = '') {
  return _config[key] ?? fallback;
}

/**
 * Para debugging: imprime el config completo.
 */
export function printConfig() {
  console.log(JSON.stringify(_config, null, 2));
}

export { _initialized as isInitialized };
export default _config;
