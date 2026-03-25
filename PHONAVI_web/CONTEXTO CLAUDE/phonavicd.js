// ── CONFIG ────────────────────────────────────────────────────────────────────
const VISIBLE_LANDSCAPE = 25;
const VISIBLE_PORTRAIT  = 7;
const MAX_PRESEL_SIDE   = 11;   // slots selectable each side of center

// Dial speed by zone (5 zones, symmetric)
// normX [0,1] → albums/frame
// zones: |0–0.2| slow-edge, |0.2–0.4| medium, |0.4–0.6| very-slow-center
function dialSpeed(normX) {
  const d = normX - 0.5;          // [-0.5 , 0.5]
  const a = Math.abs(d);
  let mag;
  if      (a < 0.10) mag = 0.0015;   // inner fifth: ultra slow
  else if (a < 0.20) mag = 0.004;    // next band
  else if (a < 0.30) mag = 0.009;    // middle-outer
  else if (a < 0.40) mag = 0.016;    // outer band
  else               mag = 0.026;    // edge fifth
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

// ── HEIGHT by dist from active ─────────────────────────────────────────────
function getHeight(dist){
  if(dist === 0) return 115;
  if(dist === 1) return 110;
  if(dist === 2) return 105;
  return 100;
}

// ── OPACITY by dist ────────────────────────────────────────────────────────
function getOpacity(dist){
  if(dist === 0) return 1.00;
  if(dist <= 2)  return 0.90;
  if(dist <= 4)  return 0.80;
  return 0.55;
}

// ── MARGINS ───────────────────────────────────────────────────────────────────
// Returns [marginLeft, marginRight] in px for slot i given activeSlot.
// Base gap between any two slots = 0.5 + 0.5 = 1px.
// active ↔ ±1 gap: 3px  → active gets 1.5 each side, ±1 gets 1.5 on inner side
// ±1    ↔ ±2 gap: 2px  → ±1 gets 1.0 on outer side,  ±2 gets 1.0 on inner side
// rest:            1px  → 0.5 each
function getMargins(i, active){
  if(active < 0) return [0.5, 0.5];
  const dist = i - active;
  if(dist ===  0) return [1.5, 1.5];
  if(dist ===  1) return [1.5, 1.0];
  if(dist === -1) return [1.0, 1.5];
  if(dist ===  2) return [1.0, 0.5];
  if(dist === -2) return [0.5, 1.0];
  return [0.5, 0.5];
}

// ── BUILD SLOTS ───────────────────────────────────────────────────────────────
function buildSlots(){
  const rail = document.getElementById("spineRail");
  rail.innerHTML = "";
  slots = [];
  const n = getVisible();
  for(let i = 0; i < n; i++){
    const slotEl   = document.createElement("div");
    slotEl.className = "spine-slot";

    const visual   = document.createElement("div");
    visual.className = "spine-visual";

    const coverImg = document.createElement("img");
    coverImg.className = "spine-cover-img";
    coverImg.alt = "";

    const spineImg = document.createElement("img");
    spineImg.className = "spine-png";
    spineImg.alt = "";

    const label    = document.createElement("span");
    label.className = "spine-label";

    visual.appendChild(coverImg);
    visual.appendChild(spineImg);
    visual.appendChild(label);
    slotEl.appendChild(visual);
    rail.appendChild(slotEl);

    slotEl.addEventListener("click", () => onSlotClick(i));
    slots.push({ slotEl, visual, coverImg, spineImg, label });
  }
}

// ── RENDER ────────────────────────────────────────────────────────────────────
function render(){
  const n    = slots.length;
  const base = Math.round(albumOffset);

  for(let i = 0; i < n; i++){
    const { slotEl, visual, coverImg, spineImg, label } = slots[i];

    // album for this slot
    const albumIdx = mod(base + i, albums.length);
    const album    = albums[albumIdx];

    if(coverImg.dataset.src !== album.cover){
      coverImg.src = encodeURI(album.cover);
      coverImg.dataset.src = album.cover;
    }
    if(spineImg.dataset.src !== album.spine){
      spineImg.src = album.spine;
      spineImg.dataset.src = album.spine;
    }

    const dist    = activeSlot >= 0 ? Math.abs(i - activeSlot) : -1;
    const isActive = dist === 0;

    // height & opacity
    visual.style.height  = (dist >= 0 ? getHeight(dist)  : 60)   + "%";
    visual.style.opacity = (dist >= 0 ? getOpacity(dist) : 0.55).toFixed(2);

    // margins
    const [ml, mr] = getMargins(i, activeSlot);
    slotEl.style.marginLeft  = ml + "px";
    slotEl.style.marginRight = mr + "px";

    // active label
    slotEl.classList.toggle("is-active", isActive);
    label.textContent = isActive ? `${album.artist}  —  ${album.title}` : "";
  }

  // preview
  const previewArea  = document.getElementById("previewArea");
  const previewCover = document.getElementById("previewCover");

  if(activeSlot >= 0 && pointerOn){
    const albumIdx = mod(base + activeSlot, albums.length);
    const album    = albums[albumIdx];
    if(previewCover.dataset.src !== album.cover){
      previewCover.src = encodeURI(album.cover);
      previewCover.dataset.src = album.cover;
    }
    const leftPct = ((activeSlot + 0.5) / n * 100).toFixed(2);
    previewArea.style.left = leftPct + "%";
    previewArea.classList.add("visible");
  } else {
    previewArea.classList.remove("visible");
  }
}

// ── RAF DIAL ──────────────────────────────────────────────────────────────────
function tick(){
  albumOffset = mod(albumOffset + dialSpeed(normCursorX), albums.length);
  render();
  rafId = requestAnimationFrame(tick);
}

// ── POINTER ───────────────────────────────────────────────────────────────────
function onPointerMove(e){
  pointerOn   = true;
  normCursorX = clamp(e.clientX / window.innerWidth, 0, 1);

  // which slot is under cursor
  const n     = slots.length;
  const rawSlot = clamp(Math.floor(normCursorX * n), 0, n - 1);

  // limit preselection to MAX_PRESEL_SIDE each side of center
  const center = Math.floor(n / 2);
  const clamped = clamp(rawSlot, center - MAX_PRESEL_SIDE, center + MAX_PRESEL_SIDE);

  activeSlot = clamped;
}

function onPointerLeave(){
  pointerOn   = false;
  normCursorX = 0.5;
  activeSlot  = -1;
}

function onSlotClick(i){
  const base     = Math.round(albumOffset);
  const albumIdx = mod(base + i, albums.length);
  console.log("Selected:", albums[albumIdx].artist, "-", albums[albumIdx].title);
  // open CD — next phase
}

// ── RESIZE ────────────────────────────────────────────────────────────────────
let resizeTimer = null;
function onResize(){
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { buildSlots(); render(); }, 100);
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
  const rail = document.getElementById("spineRail");
  rail.addEventListener("pointermove", onPointerMove);
  rail.addEventListener("pointerleave", onPointerLeave);
  window.addEventListener("resize", onResize);
  rafId = requestAnimationFrame(tick);
}

init();
