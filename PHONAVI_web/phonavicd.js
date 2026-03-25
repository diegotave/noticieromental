// ── CONFIG ────────────────────────────────────────────────────────────────────
const VISIBLE_LANDSCAPE   = 37;
const VISIBLE_PORTRAIT    = 37;
const MAX_PRESEL_SIDE     = 12;
const MAX_PRESEL_PORTRAIT = 6;
const EXTRA               = 2;

// Dial speed — cursor position drives 5 zones, edge zones notably faster
function dialSpeed(normX) {
  const d = normX - 0.5;
  const a = Math.abs(d);
  let mag;
  if      (a < 0.10) mag = 0.009;
  else if (a < 0.20) mag = 0.030;
  else if (a < 0.30) mag = 0.066;
  else if (a < 0.40) mag = 0.135;
  else               mag = 0.270;
  return Math.sign(d) * mag;
}

// ── ALBUMS ────────────────────────────────────────────────────────────────────
const R2 = "https://pub-4ad247018d50485fa0850c9164489c59.r2.dev";
const albums = [
  { artist:"Howe Gelb",    title:"Future Standards", cover:R2+"/CDS/Howe Gelb - Future Standards/Front.jpg",             spine:"IMAGES/REPRODUCTOR_PHONAVI/LOMOCD5.png", tracksFile:R2+"/CDS/Howe Gelb - Future Standards/tracks.json" },
  { artist:"The Clash",    title:"London Calling",   cover:R2+"/CDS/TheClash_London calling/cover.jpg",                  spine:"IMAGES/REPRODUCTOR_PHONAVI/LOMOCD5.png", tracksFile:R2+"/CDS/TheClash_London calling/tracks.json" },
  { artist:"Cindy Lauper", title:"She's So Unusual", cover:R2+"/CDS/Cindy Lauper - She/covercindy.jpg",                  spine:"IMAGES/REPRODUCTOR_PHONAVI/LOMOCD5.png", tracksFile:R2+"/CDS/Cindy Lauper - She/tracks.json" },
  { artist:"Lady Gaga",    title:"MAYHEM",            cover:R2+"/CDS/Lady Gaga - MAYHEM(2025)/cover1.jpg",                spine:"IMAGES/REPRODUCTOR_PHONAVI/LOMOCD5.png", tracksFile:R2+"/CDS/Lady Gaga - MAYHEM(2025)/tracks.json" },
  { artist:"The Beatles",  title:"Abbey Road",        cover:R2+"/CDS/The Beatles - Abbey Road [320-Bubanee]/folder.jpg", spine:"IMAGES/REPRODUCTOR_PHONAVI/LOMOCD5.png", tracksFile:R2+"/CDS/The Beatles - Abbey Road [320-Bubanee]/tracks.json" },
  { artist:"Nirvana",      title:"Nevermind",         cover:R2+"/CDS/Nirvana-nevermind/covernirvana.jpg",                spine:"IMAGES/REPRODUCTOR_PHONAVI/LOMOCD5.png", tracksFile:R2+"/CDS/Nirvana-nevermind/tracks.json" },
];

// ── STATE ─────────────────────────────────────────────────────────────────────
let albumOffset = 0;    // float — album index at slot 0
let activeSlot  = -1;   // slot under cursor (-1 = none)
let normCursorX = 0.5;
let pointerOn   = false;
let rafId       = null;
let slots       = [];

function mod(n,m){ return ((n%m)+m)%m; }
function clamp(v,lo,hi){ return Math.max(lo,Math.min(hi,v)); }
function isPortrait(){ return window.innerWidth < window.innerHeight || window.innerWidth < 600; }
function getVisible(){ return isPortrait() ? VISIBLE_PORTRAIT : VISIBLE_LANDSCAPE; }

const rail = document.getElementById("spineRail");

// ── HEIGHT by dist from active ─────────────────────────────────────────────
// Inactive base = 85%. Active grows +10% over base = ~98%, ±1 +5% = ~89%
function getHeight(dist){
  if(dist === 0) return 98;
  if(dist === 1) return 89;
  return 85;
}

// ── OPACITY by dist ────────────────────────────────────────────────────────
function getOpacity(dist){
  return 1.00;
}

// ── MARGINS ───────────────────────────────────────────────────────────────────
// Base: 2px each side = 4px between inactives
// active ↔ ±1: was 6px → doubled = 12px  (active 6+6, ±1 inner 6)
// ±1    ↔ ±2: was 5px → ×1.5   = 7.5px  (±1 outer 3.75, ±2 inner 3.75)
// rest: 4px
function getMargins(i, active){
  if(active < 0) return [2, 2];
  const dist = i - active;
  if(dist ===  0) return [6,    6   ];
  if(dist ===  1) return [6,    3.75];
  if(dist === -1) return [3.75, 6   ];
  if(dist ===  2) return [3.75, 2   ];
  if(dist === -2) return [2,    3.75];
  return [2, 2];
}

// ── BUILD SLOTS ───────────────────────────────────────────────────────────────
function buildSlots(){
  rail.innerHTML = "";
  slots = [];
  const visible = getVisible();
  const total   = visible + EXTRA * 2;   // extra slots on each side

  for(let i = 0; i < total; i++){
    const slotEl = document.createElement("div");
    slotEl.className = "spine-slot";

    const visual = document.createElement("div");
    visual.className = "spine-visual";

    const coverImg = document.createElement("img");
    coverImg.className = "spine-cover-img";
    coverImg.alt = "";

    const spineImg = document.createElement("img");
    spineImg.className = "spine-png";
    spineImg.alt = "";

    const label = document.createElement("span");
    label.className = "spine-label";

    visual.appendChild(coverImg);
    visual.appendChild(spineImg);
    visual.appendChild(label);
    slotEl.appendChild(visual);
    rail.appendChild(slotEl);

    // visible slot index (EXTRA..EXTRA+visible-1), buffer slots have visibleIdx = -1
    const visibleIdx = i - EXTRA;
    slotEl.addEventListener("click", () => { if(visibleIdx >= 0) onSlotClick(visibleIdx); });
    slots.push({ slotEl, visual, coverImg, spineImg, label, visibleIdx });
  }
}

// ── RENDER ────────────────────────────────────────────────────────────────────
let lastBase     = -1;
let targetSpeed  = 0;
let currentSpeed = 0;

function render(){
  const visible = getVisible();
  const total   = slots.length;   // visible + EXTRA*2
  const base    = Math.floor(albumOffset);
  const frac    = albumOffset - base;

  // albums: slot i shows album at (base - EXTRA + i)
  if(base !== lastBase){
    lastBase = base;
    for(let i = 0; i < total + 2; i++){
      const a = albums[mod(base - EXTRA + i, albums.length)];
      if(!a._preloaded){
        const img = new Image(); img.src = encodeURI(a.cover);
        a._preloaded = true;
      }
    }
    for(let i = 0; i < total; i++){
      const { coverImg, spineImg } = slots[i];
      const album = albums[mod(base - EXTRA + i, albums.length)];
      if(coverImg.dataset.src !== album.cover){
        coverImg.src = encodeURI(album.cover);
        coverImg.dataset.src = album.cover;
      }
      if(spineImg.dataset.src !== album.spine){
        spineImg.src = album.spine;
        spineImg.dataset.src = album.spine;
      }
    }
  }

  // Measure actual spine visual width (LOMOCD5 natural width)
  const refVisual = slots[EXTRA]?.visual;
  const spineW    = refVisual ? refVisual.offsetWidth : 0;

  if(spineW > 0){
    const container = rail.parentElement;
    if(!container.dataset.widthLocked){
      // Max width = all slots at base margin (2+2=4px) + active open margins
      // active adds extra: 6+6=12 on active, 6+3.75 on ±1, 3.75+2 on ±2
      // Extra over base: (12-4) + 2*(6+3.75-4) + 2*(3.75+2-4) = 8 + 11.5 + 3.5 = 23px
      const baseW  = (spineW + 4) * visible;   // all slots at 4px gap
      const maxW   = baseW + 23;               // add max margin expansion
      container.style.width = maxW + "px";
      container.dataset.widthLocked = "1";
    }
    const slotW = spineW + 4;
    const shift = -(EXTRA * slotW) - (frac * slotW);
    rail.style.transform = `translateX(${shift.toFixed(2)}px)`;
  }

  // activeSlot is a visibleIdx (0..visible-1)
  // maps to total slot index: totalIdx = activeSlot + EXTRA
  for(let i = 0; i < total; i++){
    const { slotEl, visual, label, visibleIdx } = slots[i];
    const dist     = (activeSlot >= 0 && visibleIdx >= 0)
                       ? Math.abs(visibleIdx - activeSlot) : -1;
    const isActive = dist === 0;

    visual.style.height  = (dist >= 0 ? getHeight(dist) : 85) + "%";
    visual.style.opacity = "1";

    const [ml, mr] = (activeSlot >= 0 && visibleIdx >= 0)
                       ? getMargins(visibleIdx, activeSlot) : [2, 2];
    slotEl.style.marginLeft  = ml + "px";
    slotEl.style.marginRight = mr + "px";

    slotEl.classList.toggle("is-active", isActive);
    const album = albums[mod(base - EXTRA + i, albums.length)];
    label.textContent = isActive ? `${album.artist}  —  ${album.title}` : "";
  }

  // Preview
  const previewArea   = document.getElementById("previewArea");
  const previewCover  = document.getElementById("previewCover");
  const previewArtist = document.getElementById("previewArtist");
  const previewTitle  = document.getElementById("previewTitle");
  const previewWrap   = document.getElementById("previewCoverWrap");

  if(activeSlot >= 0 && pointerOn){
    const totalIdx = activeSlot + EXTRA;
    const album    = albums[mod(base - EXTRA + totalIdx, albums.length)];
    if(previewCover.dataset.src !== album.cover){
      previewCover.src = encodeURI(album.cover);
      previewCover.dataset.src = album.cover;
    }
    previewArtist.textContent = album.artist;
    previewTitle.textContent  = album.title;
    const activeVisual = slots[totalIdx]?.visual;
    if(activeVisual){
      const rect = activeVisual.getBoundingClientRect();
      previewArea.style.left = (rect.left + rect.width / 2) + "px";
    }
    previewArea.classList.add("visible");
  } else {
    previewArea.classList.remove("visible");
  }
}

// ── RAF DIAL — eased speed for organic feel ───────────────────────────────────
function tick(){
  targetSpeed  = dialSpeed(normCursorX);
  // ease current speed toward target (lerp factor 0.06 = smooth lag)
  currentSpeed += (targetSpeed - currentSpeed) * 0.06;
  albumOffset   = mod(albumOffset + currentSpeed, albums.length);
  render();
  rafId = requestAnimationFrame(tick);
}

// ── POINTER ───────────────────────────────────────────────────────────────────
function onPointerMove(e){
  pointerOn   = true;
  normCursorX = clamp(e.clientX / window.innerWidth, 0, 1);

  const visible = getVisible();
  const maxSide = isPortrait() ? MAX_PRESEL_PORTRAIT : MAX_PRESEL_SIDE;
  const container = rail.parentElement;
  const rect    = container.getBoundingClientRect();
  const relX    = e.clientX - rect.left;
  const normInContainer = clamp(relX / rect.width, 0, 1);

  // map to visible slot index
  const rawSlot  = clamp(Math.floor(normInContainer * visible), 0, visible - 1);
  const center   = Math.floor(visible / 2);
  const inZone   = Math.abs(rawSlot - center) <= maxSide;

  activeSlot = inZone ? clamp(rawSlot, center - maxSide, center + maxSide) : -1;
}

function onPointerLeave(){
  pointerOn   = false;
  normCursorX = 0.5;
  activeSlot  = -1;
}

function onSlotClick(visibleIdx){
  const base     = Math.floor(albumOffset);
  const albumIdx = mod(base - EXTRA + visibleIdx + EXTRA, albums.length);
  console.log("Selected:", albums[albumIdx].artist, "-", albums[albumIdx].title);
  // open CD — next phase
}

// ── RESIZE ────────────────────────────────────────────────────────────────────
let resizeTimer = null;
function onResize(){
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const container = rail.parentElement;
    delete container.dataset.widthLocked;
    buildSlots();
    fixPreviewBottom();
    render();
  }, 100);
}

// ── PREVIEW BOTTOM — fijo, solo se recalcula en resize ────────────────────────
// Se ancla al tope del container + 12px de gap (mismo gap que entre lomos adyacentes)
function fixPreviewBottom(){
  const container   = rail.parentElement;
  const rect        = container.getBoundingClientRect();
  const previewArea = document.getElementById("previewArea");
  previewArea.style.bottom = (window.innerHeight - rect.top + 12) + "px";
}

// ── THEME ─────────────────────────────────────────────────────────────────────
const themeToggle = document.getElementById("themeToggle");
const moonSVG = `<svg viewBox="0 0 10 10" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 6.5A4 4 0 0 1 3.5 1.2a.3.3 0 0 0-.4-.35A4.5 4.5 0 1 0 9.15 6.9a.3.3 0 0 0-.35-.4 4 4 0 0 1-1.3.0z"/></svg>`;
const sunSVG  = `<svg viewBox="0 0 10 10" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="5" r="1.8"/><line x1="5" y1="0.4" x2="5" y2="1.8" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/><line x1="5" y1="8.2" x2="5" y2="9.6" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/><line x1="0.4" y1="5" x2="1.8" y2="5" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/><line x1="8.2" y1="5" x2="9.6" y2="5" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/><line x1="1.7" y1="1.7" x2="2.7" y2="2.7" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/><line x1="7.3" y1="7.3" x2="8.3" y2="8.3" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/><line x1="8.3" y1="1.7" x2="7.3" y2="2.7" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/><line x1="2.7" y1="7.3" x2="1.7" y2="8.3" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/></svg>`;

function applyTheme(dark){
  document.body.classList.toggle("dark", dark);
  themeToggle.innerHTML = dark ? sunSVG : moonSVG;
  try{ localStorage.setItem("phonavi-theme", dark?"dark":"light"); }catch(e){}
}
themeToggle.addEventListener("pointerdown", e => e.stopPropagation());
themeToggle.addEventListener("click", e => { e.stopPropagation(); applyTheme(!document.body.classList.contains("dark")); });
const savedTheme = (()=>{ try{ return localStorage.getItem("phonavi-theme"); }catch(e){ return null; } })();
applyTheme(savedTheme === "dark");

// ── INIT ──────────────────────────────────────────────────────────────────────
function init(){
  buildSlots();
  render();
  // Esperar un frame para que el container tenga su posición final
  requestAnimationFrame(() => fixPreviewBottom());
  rail.addEventListener("pointermove", onPointerMove);
  rail.addEventListener("pointerleave", onPointerLeave);
  window.addEventListener("resize", onResize);
  rafId = requestAnimationFrame(tick);
}

init();