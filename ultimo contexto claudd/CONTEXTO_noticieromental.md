# CONTEXTO — Phonavi (ex Noticiero Mental)
**Repo:** https://github.com/diegotave/noticieromental  
**Live:** https://diegotave.github.io/noticieromental/  
**Autor:** Diego  
**Stack:** HTML + CSS + JS vanilla, GitHub Pages

> **Pendiente:** renombrar repo `noticieromental` → `phonavi` en Settings.

---

## Mapa de navegación

```
index.html ←→ bitch3d.html ←→ novaloramos.html ←→ tuprimomarvin.html ←→ sunset.html
    ↑_____________________________________________________________↓  (circular)

index.html → PHONAVI_web/phonavicd.html   (botón Phonavi)
index.html → radioantigua.html            (botón Radio)
index.html → [modal Acerca De]            (botón animado)
```

---

## `index.html` — Home

- **Title:** Phonavi
- **Fondo:** blanco
- **Crawl:** logo `phonavi_logo_discoteca.png` × 8, 80px, translateX 20s infinito — **PROVISORIO**, Diego lo reemplaza por animación propia
- **Video central:** `VIDEOS/videocasette.webm` autoplay muted loop
- **Sistema de escala:** stage fixed 1920×1080, `Math.min(vw/1920, vh/1080)`

### Botones del index

| Botón | Stage ID | Pos (1920×1080) | JS |
|---|---|---|---|
| Phonavi | `#phonavi-stage` | left:1400 top:728, 245×245px | `phonavi-boton.js` |
| Radio | `#radio-stage` | left:1652 top:740, 241×215px | inline |
| Acerca De | `#ui-stage` | left:344 top:171, 63×63px | `boton-acercade.js` |

---

## Páginas de video

| Página | Video | ← | → |
|---|---|---|---|
| `bitch3d.html` | `bitch3d.webm` | index | novaloramos |
| `novaloramos.html` | `NOVALORAMOSVERS02.webm` | bitch3d | tuprimomarvin |
| `tuprimomarvin.html` | `tuprimomarvin.webm` | novaloramos | sunset |
| `sunset.html` | `Iambig.webm` | tuprimomarvin | index |

Todas comparten el mismo CSS de flechas: triángulo magenta `#ff00b8`.

---

## Identidad visual

| | |
|---|---|
| Color principal | `#ff00b8` (magenta) |
| Fondo home | blanco |
| Fondo páginas video | negro |
| Tipografía | `"Helvetica Neue", Helvetica, Arial, sans-serif` |
| Grid base | 1920 × 1080px escalado |

---

## PHONAVI CD — `PHONAVI_web/phonavicd.*`

> Antes se llamaba `phonavi.*` — renombrado a `phonavicd.*`

### Archivos
```
PHONAVI_web/
├── phonavicd.html
├── phonavicd.css
├── phonavicd.js
├── mini-player.css
└── IMAGES/REPRODUCTOR_PHONAVI/
    ├── phonavi_logo_discoteca.png
    ├── CAJACDMINI.png       ← overlay miniatura (PNG con transparencia)
    ├── FRENTECD.png         ← no usado en nuevo carrusel (legacy)
    └── LOMOCD5.png          ← spine de todos los CDs
```

### Storage — Cloudflare R2
`https://pub-4ad247018d50485fa0850c9164489c59.r2.dev`

```
/CDS/{Artista - Album}/
  ├── cover.jpg
  └── tracks.json
```

### Álbumes cargados

| # | Artista | Álbum | Cover path R2 |
|---|---|---|---|
| 0 | Howe Gelb | Future Standards | `/CDS/Howe Gelb - Future Standards/Front.jpg` |
| 1 | The Clash | London Calling | `/CDS/TheClash_London calling/cover.jpg` |
| 2 | Cindy Lauper | She's So Unusual | `/CDS/Cindy Lauper - She/covercindy.jpg` |
| 3 | Lady Gaga | MAYHEM | `/CDS/Lady Gaga - MAYHEM(2025)/cover1.jpg` |
| 4 | The Beatles | Abbey Road | `/CDS/The Beatles - Abbey Road [320-Bubanee]/folder.jpg` |
| 5 | Nirvana | Nevermind | `/CDS/Nirvana-nevermind/covernirvana.jpg` |

---

## Carrusel — estado actual

### Constantes JS

```js
VISIBLE_LANDSCAPE   = 37    // slots visibles landscape
VISIBLE_PORTRAIT    = 37    // ídem portrait
MAX_PRESEL_SIDE     = 12    // slots seleccionables c/lado del centro → zona activa 25 slots
MAX_PRESEL_PORTRAIT = 6
EXTRA               = 2     // buffer slots fuera del container (c/lado)
```

Total slots en DOM = 37 + 2×2 = **41**

### Velocidades del dial (5 zonas simétricas)

```js
normX dist desde 0.5:
< 0.10  →  0.009 álbumes/frame
< 0.20  →  0.030
< 0.30  →  0.066
< 0.40  →  0.135
≥ 0.40  →  0.270
```

Lerp factor 0.06 — aceleración/desaceleración orgánica.

### Alturas por distancia al activo

```js
dist 0  →  98%
dist 1  →  89%
dist 2+ →  85%
```

### Opacidades

Todas en **1.0** — sin reducción por distancia, ni en hover ni en reposo.

### Márgenes (gaps entre lomos)

```js
base (inactivos):     2px c/lado = 4px total
activo ↔ ±1:          6+6 = 12px
±1 ↔ ±2:              3.75+3.75 = 7.5px
resto:                 2+2 = 4px
```

---

## CSS — estado actual

### Variables raíz

```css
--spine-height: 46.5vh;    /* landscape — 62vh × 0.75 */
--preview-size: 140px;
--logo-h: clamp(16px, 4vw, 52px);

/* portrait */
--spine-height: 41.25vh;
--preview-size: 110px;
```

### #spineContainer

```css
border: none;              /* sin borde */
border-radius: 12px;
background: white / #000 (dark);
margin-top: 20vh;          /* bajado 20% en pantalla */
margin-inline: 12px;       /* contraído 12px c/lado */
mask-image: fade lateral 12px c/lado;   /* feather costados */
```

### Miniatura (#previewArea)

- `position: absolute` en `#stage`
- `bottom` fijo, calculado una sola vez en `fixPreviewBottom()` al init y en resize:
  ```js
  bottom = window.innerHeight - container.getBoundingClientRect().top + 12px
  ```
  → 12px = mismo gap que entre lomo activo y sus adyacentes
- Solo `left` se actualiza en el RAF loop (no sube ni baja, solo se desplaza horizontal)
- `transition: left 80ms ease, opacity 200ms ease`

### #previewCoverWrap

```css
border-radius: 2px;
overflow: hidden;
```

### #previewCover (tapa del disco)

```css
position: absolute;
inset: 1px;                /* crop 1px c/lado */
object-fit: cover;
mask-image: fade 1px en los 4 bordes (mask-composite: intersect);
```

### #previewCaja (CAJACDMINI.png)

```css
position: relative;        /* flota z-index:1 sobre el cover */
border-radius: 2px;
width: var(--preview-size);
height: auto;
```

### #previewText

Artista y título del álbum activo, en blanco (dark) / negro (light), Helvetica, sobre el cover wrap.

---

## DOM del preview

```html
<div id="previewArea">
  <div id="previewText">
    <span id="previewArtist"></span>
    <span id="previewTitle"></span>
  </div>
  <div id="previewCoverWrap">
    <img id="previewCover" src="" alt="">
    <img id="previewCaja" src="IMAGES/REPRODUCTOR_PHONAVI/CAJACDMINI.png" alt="">
  </div>
</div>
```

---

## Modo oscuro

- `body.dark` → fondo `#000`, `.phonavi-logo` + `.spine-png` → `filter: invert(1)`
- Toggle luna / sol, SVG inline
- Persiste en `localStorage("phonavi-theme")`

---

## Estructura de carpetas

```
noticieromental/   (futuro: phonavi/)
├── index.html
├── bitch3d.html / novaloramos.html / tuprimomarvin.html / sunset.html
├── radioantigua.html
├── boton-acercade.css / boton-acercade.js / phonavi-boton.js
├── BOTON/  AcercaDe_00000.png … AcercaDe_00007.png
├── VIDEOS/  videocasette.webm / bitch3d.webm / NOVALORAMOSVERS02.webm / tuprimomarvin.webm / Iambig.webm
├── assets/IMAGES/BOTONES/  BOTONTOPHONAVI.png / BOTONTOPHONAVI2.png / botonradio_00.png / botonradio_01.png
└── PHONAVI_web/
    ├── phonavicd.html / phonavicd.css / phonavicd.js
    ├── mini-player.css
    └── IMAGES/REPRODUCTOR_PHONAVI/
        ├── phonavi_logo_discoteca.png
        ├── CAJACDMINI.png
        ├── FRENTECD.png
        └── LOMOCD5.png
```

---

## Pendientes

- [ ] **Abrir CD** — click en lomo: animación apertura, panel de tracks, reproducción audio (`onSlotClick()` preparado pero vacío)
- [ ] Reconectar audio (desconectado del nuevo carrusel)
- [ ] Crawl home → animación propia (reemplazar logo estático)
- [ ] Renombrar repo `noticieromental` → `phonavi`
- [ ] `.glb` files (earth, pantalla_cine) en el repo sin uso activo
- [ ] Verificar que CAJACDMINI.png tenga transparencia en la zona de la tapa para que el cover se vea por debajo

---
*Contexto actualizado: 24/03/2026*
