# CONTEXTO — Phonavi (ex Noticiero Mental)
**Repo:** https://github.com/diegotave/noticieromental  
**Live:** https://diegotave.github.io/noticieromental/  
**Autor:** Diego  
**Stack:** HTML + CSS + JS vanilla, hosteado en GitHub Pages

> **Pendiente:** renombrar repo a `phonavi` cuando quieras — Settings → Repository name.

---

## Descripción general

Sitio experimental / artístico. La home es una pantalla de videocasette con crawl del logo Phonavi y botones superpuestos en grilla 1920×1080 escalada. Desde ahí se navega a un carrusel de CDs (Phonavi CD) y a la radio.

---

## Mapa de navegación

```
index.html  ←→  bitch3d.html  ←→  novaloramos.html  ←→  tuprimomarvin.html  ←→  sunset.html
    ↑________________________________________________________________↓  (circular con flechas)

index.html → PHONAVI_web/phonavicd.html   (botón Phonavi)
index.html → radioantigua.html            (botón Radio)
index.html → [modal Acerca De]            (botón animado)
```

---

## `index.html` — Home

- **Title:** Phonavi
- **Fondo:** blanco
- **Crawl:** logo `phonavi_logo_discoteca.png` × 8, 80px altura, `translateX` 20s infinito
  - ⚠️ Provisorio — Diego lo va a reemplazar por una animación propia
- **Video central:** `VIDEOS/videocasette.webm` — autoplay muted loop
- **Sistema de escala:** stage `position:fixed` 1920×1080, `Math.min(vw/1920, vh/1080)`

### Botones del index

| Botón | Stage ID | Posición (1920×1080) | JS |
|---|---|---|---|
| Phonavi | `#phonavi-stage` | left:1400 top:728, 245×245px | `phonavi-boton.js` |
| Radio | `#radio-stage` | left:1652 top:740, 241×215px | inline |
| Acerca De | `#ui-stage` | left:344 top:171, 63×63px | `boton-acercade.js` |

---

## Páginas de video (patrón compartido)

Todas usan el mismo CSS de flechas (triángulo magenta `#ff00b8`):

| Página | Video | Izq | Der |
|---|---|---|---|
| `bitch3d.html` | `bitch3d.webm` | index | novaloramos |
| `novaloramos.html` | `NOVALORAMOSVERS02.webm` | bitch3d | tuprimomarvin |
| `tuprimomarvin.html` | `tuprimomarvin.webm` | novaloramos | sunset |
| `sunset.html` | `Iambig.webm` | tuprimomarvin | index |

---

## CSS compartido — `boton-acercade.css`

- `#ui-stage` z-index:6 / `#phonavi-stage` z-index:4
- Hit-area configurable: `--hit-x`, `--hit-y`, `--hit-w`, `--hit-h`
- Debug: `--debug-hit-area: 1`

---

## PHONAVI CD — `PHONAVI_web/phonavicd.html`

> Antes: `phonavi.html / .css / .js` → renombrado a `phonavicd.*`

### Archivos
```
PHONAVI_web/
├── phonavicd.html
├── phonavicd.css
├── phonavicd.js
├── mini-player.css
└── IMAGES/REPRODUCTOR_PHONAVI/
    ├── phonavi_logo_discoteca.png
    ├── FRENTECD.png
    └── LOMOCD5.png
```

### Storage — Cloudflare R2
`https://pub-4ad247018d50485fa0850c9164489c59.r2.dev`

```
/CDS/{Artista - Album}/
  ├── cover.jpg
  └── tracks.json
```

### Álbumes actuales

| # | Artista | Álbum |
|---|---|---|
| 0 | Howe Gelb | Future Standards |
| 1 | The Clash | London Calling |
| 2 | Cindy Lauper | She's So Unusual |
| 3 | Lady Gaga | MAYHEM |
| 4 | The Beatles | Abbey Road |
| 5 | Nirvana | Nevermind |

---

## Carrusel — estado actual y pendientes

### Arquitectura DOM
```
#spineRail
  └── .spine-slot (flex:0 0 auto)  × 25 landscape / 7 portrait
        └── .spine-visual (height% animada por JS)
              ├── .spine-cover-img (inset:0, object-fit:cover — cropeada por visual)
              ├── .spine-png (LOMOCD5.png, z-index:1)
              └── .spine-label (texto vertical, visible solo en .is-active)
```

### Comportamiento actual
- **25 lomos** llenan el viewport en landscape (7 en portrait)
- `flex:0 0 auto` → los slots se agrupan al ancho natural del LOMOCD5.png, sin expandirse
- **Hover/touch:** el lomo bajo el cursor/dedo es el activo → crece, vecinos se abren levemente, preview aparece arriba
- **Preselección limitada** a ±11 slots desde el centro del rail
- **Dial giratorio:** RAF siempre corriendo, `albumOffset` avanza por posición X del cursor — 5 zonas simétricas:

```
normX zona        velocidad (álbumes/frame)
0.45–0.55         0.0015   ← centro, casi quieto
0.35–0.45/0.55–0.65  0.004
0.25–0.35/0.65–0.75  0.009
0.15–0.25/0.75–0.85  0.016
0.00–0.15/0.85–1.00  0.026  ← bordes, más rápido
```

- **Preview:** cover cuadrada (180px desktop / 110px portrait) flota sobre el lomo activo con fade

### Tamaños por distancia al activo ⚠️ PENDIENTE AFINAR
```js
dist 0  → 115%   // activo
dist 1  → 110%   // ±1
dist 2  → 105%   // ±2
dist 3+ → 100%   // resto (base)
```
Diego dice que "no termina de estar bien" — hay que seguir ajustando la relación de tamaños

### Gaps por distancia (margins en px)
```
activo ↔ ±1:  3px total  (active: 1.5+1.5, ±1: 1.5 inner + 1.0 outer)
±1    ↔ ±2:  2px total  (±1: 1.0 outer,   ±2: 1.0 inner + 0.5 outer)
resto:        1px total  (0.5 + 0.5 cada slot)
```

### Opacidades por distancia
```
dist 0    → 1.00
dist 1–2  → 0.90
dist 3–4  → 0.80
resto     → 0.55
```

### CSS variables
```css
--spine-height: 58vh
--preview-size: 180px
--logo-h: clamp(16px, 4vw, 52px)
```

### Modo oscuro
- `body.dark` → fondo negro, `.phonavi-logo` + `.spine-png` → `filter: invert(1)`
- Toggle luna/sol en SVG inline, persiste en `localStorage("phonavi-theme")`
- `pointerdown` en el toggle tiene `stopPropagation()` para no activar el drag

---

## Pendientes del carrusel
- [ ] **Afinar tamaños** — el efecto de agrandado sobre la base 100% no está bien aún
- [ ] **Abrir CD** — click en lomo: animación apertura, panel de tracks, reproducción (hook en `onSlotClick()` vacío)
- [ ] Reconectar audio (desconectado del carrusel nuevo)

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

## Estructura de carpetas

```
noticieromental/   (futuro: phonavi/)
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
│   └── AcercaDe_00000.png … AcercaDe_00007.png
├── VIDEOS/
│   ├── videocasette.webm
│   ├── bitch3d.webm
│   ├── NOVALORAMOSVERS02.webm
│   ├── tuprimomarvin.webm
│   └── Iambig.webm
├── assets/IMAGES/BOTONES/
│   ├── BOTONTOPHONAVI.png / BOTONTOPHONAVI2.png
│   └── botonradio_00.png / botonradio_01.png
└── PHONAVI_web/
    ├── phonavicd.html
    ├── phonavicd.css
    ├── phonavicd.js
    ├── mini-player.css
    └── IMAGES/REPRODUCTOR_PHONAVI/
        ├── phonavi_logo_discoteca.png
        ├── FRENTECD.png
        └── LOMOCD5.png
```

---

## Notas técnicas
- GitHub Pages desde `main`, root `/`
- `.glb` files en el repo sin uso activo
- `mini-player.css` importado por `phonavicd.html`
- Botón "Acerca De" en desktop solo anima, no navega a ningún lado
- CSS de flechas duplicado en todas las páginas de video → candidato a refactor

---

## Pendientes globales
- [ ] Afinar tamaños del carrusel
- [ ] Implementar apertura de CD (tracks + audio)
- [ ] Crawl home → animación propia (reemplazar logo estático)
- [ ] Renombrar repo `noticieromental` → `phonavi`

---
*Contexto actualizado: 22/03/2026*
