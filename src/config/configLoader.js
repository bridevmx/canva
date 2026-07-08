import configData from './siteConfig.json';

const config = configData;

/**
 * Obtiene un valor anidado del config usando dot notation.
 * Ej: get('landing.hero.title.highlight') → "nivel obra de arte."
 */
export function get(path, fallback = '') {
  return path.split('.').reduce((obj, key) => {
    if (obj && typeof obj === 'object' && key in obj) return obj[key];
    return fallback;
  }, config);
}

/**
 * Obtiene una sección completa del config.
 * Ej: getSection('landing.hero') → { badge, title, subtitle, cta }
 */
export function getSection(section) {
  return get(section, {});
}

/**
 * Obtiene el array de productos del landing.
 */
export function getProducts() {
  return get('landing.products', []);
}

/**
 * Obtiene la config de una página de auth específica.
 * Ej: getAuthConfig('login') → { title, subtitle, icon, ... }
 */
export function getAuthConfig(page) {
  return get(`auth.${page}`, {});
}

/**
 * Obtiene la config del sitio (brand, colors, etc.)
 */
export function getSiteConfig() {
  return get('site', {});
}

/**
 * Para debugging: imprime todo el config.
 */
export function printConfig() {
  console.log(JSON.stringify(config, null, 2));
}

export default config;
