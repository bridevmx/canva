# 🤖 Documentación Técnica Maestra: StickerMaker (AI-Readiness)

Este documento es una guía exhaustiva de la arquitectura, lógica y flujo de datos del proyecto **StickerMaker**. Está diseñado para que una Inteligencia Artificial posterior pueda comprender, depurar y extender el código sin necesidad de exploración manual extensa.

---

## 1. Misión y Concepto del Proyecto
**StickerMaker** es una SPA (Single Page Application) ligera para diseñar lienzos de impresión de grado profesional (obleas comestibles) en formato A4 (210x297mm). 

**Diferenciador Clave:** No utiliza el API `<canvas>` de HTML5 para el diseño (dibujo de píxeles), sino un **motor de posicionamiento absoluto basado en DOM**. Esto garantiza:
1.  **Nitidez Infinita:** Los textos no se pixelan al hacer zoom o imprimir, ya que son nodos de texto real.
2.  **Manipulación de Objetos:** Cada imagen o texto es un nodo independiente, permitiendo eventos de clic, rotación y redimensionalizado sin redibujar todo el lienzo.
3.  **Accesibilidad y SEO:** Los datos son nodos reales, lo que facilita la inspección y el rastreo si fuera necesario.

---

## 2. Stack Tecnológico (Cloud-First & Vanilla-Plus)
- **Lenguaje:** Vanilla JavaScript (ES6+).
- **Framework Reactivo:** [Alpine.js](https://alpinejs.dev/) (CDN). Toda la lógica vive en un objeto `stickerMaker()`.
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/) (Play CDN). Sin compilación previa, totalmente dinámico.
- **Base de Datos & Auth:** [PocketBase](https://pocketbase.io/) (SDK UMD). Persistencia en tiempo real y manejo de usuarios.
- **Servidor de Producción:** Nginx (vía Docker) para servir archivos estáticos con URLs limpias.

---

## 3. Estructura de Datos (Core State)
El estado completo de la aplicación reside en el objeto retornado por `stickerMaker()` en `/canvas`. Las variables más críticas son:

| Variable | Tipo | Descripción |
| :--- | :--- | :--- |
| `items` | `Array<Object>` | El "universo" de todos los stickers/textos de todas las hojas del proyecto. |
| `activePage` | `Number` | Índice de la hoja que se visualiza actualmente (1-based). |
| `pagesCount` | `Number` | Cantidad total de hojas creadas en el proyecto. |
| `pageColors` | `Object` | Mapas de colores fondo `{ 1: '#fff', 2: '#f00' }`. |
| `history` | `Array<String>` | Stack de strings JSON de `items` para el sistema Undo/Redo. |
| `canvasZoom` | `Number` | Multiplicador de escala visual (no afecta a los datos reales). |

### 3.1 Anatomía de un Item (Sticker)
Cada objeto dentro del array `items` sigue este patrón:
```json
{
  "id": "uuid-v4",
  "type": "image | text | shape",
  "page": 1, // Crucial para el sistema de pestañas
  "x": 100, "y": 100, "w": 200, "h": 200, // Coordenadas en px (Base A4)
  "rotation": 45, // En grados (float)
  "z": 10, // Profundidad de capa
  "src": "data:image... | https://...", // Fuente de imagen
  "text": "Hola", // Solo para type: text
  "fontFamily": "Inter", // Google Fonts cargadas dinámicamente
  "locked": false // Si true, bloquea drag/resize
}
```

---

## 4. Lógica de Pestañas (Multi-Page Rendering)
El sistema soporta múltiples obleas en un solo proyecto:
### En el Editor (`/canvas`):
Usamos un filtro reactivo: `sortedItems().filter(i => (i.page||1) === activePage)`. Esto asegura que solo veas los objetos de la pestaña seleccionada.
### En la Impresión (`/print`):
Usamos un bucle `<template x-for="p in pagesCount">` que genera múltiples `div.sheet`. 
**Importante:** Se aplica CSS `@media print { .sheet { page-break-after: always; } }` para que la impresora de `Canon G1110` detecte el salto de página automáticamente.

---

## 5. El Sistema de Cotización (Automated Billing)
Calculado dinámicamente en el getter `quote` de Alpine:
1.  **Cálculo de cantidad:** `(copias_solicitadas) * (número_de_pestañas)`. 
    - Ejemplo: 2 pestañas × 10 copias = 20 hojas totales.
2.  **Rangos de Descuento (Mayoreo):**
    - 1-9 hojas: 0% desc.
    - 10-24 hojas: 10% desc.
    - 25-49 hojas: 15% desc.
    - 50+ hojas: 20% desc.
3.  **Protección de Margen:** Cargo mínimo de **$80 MXN**. Si la multiplicación total por pieza es menor a 80, el sistema fuerza el cobro de 80 y recalcula el precio unitario final.

---

## 6. Integración con PocketBase (Persistence Layer)

### Guardado (`saveProject`):
Crea un registro en la colección `sticker_orders`.
- **Imágenes:** No se guardan como Base64 (para evitar saturar la BD). El sistema detecta imágenes nuevas, las agrega al campo `upload_assets` de PocketBase y reemplaza el `src` del item por un string especial `FILE:nombre_archivo.png`.
- **Metadatos:** El campo `canvas_data` guarda un objeto JSON con: `items`, `pageColors` y el resumen de la `quote` (para auditoría).

### Carga (`loadProject`):
1. Recupera el JSON de `canvas_data`.
2. Mapea los strings `FILE:...` transformándolos en URLs válidas usando `pb.files.getUrl()`.
3. Determina el valor máximo de la propiedad `page` en los ítems para reconstruir el `pagesCount` correctamente.

---

## 7. Sistema de Herramientas y UX

### Reglas y Cuadrícula (Rulers)
Generadas mediante **SVGs dinámicos** inyectados como fondo (background-image) de divs.
- **Constante:** `pxPerCm = 37.8095`. Todas las medidas se basan en este factor de conversión para que lo que ves en pantalla mida lo mismo que en la realidad (A4 = 21cm x 29.7cm).

### Sistema de Undo/Redo (Historial)
- Cada vez que una acción (drag, resize, rotar, borrar) termina (`stopAction`), ejecutamos `pushHistory()`.
- Guardamos copias completas de `items` como strings JSON en un array.
- **Límite:** 60 estados para evitar problemas de memoria en móviles.

---

## 8. Guía de Mantenimiento para una IA (Pasos a Seguir)

### ¿Cómo agregar un nuevo tipo de material?
Ve a `/canvas` -> objeto `products`. Agregue un nuevo objeto con `code, title, desc, precio`. El cotizador lo tomará automáticamente.

### ¿Cómo solucionar problemas de exportación (CORS)?
Si al intentar recortar (Crop) o quitar fondos una imagen no funciona, es un error de "Tainted Canvas". 
**Solución:** Asegúrate de que el objeto `Image` temporal tenga `img.crossOrigin = "anonymous"` antes de asignar el `src`.

### ¿Cómo ajustar márgenes de impresión?
Edita el bloque `<style id="print-page-style">` dentro de la función `updatePageStyle()`. Aquí se define el tamaño `@page`.

---

## 9. Despliegue con Docker (Nginx)
El proyecto usa el archivo `nginx.conf` en la raíz para habilitar URLs amigables. 
**Regla Crítica:**
```nginx
location / {
    try_files $uri $uri.html $uri/ /index.html;
}
```
Esto permite que el archivo físicamente llamado `canvas.html` sea accesible simplemente como `/canvas`. El `Dockerfile` copies `.` hacia `/usr/share/nginx/html/` en el contenedor Alpine final.

---

**Propiedad Certificada de:** Tienda Genesis - StickerMaker Engine.
**Versión de Arquitectura:** 4.2.0 "Cloud Tabs & Quotes"
