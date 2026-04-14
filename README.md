# ADDEREIN Web Corporativa

Sitio web estatico corporativo (HTML + CSS + JS).

## Estructura principal

- index.html
- contact.html
- expertise.html
- projects.html
- services.html
- value.html
- contacto.html
- experiencia.html
- sectores.html
- outsourcing.html
- nosotros/index.html
- tecnologia/index.html
- servicios/index.html
- sources/css/main.css
- sources/js/main.js
- sources/images/
- sources/videos/
- _headers

## Como abrirla en local (1 clic)

### Opcion recomendada en Windows

1. Doble clic en iniciar-web.bat.
2. Se abrira el navegador en http://localhost:8080.
3. Para detener el servidor, cierra la ventana de terminal.

### Opcion PowerShell

1. Clic derecho sobre iniciar-web.ps1 y ejecutar con PowerShell.
2. Se abrira el navegador en http://localhost:8080.

## Cambios rapidos

- Colores y estilo global: sources/css/main.css
- Menu movil, reveal y parallax: sources/js/main.js
- Imagen hero de cada pagina: variable --hero-image dentro de cada HTML

## Compartir con otra persona

1. Comprime la carpeta adderein.com en ZIP.
2. Envia el ZIP.
3. La otra persona solo debe descomprimir y ejecutar iniciar-web.bat.

## Publicacion (opcional)

Compatible con hosting estatico (Cloudflare Pages, Netlify, GitHub Pages).
El archivo _headers ya incluye cabeceras de seguridad para Cloudflare Pages.

## Subir a GitHub (repositorio nuevo)

Ejecuta estos comandos dentro de esta carpeta (`adderein.com`):

1. `git init`
2. `git add .`
3. `git commit -m "Estructura inicial web ADDEREIN"`
4. `git branch -M main`
5. `git remote add origin https://github.com/TU_USUARIO/ADDEREIN.git`
6. `git push -u origin main`
