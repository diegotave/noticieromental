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

## Carrusel — arquitectura actual

### DOM
```
#stage
  ├── .logo-row              ← logo + botón tema
  ├── #previewArea           ← miniatura flotante, z-index:20 (pisa el container)
  │     └── #previewCover
  └── #spineContainer        ← overflow:hidden, borde 2px, radius 12px
        └── #spineRail       ← position:absolute, translateX animado
              └── .spine-slot × (VISIBLE + EXTRA*2)
                    └── .spine-visual
                          ├── .spine-cover-img
                          ├── .spine-png (LOMOCD5)
                          └── .spine-label (texto vertical)
```

### Constantes JS

```js
VISIBLE_LANDSCAPE   = 15    // slots visibles en landscape
VISIBLE_PORTRAIT    = 15    // ídem portrait
MAX_PRESEL_SIDE     = 6     // slots seleccionables c/lado del centro → slots 1–13
MAX_PRESEL_PORTRAIT = 3
EXTRA               = 2     // buffer slots fuera del container (c/lado)
```

Total slots en DOM = 15 + 2×2 = **19**. Los 2 extremos de cada lado son transición invisible.

### Velocidades del dial (5 zonas simétricas)

```js
normX dist desde 0.5:
< 0.10  →  0.009 álbumes/frame   (centro, casi quieto)
< 0.20  →  0.030
< 0.30  →  0.066
< 0.40  →  0.135
≥ 0.40  →  0.270                 (bordes, rápido)
```

La velocidad se interpola con lerp factor 0.06 (`currentSpeed += (target - current) * 0.06`) — aceleración/desaceleración orgánica.

### Selección y previsualización

- El cursor mapea a `visibleIdx` (0..14) usando `getBoundingClientRect()` del container
- Solo `visibleIdx` 1–13 son seleccionables (slots 0 y 14 = transición)
- Al seleccionar: el lomo crece, se abren los gaps, aparece la miniatura encima
- La miniatura (`#previewArea`) tiene `z-index: 20` y `bottom` ajustado para pisar el borde superior del container

### Alturas por distancia al activo

```js
dist 0  →  98%   (activo, +13% sobre base)
dist 1  →  89%   (±1, +4% sobre base)
dist 2+ →  85%   (base)
```

### Opacidades

```js
dist 0  →  1.00
dist 1  →  0.90
dist 2  →  0.85
dist ≤5 →  0.75
resto   →  0.55
sin hover → 0.70
```

### Márgenes (gaps entre lomos)

```js
base (inactivos):     2px c/lado = 4px total
activo ↔ ±1:          6+6 = 12px (central doble)
±1 ↔ ±2:              3.75+3.75 = 7.5px (lateral 1.5×)
resto:                 2+2 = 4px
```

### Ancho del container

Calculado una sola vez al init: `(spineW + 4) * 15 + 23px` (el +23 cubre la expansión máxima de márgenes cuando hay activo). Se resetea en resize.

### Scroll suave (translateX continuo)

```js
// albumOffset es float; base = floor(offset), frac = offset - base
shift = -(EXTRA * slotW) - (frac * slotW)
rail.style.transform = `translateX(${shift}px)`
```

Albums se reasignan a los slots solo cuando `base` cambia (cruce de entero). Los 2 buffer slots absorben el swap fuera del viewport visible → sin saltos.

### Preload

Cuando `base` cambia, se precargan `total + 2` álbumes adelante para que las imágenes ya estén en caché al entrar al viewport.

---

## CSS variables clave

```css
--spine-height: 50.6vh      /* landscape */
--spine-height: 50vh        /* portrait */
--preview-size: 120px       /* landscape */
--preview-size: 110px       /* portrait */
--logo-h: clamp(16px, 4vw, 52px)
```

## Contenedor (#spineContainer)

```css
border: 2px solid #000    /* diurno */
border-color: #fff         /* nocturno */
background: white          /* diurno — igual al body */
background: #000           /* nocturno — igual al body */
border-radius: 12px
```

## Miniatura (#previewCover)

```css
border: 2px solid #000    /* mismos valores que el container */
border-radius: 12px
width/height: 120px
```

---

## Modo oscuro

- `body.dark` → fondo `#000`, `.phonavi-logo` + `.spine-png` → `filter: invert(1)`
- Toggle luna(→ nocturno) / sol(→ diurno), SVG inline
- `stopPropagation()` en `pointerdown` para no activar el carrusel
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

---
*Contexto: 22/03/2026*
