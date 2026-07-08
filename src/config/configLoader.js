import configData from './siteConfig.json';

let _records = configData;
let _config = {};

/**
 * Convierte el array plano [{key, value, section}] a objeto anidado.
 * Ej: [{key:"hero_title", value:"Eleva...", section:"landing"}]
 *   → { landing: { hero_title: "Eleva..." } }
 */
function buildConfig(records) {
  const result = {};
  for (const r of records) {
    if (!result[r.section]) result[r.section] = {};
    result[r.section][r.key] = r.value;
  }
  return result;
}

/**
 * Agrupa los products_* en un array de objetos.
 * Ej: { product_1_title, product_1_desc } → [{ title, desc }]
 */
function buildProducts(records) {
  const products = [];
  const productRecords = records.filter(r => r.section === 'products');
  const keys = [...new Set(productRecords.map(r => r.key.replace(/_\d+_/, '_N_').replace(/_\d+$/, '')))];
  const indices = [...new Set(productRecords.map(r => {
    const m = r.key.match(/product_(\d+)_/);
    return m ? m[1] : null;
  }).filter(Boolean))];

  for (const idx of indices) {
    const obj = {};
    const prefix = `product_${idx}_`;
    for (const r of productRecords) {
      if (r.key.startsWith(prefix)) {
        obj[r.key.slice(prefix.length)] = r.value;
      }
    }
    if (obj.title) products.push(obj);
  }
  return products;
}

/**
 * Agrupa las keys que terminan en _tag_N en un array.
 * Ej: footer_tag_1, footer_tag_2 → ["#tag1", "#tag2"]
 */
function buildTags(records, section) {
  return records
    .filter(r => r.section === section && r.key.match(/_tag_\d+$/))
    .sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }))
    .map(r => r.value);
}

/**
 * Inicializa el config desde un array de registros (mock o PocketBase).
 */
export function initConfig(records) {
  _records = records;
  _config = buildConfig(records);

  // Agregar array de productos
  _config.products = buildProducts(records);

  // Agregar tags del footer
  _config.footer_tags = buildTags(records, 'footer');
}

/**
 * Obtiene un valor por section y key.
 * Ej: getVal('landing', 'hero_title') → "Eleva la repostería"
 */
export function getVal(section, key, fallback = '') {
  return _config[section]?.[key] ?? fallback;
}

/**
 * Obtiene una sección completa como objeto.
 * Ej: getSection('landing') → { hero_title: "...", hero_subtitle: "..." }
 */
export function getSection(section) {
  return _config[section] || {};
}

/**
 * Obtiene el array de productos parseado.
 */
export function getProducts() {
  return _config.products || [];
}

/**
 * Obtiene los tags del footer.
 */
export function getFooterTags() {
  return _config.footer_tags || [];
}

/**
 * Para debugging: imprime el config completo.
 */
export function printConfig() {
  console.log(JSON.stringify(_config, null, 2));
}

// Inicializar con el mock por defecto
initConfig(configData);

export default _config;
