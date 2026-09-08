# EsCuatroCero · PWA para GitHub Pages

Aplicación de gestión del programa EsCuatroCero (IES Virgen de Villadiego, Peñaflor) preparada como **PWA instalable** y para desplegarse en **GitHub Pages** de forma gratuita.

## Contenido del paquete

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La aplicación completa (HTML + CSS + JS, con Firebase). |
| `manifest.json` | Manifest de la PWA: nombre, colores, iconos y modo `standalone`. |
| `sw.js` | Service Worker: caché offline del shell y de los CDNs. Los datos de Firebase **nunca** se cachean. |
| `icons/` | Iconos 192 y 512 px (variantes `any` y `maskable`). |
| `favicon.png` / `apple-touch-icon.png` | Icono de pestaña e icono para iOS. |
| `.nojekyll` | Evita que GitHub procese el sitio con Jekyll (necesario para `.github` y archivos sin extensión). |
| `.github/workflows/deploy-pages.yml` | Despliegue automático en GitHub Pages con GitHub Actions. |

## Despliegue paso a paso

1. **Crea el repositorio** en GitHub (por ejemplo `escuatrocero`) y sube **todo el contenido de esta carpeta** a la rama `main` (con GitHub Desktop, o `git init && git add . && git commit -m "PWA inicial" && git remote add origin ... && git push -u origin main`).
2. **Activa Pages**: en el repositorio → *Settings* → *Pages* → *Build and deployment* → *Source*: **GitHub Actions**. El workflow incluido se ejecuta en cada `push` a `main` (también puedes lanzarlo a mano en la pestaña *Actions* → *Desplegar en GitHub Pages* → *Run workflow*).
3. Tu app quedará en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`. No hace falta ajustar rutas: manifest, service worker e iconos usan **rutas relativas**, así que funcionan igual en la raíz (`usuario.github.io`) o en subcarpeta.

### Alternativa sin Actions
En *Settings* → *Pages* → *Source*: **Deploy from a branch** → `main` / `(root)`. El resultado es el mismo (no hace falta nada más).

## ⚠️ Imprescindible para que el login funcione

Firebase Auth solo acepta inicios de sesión desde dominios autorizados:

1. Abre la [consola de Firebase](https://console.firebase.google.com/) → tu proyecto.
2. *Authentication* → *Settings* → **Authorized domains** → *Add domain*.
3. Añade `TU-USUARIO.github.io` (y tu dominio propio si lo usas).

Además, si usas reglas de seguridad en Realtime Database, permite lectura/escritura en los nodos `normativa`, `exito`, `documentos`, `materiales` (y demás secciones), `tabs`, `tabOrder` y `userPrefs`.

## Uso como PWA

- **Instalación**: con la app abierta en Chrome/Edge aparecerá el icono de instalación en la barra de direcciones (o menú ⋮ → *Instalar EsCuatroCero*). En Android: menú → *Añadir a pantalla de inicio*. En iOS (Safari): Compartir → *Añadir a pantalla de inicio*.
- **Offline**: tras la primera visita, la app abre sin conexión (interfaz completa). Los datos se cargan desde Firebase cuando hay red; sin conexión el acceso a datos no está disponible.
- **Actualizaciones**: al subir un nuevo `index.html`, recarga la app dos veces para que el Service Worker tome la versión nueva. Si cambias recursos cacheados, sube el valor `VERSION` al inicio de `sw.js` (p. ej. `v1.0.1`).

## Desarrollo local

Ejecuta un servidor local en esta carpeta (el Service Worker requiere HTTP en localhost o HTTPS):

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

Abrir `index.html` con doble clic (file://) también funciona; simplemente el registro del Service Worker se omite.
