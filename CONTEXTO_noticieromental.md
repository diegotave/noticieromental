# CONTEXTO — Noticiero Mental
**Repo:** https://github.com/diegotave/noticieromental  
**Live:** https://diegotave.github.io/noticieromental/  
**Autor:** Diego  
**Stack:** HTML + CSS + JS vanilla, hosteado en GitHub Pages

---

## Descripción general

Sitio experimental / artístico. La home es una pantalla de videocasette con crawl de texto animado y botones superpuestos sobre una grilla de 1920×1080 escalada. Desde ahí se navega a un carrusel de videos y al reproductor de música Phonavi.

---

## Mapa de navegación

```
index.html  ←→  bitch3d.html  ←→  novaloramos.html  ←→  tuprimomarvin.html  ←→  sunset.html
    ↑_______________________________________________________________↓   (circular con flechas)

index.html → PHONAVI_web/phonavi.html   (botón Phonavi)
index.html → radioantigua.html          (botón Radio)
index.html → [modal Acerca De]          (botón animado)
```

---

## Páginas

### `index.html` — Home
- **Fondo:** blanco
- **Crawl:** texto `NOTICIEROMENTAL` en magenta `#ff00b8`, 200px, `font-weight: 200/700`, animación CSS `translateX` 20s infinito
- **Video central:** `VIDEOS/videocasette.webm` — autoplay, muted, loop
- **Sistema de escala:** todos los botones usan un stage `position:fixed` de 1920×1080 escalado con `Math.min(vw/1920, vh/1080)` → `transform: translate(-50%,-50%) scale()`
- **Flechas de navegación:** izquierda → `sunset.html` / derecha → `bitch3d.html`
- **Scripts:** `boton-acercade.js`, `phonavi-boton.js`, radio inline

#### Botones del index

| Botón | Stage ID | Posición (en 1920×1080) | Archivo JS |
|---|---|---|---|
| Phonavi | `#phonavi-stage` | left:1400px top:728px, 245×245px | `phonavi-boton.js` |
| Radio | `#radio-stage` | left:1652px top:740px, 241×215px | inline en index.html |
| Acerca De | `#ui-stage` | left:344px top:171px, 63×63px | `boton-acercade.js` |

---

### `bitch3d.html`
- Fondo negro, video `VIDEOS/bitch3d.webm` fullscreen (`object-fit: contain`)
- Flechas: izq → `index.html` / der → `novaloramos.html`

### `novaloramos.html`
- Fondo negro, video `VIDEOS/NOVALORAMOSVERS02.webm`
- Flechas: izq → `bitch3d.html` / der → `tuprimomarvin.html`

### `tuprimomarvin.html`
- Fondo negro, video `VIDEOS/tuprimomarvin.webm`
- Flechas: izq → `novaloramos.html` / der → `sunset.html`

### `sunset.html`
- Fondo negro, video `VIDEOS/Iambig.webm`
- Flechas: izq → `tuprimomarvin.html` / der → `index.html`

### `radioantigua.html`
- Página de radio (ver archivo)

---

## Sistema de botones (patrón compartido)

Todos los botones del index siguen el mismo patrón:

```js
// 1. Stage fijo de 1920×1080 escalado
function fitStage() {
  const scale = Math.min(window.innerWidth/1920, window.innerHeight/1080)
  stage.style.transform = `translate(-50%,-50%) scale(${scale})`
}
window.addEventListener("resize", fitStage)

// 2. Imagen de fondo full-stage (object-fit: fill)
// 3. Trigger <a> o <button> con posición absoluta dentro del stage
// 4. Hover swap de imagen (idle → hover)
```

### `boton-acercade.js` — animación por frames
- 8 frames: `BOTON/AcercaDe_00000.png` … `AcercaDe_00007.png`
- Frame delay: 40ms
- `mouseenter` → anima hacia frame 7 / `mouseleave` → anima hacia frame 0
- Touch: toggle on click

### `phonavi-boton.js` — hover swap simple
- idle: `assets/IMAGES/BOTONES/BOTONTOPHONAVI.png`
- hover: `assets/IMAGES/BOTONES/BOTONTOPHONAVI2.png`

### Botón Radio — inline en `index.html`
- idle: `assets/IMAGES/BOTONES/botonradio_00.png`
- hover: `assets/IMAGES/BOTONES/botonradio_01.png`

---

## CSS compartido — `boton-acercade.css`

Contiene estilos para:
- `#ui-stage` (Acerca De) — z-index: 6
- `#phonavi-stage` — z-index: 4
- Trigger hit-area configurable con CSS variables: `--hit-x`, `--hit-y`, `--hit-w`, `--hit-h`
- Debug mode opcional: `--debug-hit-area: 1` muestra el área de click con borde magenta

---

## Flechas de navegación (patrón compartido en todas las páginas)

```css
.arrow { position:absolute; top:50%; z-index:5; width:120px; height:120px; }
.arrow::before { border-left: 48px solid #ff00b8; /* triángulo magenta */ }
.left::before { transform: rotate(180deg); }
/* hover: scale(1.08) */
```

---

## PHONAVI — `PHONAVI_web/phonavi.html`

Reproductor de CDs estilo carrusel físico.

### Archivos
```
PHONAVI_web/
├── phonavi.html
├── phonavi.css
├── phonavi.js
├── mini-player.css          ← (referenciado en HTML, no disponible localmente)
└── IMAGES/REPRODUCTOR_PHONAVI/
    ├── phonavi_logo_discoteca.png
    ├── FRENTECD.png          ← overlay transparente del frente del CD
    └── LOMOCD5.png           ← spine/lomo de los CDs laterales
```

### Storage de audio/imágenes
**Cloudflare R2:** `https://pub-4ad247018d50485fa0850c9164489c59.r2.dev`

Estructura por álbum en R2:
```
/CDS/{Artista - Album}/
  ├── cover.jpg (o nombre variado)
  └── tracks.json
```

### Álbumes cargados (en `phonavi.js`)

| # | Artista | Álbum | Directorio R2 |
|---|---|---|---|
| 0 | Howe Gelb | Future Standards | `/CDS/Howe Gelb - Future Standards/` |
| 1 | The Clash | London Calling | `/CDS/TheClash_London calling/` |
| 2 | Cindy Lauper | She's So Unusual | `/CDS/Cindy Lauper - She/` |
| 3 | Lady Gaga | MAYHEM | `/CDS/Lady Gaga - MAYHEM(2025)/` |
| 4 | The Beatles | Abbey Road | `/CDS/The Beatles - Abbey Road [320-Bubanee]/` |
| 5 | Nirvana | Nevermind | `/CDS/Nirvana-nevermind/` |

### Formato de `tracks.json`
```json
[
  { "title": "Nombre del track", "url": "https://...r2.dev/.../track.mp3" },
  "Track sin URL (solo nombre)"
]
```

### Funcionalidad principal
- **Carrusel horizontal** con drag (pointer events) y swipe táctil
- **Threshold de cambio:** 90px de drag activa el cambio de álbum
- **Lomos laterales:** 8 por lado, con opacidad y saturación degradando con la distancia
- **Elasticidad visual:** los lomos se expanden/contraen al hacer drag
- **Animación de cover:** slide horizontal entre covers al cambiar álbum
- **Panel de tracks:** se abre/cierra con click en el centro del disco (botón play/pause)
- **Reproducción de audio:** `new Audio()`, auto-avanza al siguiente track
- **Teclado:** ← → cambian álbum, Space play/pause, Enter abre tracks, Escape cierra
- **Escala automática:** `updateStageScale()` ajusta todo al viewport

### CSS variables clave (phonavi.css)
```css
--disc-size: 460px  /* tamaño del CD central (380px en <1400px) */
--elastic: 0        /* 0–1, controla animaciones elásticas */
--drag-x: 0px       /* offset horizontal durante drag */
--scale: 1          /* escala general del stage */
--offset-y: 0px     /* desplazamiento vertical cuando tracks están abiertos */
```

---

## Identidad visual

| Elemento | Valor |
|---|---|
| Color principal | `#ff00b8` (magenta) |
| Fondo home | blanco |
| Fondo páginas video | negro |
| Tipografía | `"Helvetica Neue", Helvetica, Arial, sans-serif` |
| Grid base | 1920 × 1080px escalado |

---

## Estructura de carpetas del repo

```
noticieromental/
├── index.html
├── bitch3d.html
├── novaloramos.html
├── tuprimomarvin.html
├── sunset.html
├── radioantigua.html
├── boton-acercade.css
├── boton-acercade.js
├── phonavi-boton.js
├── BOTON/
│   └── AcercaDe_00000.png … AcercaDe_00007.png   (8 frames)
├── VIDEOS/
│   ├── videocasette.webm
│   ├── bitch3d.webm
│   ├── NOVALORAMOSVERS02.webm
│   ├── tuprimomarvin.webm
│   └── Iambig.webm
├── assets/
│   └── IMAGES/BOTONES/
│       ├── BOTONTOPHONAVI.png
│       ├── BOTONTOPHONAVI2.png
│       ├── botonradio_00.png
│       └── botonradio_01.png
└── PHONAVI_web/
    ├── phonavi.html
    ├── phonavi.css
    ├── phonavi.js
    ├── mini-player.css
    └── IMAGES/REPRODUCTOR_PHONAVI/
        ├── phonavi_logo_discoteca.png
        ├── FRENTECD.png
        └── LOMOCD5.png
```

---

## Notas técnicas importantes

- **GitHub Pages** sirve desde `main` branch, root `/`
- Los archivos `.glb` (earth plateada, pantalla_cine) existen en el repo pero no están referenciados en las páginas actuales
- `mini-player.css` es importado por `phonavi.html` pero no fue subido al contexto — puede contener estilos del mini player de audio
- El botón "Acerca De" actualmente solo tiene animación hover; el `click` en desktop no navega a ningún lado (en touch hace toggle de la animación)
- Todas las páginas de video usan el mismo patrón CSS de flechas — candidato a refactor en archivo compartido

---

*Contexto generado el 21/03/2026*
