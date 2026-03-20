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
    title: "Future Standards",
    cover: "CDS/Howe Gelb - Future Standards/Front.jpg",
    spine: "IMAGES/REPRODUCTOR_PHONAVI/LOMOCD5.png",
    tracksFile: "CDS/Howe Gelb - Future Standards/tracks.json"
  },
  {
    artist: "The Clash",
    title: "London Calling",
    cover: "CDS/TheClash_London calling/cover.jpg",
    spine: "IMAGES/REPRODUCTOR_PHONAVI/LOMOCD5.png",
    tracksFile: "CDS/TheClash_London calling/tracks.json"
  },
  {
    artist: "Cindy Lauper",
    title: "She's So Unusual",
    cover: "CDS/Cindy Lauper - She/covercindy.jpg",
    spine: "IMAGES/REPRODUCTOR_PHONAVI/LOMOCD5.png",
    tracksFile: "CDS/Cindy Lauper - She/tracks.json"
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
    spine: "IMAGES/REPRODUCTOR_PHONAVI/LOMOCD5.png",
    tracksFile: "CDS/Nirvana-nevermind/tracks.json"
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
const SPINES_PER_SIDE = 8;
const MIN_CONTRACT_SCALE = 0.68;

function mod(n, m) {
  return ((n % m) + m) % m;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getAlbum(index) {
  return albums[mod(index, albums.length)];
}

function hasTracks(album) {
  return !!album.tracksFile || (Array.isArray(album.tracks) && album.tracks.length > 0);
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

function getGapScaleForSide(side, deltaX) {
  const amount = clamp(Math.abs(deltaX) / MAX_ELASTIC_PX, 0, 1);
  const eased = 1 - Math.pow(1 - amount, 2);

  if (deltaX > 0) {
    return side === "right"
      ? 1 + eased
      : 1 - ((1 - MIN_CONTRACT_SCALE) * eased);
  }

  if (deltaX < 0) {
    return side === "left"
      ? 1 + eased
      : 1 - ((1 - MIN_CONTRACT_SCALE) * eased);
  }

  return 1;
}

function applySpineGap(wrap, scale = 1) {
  const gapIndex = Number(wrap.dataset.gapIndex || 1);
  wrap.style.setProperty(
    "--spine-gap",
    `calc((var(--disc-size) * ${gapIndex} * ${scale}) / 100)`
  );
}

function updateSpineElasticGaps(deltaX = 0) {
  const leftScale = getGapScaleForSide("left", deltaX);
  const rightScale = getGapScaleForSide("right", deltaX);

  leftSpines.querySelectorAll(".spine-wrap").forEach((wrap) => {
    applySpineGap(wrap, leftScale);
  });

  rightSpines.querySelectorAll(".spine-wrap").forEach((wrap) => {
    applySpineGap(wrap, rightScale);
  });
}

function getSpineOpacityClass(distanceFromCenter) {
  const opacityClasses = ["op100", "op90", "op80", "op70", "op60", "op50", "op40", "op30"];
  return opacityClasses[Math.min(distanceFromCenter, opacityClasses.length - 1)];
}

function getSpineSaturationClass(distanceFromCenter) {
  const saturationClasses = ["sat100", "sat90", "sat80", "sat70", "sat60", "sat50", "sat40", "sat30"];
  return saturationClasses[Math.min(distanceFromCenter, saturationClasses.length - 1)];
}

function makeSpine(album, side, distanceFromCenter) {
  const wrap = document.createElement("div");
  wrap.className = "spine-wrap";
  wrap.dataset.side = side;
  wrap.dataset.gapIndex = String(distanceFromCenter + 1);

  const cover = document.createElement("img");
  cover.className = "spine-cover";
  cover.src = album.cover;
  cover.alt = "";

  const spinePng = document.createElement("img");
  spinePng.className = "spinepng";
  spinePng.src = album.spine;
  spinePng.alt = "";

  wrap.classList.add(
    getSpineOpacityClass(distanceFromCenter),
    getSpineSaturationClass(distanceFromCenter)
  );

  const shiftBase = distanceFromCenter * 2;
  wrap.style.setProperty(
    "--spine-shift",
    `${side === "left" ? shiftBase : -shiftBase}px`
  );

  applySpineGap(wrap, 1);

  wrap.appendChild(cover);
  wrap.appendChild(spinePng);

  return wrap;
}

function renderSpines() {
  leftSpines.innerHTML = "";
  rightSpines.innerHTML = "";

  for (let i = SPINES_PER_SIDE; i >= 1; i--) {
    const album = getAlbum(currentIndex - i);
    const distanceFromCenter = i - 1;
    leftSpines.appendChild(makeSpine(album, "left", distanceFromCenter));
  }

  for (let i = 1; i <= SPINES_PER_SIDE; i++) {
    const album = getAlbum(currentIndex + i);
    const distanceFromCenter = i - 1;
    rightSpines.appendChild(makeSpine(album, "right", distanceFromCenter));
  }

  updateSpineElasticGaps(0);
}

function setElasticFromDrag(deltaX) {
  const abs = Math.abs(deltaX);
  const elastic = clamp(abs / MAX_ELASTIC_PX, 0, 1);
  stage.style.setProperty("--elastic", elastic.toFixed(3));

  const moveX = clamp(deltaX * 0.18, -42, 42);
  stage.style.setProperty("--drag-x", `${moveX}px`);

  updateSpineElasticGaps(deltaX);
}

function clearElastic() {
  stage.style.setProperty("--elastic", "0");
  stage.style.transition = "transform 340ms cubic-bezier(0.22,1,0.36,1)";
  stage.style.setProperty("--drag-x", "0px");
  updateSpineElasticGaps(0);

  window.setTimeout(() => {
    stage.style.transition = "";
  }, 360);
}

function updateStageScale() {
  requestAnimationFrame(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const topPadding = stage.classList.contains("tracks-open") ? viewportHeight * 0.05 : 0;
    const horizontalPadding = viewportWidth * 0.03;

    stage.style.setProperty("--scale", "1");

    const rect = stage.getBoundingClientRect();

    const availableWidth = viewportWidth - (horizontalPadding * 2);
    const availableHeight = viewportHeight - topPadding;

    const widthScale = rect.width > 0 ? Math.min(1, availableWidth / rect.width) : 1;
    const heightScale = rect.height > 0 ? Math.min(1, availableHeight / rect.height) : 1;

    const finalScale = Math.max(Math.min(widthScale, heightScale), 0.55);
    stage.style.setProperty("--scale", finalScale.toFixed(4));
  });
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
    let label = `Track ${index + 1}`;

    if (typeof track === "string") {
      label = track;
    } else if (track && typeof track === "object") {
      label = track.title || track.name || label;
    }

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

  if (hasTracks(album)) {
    discOpenHotspot.classList.add("visible");
  } else {
    discOpenHotspot.classList.remove("visible");
    discOpenHotspot.classList.remove("is-open");
  }

  if (tracksOpen && hasTracks(album)) {
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
  updateStageScale();
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
      updateStageScale();
    });
  });
}

async function toggleTracks() {
  const album = getAlbum(currentIndex);

  if (!hasTracks(album)) return;
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

    if (getAlbum(currentIndex) !== album) return;

    renderTrackList(tracks);
    updateStageScale();
  } catch (err) {
    if (getAlbum(currentIndex) !== album) return;
    setTrackListError();
    console.error(err);
    updateStageScale();
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
  updateStageScale();
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
  } else if (e.key === "Enter" || e.key === " ") {
    const album = getAlbum(currentIndex);
    if (hasTracks(album)) {
      e.preventDefault();
      toggleTracks();
    }
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
  updateStageScale();

  stage.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerCancel);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("resize", updateStageScale);

  discOpenHotspot.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
  });

  discOpenHotspot.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleTracks();
  });
}

init();