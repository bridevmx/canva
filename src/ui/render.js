// render.js — Utilidades de binding reactivo para Nanostores + Vanilla JS

/**
 * Vincula el valor de un atom a textContent de un elemento.
 */
export function bindText(el, store) {
  if (!el) return;
  const unsubscribe = store.subscribe(val => {
    el.textContent = val !== undefined && val !== null ? val : '';
  });
  return unsubscribe;
}

/**
 * Muestra/oculta un elemento según el valor de un store o un predicado.
 */
export function bindShow(el, store, predicate = val => !!val) {
  if (!el) return;
  const unsubscribe = store.subscribe(val => {
    if (predicate(val)) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
  return unsubscribe;
}

/**
 * Vincula clases CSS condicionales a partir de un store.
 * @param {HTMLElement} el
 * @param {any} store
 * @param {Object.<string, function(*): boolean>} classMap - Mapa de clase a predicado
 */
export function bindClass(el, store, classMap) {
  if (!el) return;
  const unsubscribe = store.subscribe(val => {
    for (const [className, predicate] of Object.entries(classMap)) {
      if (predicate(val)) {
        el.classList.add(className);
      } else {
        el.classList.remove(className);
      }
    }
  });
  return unsubscribe;
}

/**
 * Vincula un estilo en línea según el valor de un store.
 */
export function bindStyle(el, store, styleFn) {
  if (!el) return;
  const unsubscribe = store.subscribe(val => {
    const styles = styleFn(val);
    for (const [key, value] of Object.entries(styles)) {
      el.style[key] = value;
    }
  });
  return unsubscribe;
}

/**
 * Vincula atributos HTML (como disabled o src) según el valor de un store.
 */
export function bindAttr(el, store, attrName, attrFn = val => val) {
  if (!el) return;
  const unsubscribe = store.subscribe(val => {
    const res = attrFn(val);
    if (res === false || res === null || res === undefined) {
      el.removeAttribute(attrName);
    } else {
      el.setAttribute(attrName, res);
    }
  });
  return unsubscribe;
}

/**
 * Two-way data binding para inputs.
 */
export function bindInput(el, store, key = null) {
  if (!el) return;
  const isCheckbox = el.type === 'checkbox';
  const isRadio = el.type === 'radio';

  const updateStore = () => {
    let val;
    if (isCheckbox) {
      val = el.checked;
    } else if (isRadio) {
      if (el.checked) val = el.value;
      else return;
    } else if (el.type === 'number') {
      val = Number(el.value);
    } else {
      val = el.value;
    }

    if (key) {
      const current = store.get();
      store.set({ ...current, [key]: val });
    } else {
      store.set(val);
    }
  };

  el.addEventListener('input', updateStore);
  el.addEventListener('change', updateStore);

  const unsubscribe = store.subscribe(val => {
    const actualVal = key && val ? val[key] : val;
    if (isCheckbox) {
      el.checked = !!actualVal;
    } else if (isRadio) {
      el.checked = el.value === actualVal;
    } else {
      el.value = actualVal !== undefined && actualVal !== null ? actualVal : '';
    }
  });

  return () => {
    el.removeEventListener('input', updateStore);
    el.removeEventListener('change', updateStore);
    unsubscribe();
  };
}

/**
 * Renderizado eficiente de listas con reconciliación básica.
 */
export function renderList(container, store, keyFn, templateFn) {
  if (!container) return;
  let elementMap = new Map();

  const unsubscribe = store.subscribe(items => {
    const newItems = Array.isArray(items) ? items : [];
    const newElementMap = new Map();
    const fragment = document.createDocumentFragment();

    newItems.forEach((item, index) => {
      const key = keyFn(item, index);
      let existingEl = elementMap.get(key);

      if (existingEl) {
        // Actualizar el elemento si templateFn soporta actualizaciones
        // Si no, simplemente lo mantenemos y reposicionamos
        newElementMap.set(key, existingEl);
        fragment.appendChild(existingEl);
      } else {
        const el = templateFn(item, index);
        if (el) {
          newElementMap.set(key, el);
          fragment.appendChild(el);
        }
      }
    });

    // Remover los que ya no están
    for (const [key, el] of elementMap.entries()) {
      if (!newElementMap.has(key)) {
        el.remove();
      }
    }

    container.innerHTML = '';
    container.appendChild(fragment);
    elementMap = newElementMap;
  });

  return unsubscribe;
}
