/* ==========================================================================
   ADDEREIN — export-pdf.js
   Genera un PDF pixel-perfect de CADA página en CADA idioma (ES + EN),
   en el orden del menú de navegación, y los combina en web-EN.pdf / web-ES.pdf.

   Mecanismo de idioma (detectado en js/site.js):
     - localStorage['adderein-lang'] = 'en' | 'es'  (por defecto 'en')
     - applyLang() reemplaza innerHTML de cada [data-i18n-en|es] y fija
       document.documentElement.lang. Se ejecuta al cargar leyendo localStorage.
     - Lo forzamos con page.evaluateOnNewDocument ANTES de navegar y verificamos
       que el texto ha cambiado antes de exportar.

   Uso:  node export-pdf.js
   ========================================================================== */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');

// ----------------------------------------------------------------------------
// Configuración
// ----------------------------------------------------------------------------
const ROOT = __dirname;                 // carpeta del sitio estático
const OUT_DIR = path.join(ROOT, 'pdf'); // salida
const HOST = '127.0.0.1';
const VIEWPORT_WIDTH = 1440;
const LANGS = ['en', 'es'];

// Orden EXACTO del menú de navegación (.nav-links en index.html)
const PAGES = [
  { file: 'index.html',         slug: 'index' },        // About Us / Nosotros
  { file: 'technology.html',    slug: 'technology' },   // Technology / Tecnología
  { file: 'cybersecurity.html', slug: 'cybersecurity' },// Cybersecurity / Ciberseguridad
  { file: 'services.html',      slug: 'services' },     // Our services / Nuestros servicios
  { file: 'experience.html',    slug: 'experience' },   // Experience / Experiencia
  { file: 'contact.html',       slug: 'contact' },      // Contact / Contacto
];

// ----------------------------------------------------------------------------
// Servidor estático con soporte de HTTP Range (necesario para los <video> mp4)
// ----------------------------------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.avif': 'image/avif',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      try {
        let urlPath = decodeURIComponent(req.url.split('?')[0]);
        if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
        // Evita salir de ROOT
        const filePath = path.join(ROOT, path.normalize(urlPath).replace(/^(\.\.[/\\])+/, ''));
        if (!filePath.startsWith(ROOT)) { res.writeHead(403).end(); return; }

        fs.stat(filePath, (err, stat) => {
          if (err || !stat.isFile()) { res.writeHead(404).end('Not found'); return; }
          const ext = path.extname(filePath).toLowerCase();
          const type = MIME[ext] || 'application/octet-stream';
          const range = req.headers.range;

          if (range) {
            // Petición parcial (vídeos)
            const m = /bytes=(\d*)-(\d*)/.exec(range);
            let start = m && m[1] ? parseInt(m[1], 10) : 0;
            let end = m && m[2] ? parseInt(m[2], 10) : stat.size - 1;
            if (isNaN(start)) start = 0;
            if (isNaN(end) || end >= stat.size) end = stat.size - 1;
            res.writeHead(206, {
              'Content-Type': type,
              'Content-Range': `bytes ${start}-${end}/${stat.size}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': end - start + 1,
            });
            fs.createReadStream(filePath, { start, end }).pipe(res);
          } else {
            res.writeHead(200, {
              'Content-Type': type,
              'Content-Length': stat.size,
              'Accept-Ranges': 'bytes',
              'Cache-Control': 'no-store',
            });
            fs.createReadStream(filePath).pipe(res);
          }
        });
      } catch (e) {
        res.writeHead(500).end(String(e));
      }
    });
    server.listen(0, HOST, () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

// ----------------------------------------------------------------------------
// Autoscroll: recorre toda la página para disparar lazy-loading e iniciar vídeos
// ----------------------------------------------------------------------------
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let total = 0;
      const step = 250;
      const timer = setInterval(() => {
        const sh = document.documentElement.scrollHeight;
        window.scrollBy(0, step);
        total += step;
        if (total >= sh) { clearInterval(timer); resolve(); }
      }, 60);
    });
    window.scrollTo(0, 0);
  });
  // pequeña espera para que se asienten imágenes/transiciones
  await new Promise((r) => setTimeout(r, 600));
}

// ----------------------------------------------------------------------------
// Exporta una página en un idioma concreto
// ----------------------------------------------------------------------------
async function exportPage(browser, baseUrl, page0, lang, index) {
  const page = await browser.newPage();
  await page.setViewport({ width: VIEWPORT_WIDTH, height: 1024, deviceScaleFactor: 2 });

  // 1) Fuerza el idioma ANTES de que corra site.js
  await page.evaluateOnNewDocument((l) => {
    try { localStorage.setItem('adderein-lang', l); } catch (e) {}
  }, lang);

  // 2) Ignora @media print → usa los estilos de pantalla
  await page.emulateMediaType('screen');

  // 3) Carga esperando que la red quede inactiva
  const url = `${baseUrl}/${page0.file}`;
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 90000 });

  // 4) Espera a que site.js haya aplicado el idioma
  await page.waitForFunction(
    (l) => document.documentElement.getAttribute('lang') === l,
    { timeout: 15000 },
    lang
  );

  // 5) Verifica que el texto realmente cambió al idioma pedido
  const check = await page.evaluate((l) => {
    const htmlLang = document.documentElement.getAttribute('lang');
    const activeBtn = document.querySelector('.lang button.is-active');
    const activeLang = activeBtn ? activeBtn.getAttribute('data-lang') : null;
    // texto centinela: primer elemento i18n con contenido
    const sample = document.querySelector('[data-i18n-' + l + ']');
    const expected = sample ? sample.getAttribute('data-i18n-' + l) : null;
    const got = sample ? sample.innerHTML : null;
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    return {
      htmlLang,
      activeLang,
      matches: norm(expected) === norm(got),
      sampleText: norm(got).slice(0, 60),
    };
  }, lang);

  if (check.htmlLang !== lang || check.activeLang !== lang || !check.matches) {
    throw new Error(
      `[${page0.file} · ${lang}] verificación de idioma FALLÓ → ` +
      `htmlLang=${check.htmlLang} activeBtn=${check.activeLang} matches=${check.matches}`
    );
  }

  // 6) Autoscroll para lazy-loading + vídeos
  await autoScroll(page);

  // 7) Mide la altura real y exporta como UNA sola hoja gigante (no A4)
  const height = await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight));

  const n = String(index + 1).padStart(2, '0');
  const outName = `${n}-${page0.slug}-${lang}.pdf`;
  const outPath = path.join(OUT_DIR, outName);

  await page.pdf({
    path: outPath,
    printBackground: true,
    width: `${VIEWPORT_WIDTH}px`,
    height: `${height}px`,
    pageRanges: '1',          // garantiza una sola página
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  await page.close();
  console.log(`  ✓ ${outName}  (${VIEWPORT_WIDTH}×${height}px · "${check.sampleText}…")`);
  return outPath;
}

// ----------------------------------------------------------------------------
// Combina varios PDFs en uno
// ----------------------------------------------------------------------------
async function mergePdfs(files, outPath) {
  const merged = await PDFDocument.create();
  for (const f of files) {
    const bytes = fs.readFileSync(f);
    const src = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  fs.writeFileSync(outPath, await merged.save());
  console.log(`  ✓ ${path.basename(outPath)}  (${files.length} páginas)`);
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------
(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('▶ Levantando servidor estático…');
  const { server, port } = await startServer();
  const baseUrl = `http://${HOST}:${port}`;
  console.log(`  servidor en ${baseUrl}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });

  const generated = { en: [], es: [] };

  try {
    for (const lang of LANGS) {
      console.log(`▶ Idioma: ${lang.toUpperCase()}`);
      for (let i = 0; i < PAGES.length; i++) {
        const out = await exportPage(browser, baseUrl, PAGES[i], lang, i);
        generated[lang].push(out);
      }
      console.log('');
    }

    console.log('▶ Combinando PDFs maestros…');
    await mergePdfs(generated.en, path.join(OUT_DIR, 'web-EN.pdf'));
    await mergePdfs(generated.es, path.join(OUT_DIR, 'web-ES.pdf'));
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`\n✅ Listo. PDFs en: ${OUT_DIR}`);
})().catch((err) => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});
