# Exportar la web completa a un único PDF

Genera **`salida.pdf`** con las 6 páginas del sitio (las "pestañas": About, Technology,
Cybersecurity, Services, Experience, Contact), una a continuación de otra, con salto de
página entre cada una.

## Requisitos
- [Node.js](https://nodejs.org) 18 o superior (incluye `npm`).

## Pasos

1. Abre una terminal **en esta carpeta** (la que contiene `index.html`).

2. Instala las dependencias (la primera vez Puppeteer descarga su propio Chromium, ~150 MB):
   ```bash
   npm install
   ```

3. Genera el PDF:
   ```bash
   npm run pdf
   ```

4. Listo: aparece **`salida.pdf`** en esta misma carpeta.

### Versión en español
El sitio es bilingüe (EN por defecto). Para exportarlo en español:
```bash
npm run pdf:es
```
(equivale a `PDF_LANG=es node export-pdf.js`).

## Qué hace el script (`export-pdf.js`)
- Abre cada `.html` por su ruta local (`file://`), así las imágenes, el CSS y los
  iframes de ilustraciones se cargan con sus rutas relativas.
- Fuerza que se vea **todo** el contenido oculto antes de imprimir:
  - animaciones de scroll `.reveal` (emulando `prefers-reduced-motion`),
  - acordeones (`.compact-card.acc` → abiertos),
  - iframes lazy (`data-src` → `src`).
- Espera a `networkidle0` (red en reposo) y a que carguen fuentes e iframes.
- Bloquea los vídeos `.mp4` (no se imprimen y pesan >150 MB).
- Imprime en **A4**, `printBackground: true`, márgenes de **12 mm**, reutilizando el
  bloque `@media print` que ya trae `css/site.css`.
- Fusiona los 6 PDF en `salida.pdf` con `pdf-lib`; cada pestaña empieza en página nueva.

## Ajustes rápidos
- **Cambiar el orden o qué páginas se incluyen:** edita el array `PAGES` al principio de
  `export-pdf.js`.
- **Cambiar márgenes/tamaño:** edita el objeto `margin` / `format` en la llamada a `page.pdf(...)`.
- **Ver el navegador mientras trabaja (depurar):** cambia `headless: true` por `headless: false`.
