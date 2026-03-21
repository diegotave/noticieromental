# Proyecto: Noticieromental

## Descripción
Web personal hosteada en GitHub Pages.
Usuario: principiante aprendiendo desarrollo web.

## URL
https://diegotave.github.io/noticieromental/

## Estructura general de carpetas
```
noticieromental/
├── BOTON/                          # Botón arcade (proyecto separado)
│   ├── boton-acercade.js
│   ├── phonavi-boton.js
│   └── boton-acarcade.css
├── VIDEOS/
│   └── index.html
├── assets/
│   ├── VIDEOS/radioantigua/
│   └── IMAGES/
│       ├── radioantigua/
│       ├── BOTONES/
│       └── formavideo.png
├── radioantigua.html
└── PHONAVI_web/                    # Reproductor de música (foco actual)
    ├── index.html
    ├── phonavi.js
    ├── phonavi.css
    ├── IMAGES/
    │   └── REPRODUCTOR_PHONAVI/
    │       ├── FRENTECD.png
    │       ├── LOMOCD5.png
    │       └── phonavi_logo_discoteca.png
    └── CDS/
        ├── Howe Gelb - Future Standards/
        │   ├── Front.jpg
        │   └── tracks.json
        ├── TheClash_London calling/
        │   ├── cover.jpg
        │   └── tracks.json
        ├── Cindy Lauper - She/
        │   ├── covercindy.jpg
        │   └── tracks.json
        ├── Lady Gaga - MAYHEM(2025)/      ← ÚNICO ALBUM CON MP3 POR AHORA
        │   ├── cover1.jpg
        │   ├── tracks.json                ← ya configurado con URLs relativas
        │   └── 01-14 *.mp3               ← 14 temas descargados
        └── Nirvana-nevermind/
            ├── covernirvana.jpg
            └── tracks.json
```

## Reproductor PHONAVI
- Carrusel de discos con animación, drag, lomos laterales
- Al hacer click en el disco se abre la lista de temas
- Mini player flotante en la parte de abajo (play/pausa, anterior/siguiente, barra de progreso)
- Archivos principales: `phonavi.js`, `phonavi.css`
- CSS del mini player: `mini-player.css` (agregar al final de phonavi.css o linkearlo en el HTML)

## Estado actual del audio
- ✅ Lady Gaga - MAYHEM: 14 MP3 descargados, tracks.json configurado, funcionando en GitHub Pages
- Los demás albums tienen tracks.json sin URLs (solo títulos, sin audio aún)
- Los MP3 se sirven con rutas relativas desde el mismo repo

## Diseño del reproductor (estado actual)
- Click en el disco → abre lista de temas debajo (sin caja, tipografía pura)
- Click en un tema → play directo, ▶ aparece al final de la línea
- Click de nuevo → pausa, cambia a ⏸
- Al terminar un tema → pasa automáticamente al siguiente
- Sin mini player flotante
- Sin título del album en la lista (ya está visible arriba en el meta)

## Plan de migración de audio
1. ✅ MP3 de Gaga en GitHub Pages — funciona
2. 🔜 Cuando haya más albums, migrar MP3 a Cloudflare R2 (10GB gratis, sin CORS)
3. 🔜 Actualizar las URLs en cada tracks.json apuntando a R2

## Formato de tracks.json (con audio)
```json
[
  { "title": "Nombre del tema", "url": "CDS/Carpeta Album/01. Tema.mp3" }
]
```

## Formato de tracks.json (sin audio, solo lista)
```json
[
  { "title": "Nombre del tema" }
]
```

## Notas técnicas
- GitHub Pages sirve archivos estáticos sin CORS → los MP3 relativos funcionan
- Google Drive no funciona para audio (bloquea CORS)
- Límite de GitHub: 100MB por archivo (los MP3 de Gaga son livianos, entran bien)
- Claude no puede fetchear github.io ni github.com directamente
  → Para compartir archivos: subirlos directo al chat o copiar el contenido
