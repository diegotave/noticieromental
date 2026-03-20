const stage = document.getElementById("stage");
const leftSpines = document.getElementById("leftSpines");
const rightSpines = document.getElementById("rightSpines");
const frontDisc = document.getElementById("frontDisc");
const centerColumn = document.getElementById("centerColumn");
const discOpenHotspot = document.getElementById("discOpenHotspot");

const frontCoverA = document.getElementById("frontCoverA");
const frontCoverB = document.getElementById("frontCoverB");

const albumMeta = document.getElementById("albumMeta");
const metaArtistCurrent = document.getElementById("metaArtistCurrent");
const metaTitleCurrent = document.getElementById("metaTitleCurrent");
const metaArtistNext = document.getElementById("metaArtistNext");
const metaTitleNext = document.getElementById("metaTitleNext");

let trackPanel = document.getElementById("trackPanel");
let trackPanelTitle = document.getElementById("trackPanelTitle");
let trackList = document.getElementById("trackList");

const albums = [
  {
    artist: "Howe Gelb",
    title: "disc_name",
    cover: "CDS/Howe_Gelb-disc_name/Front.jpg",
    spine: "IMAGES/REPRODUCTOR_PHONAVI/LOMOCD5.png"
  },
  {
    artist: "The Clash",
    title: "London Calling",
    cover: "CDS/TheClash_London calling/cover.jpg",
    spine: "IMAGES/REPRODUCTOR_PHONAVI/LOMOCD5.png"
  },
  {
    artist: "Cindy Lauper",
    title: "She",
    cover: "CDS/Cindy Lauper - She/covercindy.jpg",
    spine: "IMAGES/REPRODUCTOR_PHONAVI/LOMOCD5.png"
  },
  {
    artist: "Lady Gaga",
    title: "MAYHEM",
    cover: "CDS/Lady Gaga - MAYHEM(2025)/cover1.jpg",
    spine: "IMAGES/REPRODUCTOR_PHONAVI/LOMOCD5.png",
    tracksFile: "CDS/Lady Gaga - MAYHEM(2025)/tracks.json"
  },
  {
    artist: "Nirvana",
    title: "Nevermind",
    cover: "CDS/Nirvana-nevermind/covernirvana.jpg",
    spine: "IMAGES/REPRODUCTOR_PHONAVI/LOMOCD5.png"
  }
];

if (!albums.length) {
  throw new Error("No hay albums cargados en phonavi.js");
}

let currentIndex = 0;
let currentFront = "A";
let isAnimating = false;

let dragStartX = 0;
let dragCurrentX = 0;
let dragDeltaX = 0;
let isDragging = false;
let dragLocked = false;
let activePointerId = null;

let tracksOpen = false;

const DRAG_THRESHOLD = 90;
const MAX_ELASTIC_PX = 120;
const SPINES_PER_SIDE = 6;

function mod(n, m) {
  return ((n % m) + m) % m;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getAlbum(index) {
  return albums[mod(index, albums.length)];
}

function isLadyGagaAlbum(album) {
  return album && album.artist === "Lady Gaga";
}

function ensureTrackPanel() {
  if (trackPanel && trackPanelTitle && trackList) return;

  trackPanel = document.createElement("div");
  trackPanel.id = "trackPanel";
  trackPanel.className = "track-panel";

  const inner = document.createElement("div");
  inner.className = "track-panel-inner";

  trackPanelTitle = document.createElement("div");
  trackPanelTitle.id = "trackPanelTitle";
  trackPanelTitle.className = "track-panel-title";
  trackPanelTitle.textContent = "Tracks";

  trackList = document.createElement("ul");
  trackList.id = "trackList";
  trackList.className = "track-list";

  inner.appendChild(trackPanelTitle);
  inner.appendChild(trackList);
  trackPanel.appendChild(inner);
  centerColumn.appendChild(trackPanel);
}

function setMetaInstant(album) {
  metaArtistCurrent.textContent = album.artist || "";
  metaTitleCurrent.textContent = album.title || "";
  metaArtistNext.textContent = "";
  metaTitleNext.textContent = "";
  albumMeta.classList.remove("switching");
}

function switchMeta(album) {
  metaArtistNext.textContent = album.artist || "";
  metaTitleNext.textContent = album.title || "";

  albumMeta.classList.remove("switching");
  void albumMeta.offsetWidth;
  albumMeta.classList.add("switching");

  window.setTimeout(() => {
    metaArtistCurrent.textContent = album.artist || "";
    metaTitleCurrent.textContent = album.title || "";
    albumMeta.classList.remove("switching");
  }, 190);
}

function setFrontCoverInstant(album) {
  frontCoverA.src = album.cover;
  frontCoverB.src = album.cover;
  frontCoverA.style.transform = "translateX(0)";
  frontCoverB.style.transform = "translateX(100%)";
  currentFront = "A";
}

function animateFrontCover(nextAlbum, direction) {
  if (isAnimating) return;
  isAnimating = true;

  const visible = currentFront === "A" ? frontCoverA : frontCoverB;
  const hidden = currentFront === "A" ? frontCoverB : frontCoverA;

  hidden.src = nextAlbum.cover;

  const fromX = direction > 0 ? "100%" : "-100%";
  const toX = direction > 0 ? "-100%" : "100%";

  visible.style.transition = "none";
  hidden.style.transition = "none";

  visible.style.transform = "translateX(0)";
  hidden.style.transform = `translateX(${fromX})`;

  void hidden.offsetWidth;

  const easing = "420ms cubic-bezier(0.22,1,0.36,1)";
  visible.style.transition = `transform ${easing}`;
  hidden.style.transition = `transform ${easing}`;

  visible.style.transform = `translateX(${toX})`;
  hidden.style.transform = "translateX(0)";

  window.setTimeout(() => {
    visible.style.transition = "none";
    hidden.style.transition = "none";
    visible.style.transform = direction > 0 ? "translateX(100%)" : "translateX(-100%)";
    hidden.style.transform = "translateX(0)";
    currentFront = currentFront === "A" ? "B" : "A";
    isAnimating = false;
  }, 430);
}

function makeSpine(album, side, distanceFromCenter) {
  const wrap = document.createElement("div");
  wrap.className = "spine-wrap";

  const cover = document.createElement("img");
  cover.className = "spine-cover";
  cover.src = album.cover;
  cover.alt = "";

  const spinePng = document.createElement("img");
  spinePng.className = "spinepng";
  spinePng.src = album.spine;
  spinePng.alt = "";

  if (distanceFromCenter === 0) {
    wrap.classList.add("op100", "sat80");
  } else if (distanceFromCenter === 1) {
    wrap.classList.add("op80", "sat60");
  } else {
    wrap.classList.add("op60", "sat40");
  }

  const shiftBase = distanceFromCenter * 2;
  wrap.style.setProperty(
    "--spine-shift",
    `${side === "left" ? shiftBase : -shiftBase}px`
  );

  wrap.appendChild(cover);
  wrap.appendChild(spinePng);

  return wrap;
}

function renderSpines() {
  leftSpines.innerHTML = "";
  rightSpines.innerHTML = "";

  for (let i = SPINES_PER_SIDE; i >= 1; i--) {
    const album = getAlbum(currentIndex - i);
    const distanceFromCenter = SPINES_PER_SIDE - i;
    leftSpines.appendChild(makeSpine(album, "left", distanceFromCenter));
  }

  for (let i = 1; i <= SPINES_PER_SIDE; i++) {
    const album = getAlbum(currentIndex + i);
    const distanceFromCenter = i - 1;
    rightSpines.appendChild(makeSpine(album, "right", distanceFromCenter));
  }
}

function setElasticFromDrag(deltaX) {
  const abs = Math.abs(deltaX);
  const elastic = clamp(abs / MAX_ELASTIC_PX, 0, 1);
  stage.style.setProperty("--elastic", elastic.toFixed(3));

  const moveX = clamp(deltaX * 0.18, -42, 42);
  stage.style.transform = `translateX(${moveX}px)`;
}

function clearElastic() {
  stage.style.setProperty("--elastic", "0");
  stage.style.transition = "transform 340ms cubic-bezier(0.22,1,0.36,1)";
  stage.style.transform = "translateX(0)";
  window.setTimeout(() => {
    stage.style.transition = "";
  }, 360);
}

function setTrackListLoading() {
  trackList.innerHTML = `<li class="loading">Cargando temas…</li>`;
}

function setTrackListError() {
  trackList.innerHTML = `<li class="error">No pude leer la lista de temas.</li>`;
}

function setTrackListEmpty() {
  trackList.innerHTML = `<li class="empty">No hay temas cargados.</li>`;
}

function renderTrackList(tracks) {
  trackList.innerHTML = "";

  if (!Array.isArray(tracks) || !tracks.length) {
    setTrackListEmpty();
    return;
  }

  tracks.forEach((track, index) => {
    const li = document.createElement("li");
    const label = typeof track === "string"
      ? track
      : (track.title || track.name || `Track ${index + 1}`);
    li.textContent = `${index + 1}. ${label}`;
    trackList.appendChild(li);
  });
}

async function loadAlbumTracks(album) {
  if (Array.isArray(album.tracks) && album.tracks.length) {
    return album.tracks;
  }

  if (!album.tracksFile) {
    return [];
  }

  const res = await fetch(album.tracksFile, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`No se pudo cargar ${album.tracksFile}`);
  }

  const data = await res.json();

  if (Array.isArray(data)) return data;
  if (Array.isArray(data.tracks)) return data.tracks;
  return [];
}

function triggerDiscBounce() {
  frontDisc.classList.remove("bounce");
  void frontDisc.offsetWidth;
  frontDisc.classList.add("bounce");
  window.setTimeout(() => {
    frontDisc.classList.remove("bounce");
  }, 460);
}

function updateDiscHotspot() {
  const album = getAlbum(currentIndex);

  if (isLadyGagaAlbum(album)) {
    discOpenHotspot.classList.add("visible");
  } else {
    discOpenHotspot.classList.remove("visible");
    discOpenHotspot.classList.remove("is-open");
  }

  if (tracksOpen && isLadyGagaAlbum(album)) {
    discOpenHotspot.classList.add("is-open");
  } else {
    discOpenHotspot.classList.remove("is-open");
  }
}

function closeTrackPanel() {
  stage.classList.remove("tracks-open");
  trackPanel.classList.remove("open");
  tracksOpen = false;
  updateDiscHotspot();
}

function openTrackPanelShell(album) {
  trackPanelTitle.textContent = `${album.artist} — ${album.title}`;

  stage.classList.remove("tracks-open");
  trackPanel.classList.remove("open");
  void stage.offsetHeight;
  void trackPanel.offsetHeight;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      stage.classList.add("tracks-open");
      trackPanel.classList.add("open");
      tracksOpen = true;
      updateDiscHotspot();
    });
  });
}

async function toggleLadyGagaTracks() {
  const album = getAlbum(currentIndex);

  if (!isLadyGagaAlbum(album)) return;
  if (isAnimating) return;

  if (tracksOpen) {
    closeTrackPanel();
    return;
  }

  triggerDiscBounce();
  setTrackListLoading();
  openTrackPanelShell(album);

  try {
    const tracks = await loadAlbumTracks(album);

    if (!isLadyGagaAlbum(getAlbum(currentIndex))) return;

    renderTrackList(tracks);
  } catch (err) {
    if (!isLadyGagaAlbum(getAlbum(currentIndex))) return;
    setTrackListError();
    console.error(err);
  }
}

function goToIndex(nextIndex, direction) {
  closeTrackPanel();
  currentIndex = mod(nextIndex, albums.length);
  const album = getAlbum(currentIndex);
  animateFrontCover(album, direction);
  switchMeta(album);
  renderSpines();
  updateDiscHotspot();
}

function canStartCarouselDrag(e) {
  if (e.target.closest("#trackPanel")) return false;
  if (e.target.closest("#discOpenHotspot")) return false;
  return true;
}

function handleRelease() {
  stage.classList.remove("dragging");

  const delta = dragDeltaX;

  if (Math.abs(delta) >= DRAG_THRESHOLD) {
    if (delta < 0) {
      goToIndex(currentIndex + 1, 1);
    } else {
      goToIndex(currentIndex - 1, -1);
    }
  }

  clearElastic();

  isDragging = false;
  dragLocked = false;
  dragDeltaX = 0;
  activePointerId = null;
}

function onPointerDown(e) {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  if (!canStartCarouselDrag(e)) return;

  activePointerId = e.pointerId;
  isDragging = true;
  dragLocked = false;
  dragStartX = e.clientX;
  dragCurrentX = e.clientX;
  dragDeltaX = 0;

  stage.classList.add("dragging");
  stage.style.transition = "none";

  if (stage.setPointerCapture) {
    stage.setPointerCapture(e.pointerId);
  }
}

function onPointerMove(e) {
  if (!isDragging) return;
  if (activePointerId !== null && e.pointerId !== activePointerId) return;

  dragCurrentX = e.clientX;
  dragDeltaX = dragCurrentX - dragStartX;

  if (!dragLocked && Math.abs(dragDeltaX) > 6) {
    dragLocked = true;
  }

  setElasticFromDrag(dragDeltaX);
}

function onPointerUp(e) {
  if (!isDragging) return;
  if (activePointerId !== null && e.pointerId !== activePointerId) return;
  handleRelease();
}

function onPointerCancel(e) {
  if (!isDragging) return;
  if (activePointerId !== null && e.pointerId !== activePointerId) return;
  handleRelease();
}

function onKeyDown(e) {
  if (isAnimating) return;

  if (e.key === "ArrowRight") {
    goToIndex(currentIndex + 1, 1);
  } else if (e.key === "ArrowLeft") {
    goToIndex(currentIndex - 1, -1);
  } else if (e.key === "Escape") {
    closeTrackPanel();
  }
}

function preloadImages() {
  albums.forEach((album) => {
    const img = new Image();
    img.src = album.cover;

    if (album.spine) {
      const spine = new Image();
      spine.src = album.spine;
    }
  });
}

function init() {
  ensureTrackPanel();
  preloadImages();

  const first = getAlbum(currentIndex);
  setFrontCoverInstant(first);
  setMetaInstant(first);
  renderSpines();
  updateDiscHotspot();

  stage.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerCancel);
  window.addEventListener("keydown", onKeyDown);

  discOpenHotspot.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
  });

  discOpenHotspot.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLadyGagaTracks();
  });
}

init();