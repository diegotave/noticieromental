const albums = [
  {
    artist: "Lady Gaga",
    title: "Album name",
    cover: "CDS/Lady_gaga-disc_name/cover1.jpg"
  },
  {
    artist: "Howe Gelb",
    title: "Album name",
    cover: "CDS/Howe_Gelb-disc_name/Front.jpg"
  },
  {
    artist: "The Clash",
    title: "London Calling",
    cover: "CDS/TheClash_London calling/cover.jpg"
  },
  {
    artist: "Cindy Lauper",
    title: "She's So Unusual",
    cover: "CDS/Cindy Lauper - She/covercindy.jpg"
  },
  {
    artist: "Nirvana",
    title: "Nevermind",
    cover: "CDS/Nirvana-nevermind/covernirvana.jpg"
  }
];

const leftSpinesEl = document.getElementById("leftSpines");
const rightSpinesEl = document.getElementById("rightSpines");
const stageEl = document.getElementById("stage");

const frontDiscEl = document.getElementById("frontDisc");
const frontCoverAEl = document.getElementById("frontCoverA");
const frontCoverBEl = document.getElementById("frontCoverB");

const albumMetaEl = document.getElementById("albumMeta");
const metaArtistCurrentEl = document.getElementById("metaArtistCurrent");
const metaTitleCurrentEl = document.getElementById("metaTitleCurrent");
const metaArtistNextEl = document.getElementById("metaArtistNext");
const metaTitleNextEl = document.getElementById("metaTitleNext");

const opacityClassesNearToFar = [
  "op100",
  "op100",
  "op80",
  "op80",
  "op60",
  "op60"
];

let currentIndex = 0;
let dragStartX = 0;
let dragAccumulatedX = 0;
let isDragging = false;

let targetOffset = 0;
let visualOffset = 0;

let metaSwitchTimeout = null;
let coverSwitchTimeout = null;

let activeCoverEl = frontCoverAEl;
let inactiveCoverEl = frontCoverBEl;
let isAnimatingCover = false;

const STEP_THRESHOLD = 70;
const MAX_DRAG_OFFSET = 34;
const SMOOTHING = 0.18;
const COVER_BASE_DURATION = 360;

/* gesto de bloques */
const SPINE_EXPAND_MAX = 8;
const SPINE_CONTRACT_MAX = 6;

function getAlbumAt(index){
  const total = albums.length;
  const normalizedIndex = ((index % total) + total) % total;
  return albums[normalizedIndex];
}

function createSpine(album, opacityClass, side, indexFromAnchor){
  const spine = document.createElement("div");
  spine.className = `spine-wrap ${opacityClass}`;
  spine.dataset.side = side;
  spine.dataset.indexFromAnchor = String(indexFromAnchor);
  spine.innerHTML = `
    <img class="spine-cover" src="${album.cover}" alt="${album.artist} - ${album.title}">
    <img class="spinepng" src="IMAGES/REPRODUCTOR_PHONAVI/LOMOCD4.png" alt="">
  `;
  return spine;
}

function setCoverInstant(el, src, alt){
  el.src = src;
  el.alt = alt;
  el.style.transition = "none";
  el.style.transform = "translateX(0)";
}

function renderFrontInitial(){
  const currentAlbum = getAlbumAt(currentIndex);
  const altText = `${currentAlbum.artist} - ${currentAlbum.title}`;

  setCoverInstant(activeCoverEl, currentAlbum.cover, altText);

  inactiveCoverEl.src = currentAlbum.cover;
  inactiveCoverEl.alt = altText;
  inactiveCoverEl.style.transition = "none";
  inactiveCoverEl.style.transform = "translateX(100%)";
}

function animateFront(direction){
  if(isAnimatingCover) return;

  const currentAlbum = getAlbumAt(currentIndex);
  const altText = `${currentAlbum.artist} - ${currentAlbum.title}`;

  const outgoingEl = activeCoverEl;
  const incomingEl = inactiveCoverEl;

  const travelDirection = direction === 1 ? 1 : -1;
  const incomingStart = -100 * travelDirection;
  const outgoingEnd = 100 * travelDirection;

  const elasticFactor = Math.min(Math.abs(targetOffset) / MAX_DRAG_OFFSET, 1);
  const duration = Math.round(COVER_BASE_DURATION + (elasticFactor * 70));

  clearTimeout(coverSwitchTimeout);
  isAnimatingCover = true;

  incomingEl.src = currentAlbum.cover;
  incomingEl.alt = altText;

  outgoingEl.style.transition = "none";
  incomingEl.style.transition = "none";

  outgoingEl.style.transform = "translateX(0)";
  incomingEl.style.transform = `translateX(${incomingStart}%)`;

  if(travelDirection === 1){
    outgoingEl.style.zIndex = "1";
    incomingEl.style.zIndex = "2";
  }else{
    outgoingEl.style.zIndex = "2";
    incomingEl.style.zIndex = "1";
  }

  void frontDiscEl.offsetWidth;

  const transitionValue = `transform ${duration}ms cubic-bezier(0.22,1,0.36,1)`;

  outgoingEl.style.transition = transitionValue;
  incomingEl.style.transition = transitionValue;

  outgoingEl.style.transform = `translateX(${outgoingEnd}%)`;
  incomingEl.style.transform = "translateX(0)";

  coverSwitchTimeout = setTimeout(() => {
    outgoingEl.style.transition = "none";
    incomingEl.style.transition = "none";

    outgoingEl.style.transform = `translateX(${outgoingEnd}%)`;
    incomingEl.style.transform = "translateX(0)";

    activeCoverEl = incomingEl;
    inactiveCoverEl = outgoingEl;

    isAnimatingCover = false;
  }, duration);
}

function renderMeta(initial = false){
  const currentAlbum = getAlbumAt(currentIndex);

  if(initial){
    metaArtistCurrentEl.textContent = currentAlbum.artist;
    metaTitleCurrentEl.textContent = currentAlbum.title;
    metaArtistNextEl.textContent = currentAlbum.artist;
    metaTitleNextEl.textContent = currentAlbum.title;
    return;
  }

  metaArtistNextEl.textContent = currentAlbum.artist;
  metaTitleNextEl.textContent = currentAlbum.title;

  albumMetaEl.classList.remove("switching");
  void albumMetaEl.offsetWidth;
  albumMetaEl.classList.add("switching");

  clearTimeout(metaSwitchTimeout);
  metaSwitchTimeout = setTimeout(() => {
    metaArtistCurrentEl.textContent = currentAlbum.artist;
    metaTitleCurrentEl.textContent = currentAlbum.title;
    albumMetaEl.classList.remove("switching");
  }, 180);
}

function renderSpines(){
  leftSpinesEl.innerHTML = "";
  rightSpinesEl.innerHTML = "";

  /* lado izquierdo: el ancla es el último elemento del bloque visual,
     o sea el más cerca de TAPACD */
  for(let i = 6; i >= 1; i--){
    const album = getAlbumAt(currentIndex - i);
    const opacityClass = opacityClassesNearToFar[i - 1];
    const indexFromAnchor = i - 1;
    leftSpinesEl.appendChild(createSpine(album, opacityClass, "left", indexFromAnchor));
  }

  /* lado derecho: el ancla es el primer elemento del bloque visual,
     o sea el más cerca de TAPACD */
  for(let i = 1; i <= 6; i++){
    const album = getAlbumAt(currentIndex + i);
    const opacityClass = opacityClassesNearToFar[i - 1];
    const indexFromAnchor = i - 1;
    rightSpinesEl.appendChild(createSpine(album, opacityClass, "right", indexFromAnchor));
  }
}

function renderAll(initial = false, direction = 0){
  if(initial){
    renderFrontInitial();
  }else{
    animateFront(direction);
  }

  renderMeta(initial);
  renderSpines();
  updateSpineMotion();
}

function moveCarousel(direction){
  if(isAnimatingCover) return;

  currentIndex += direction;
  renderAll(false, direction);
}

function getClientX(event){
  if(event.touches && event.touches.length > 0){
    return event.touches[0].clientX;
  }

  if(event.changedTouches && event.changedTouches.length > 0){
    return event.changedTouches[0].clientX;
  }

  return event.clientX;
}

function getResistedOffset(value){
  const clamped = Math.max(-STEP_THRESHOLD, Math.min(STEP_THRESHOLD, value));
  const sign = clamped < 0 ? -1 : 1;
  const amount = Math.abs(clamped) / STEP_THRESHOLD;
  const eased = 1 - Math.pow(1 - amount, 2);
  return sign * eased * MAX_DRAG_OFFSET;
}

function getExpandShift(indexFromAnchor, amount){
  return indexFromAnchor * SPINE_EXPAND_MAX * amount;
}

function getContractShift(indexFromAnchor, amount){
  return indexFromAnchor * SPINE_CONTRACT_MAX * amount;
}

function updateSpineMotion(){
  const allSpines = stageEl.querySelectorAll(".spine-wrap");
  const amount = Math.min(Math.abs(visualOffset) / MAX_DRAG_OFFSET, 1);

  let direction = 0;
  if(visualOffset > 0.2) direction = 1;
  else if(visualOffset < -0.2) direction = -1;

  allSpines.forEach((spine) => {
    const side = spine.dataset.side;
    const indexFromAnchor = Number(spine.dataset.indexFromAnchor || 0);

    let shift = 0;

    if(direction === 1){
      /* vas a la derecha:
         derecha expande desde su primer lomo
         izquierda contrae hacia su primer lomo */
      if(side === "right"){
        shift = getExpandShift(indexFromAnchor, amount);
      }else{
        shift = getContractShift(indexFromAnchor, amount);
      }
    }
    else if(direction === -1){
      /* vas a la izquierda:
         izquierda expande desde su primer lomo
         derecha contrae hacia su primer lomo */
      if(side === "left"){
        shift = -getExpandShift(indexFromAnchor, amount);
      }else{
        shift = -getContractShift(indexFromAnchor, amount);
      }
    }

    spine.style.setProperty("--spine-shift", `${shift.toFixed(2)}px`);
  });
}

function updateVisualState(){
  visualOffset += (targetOffset - visualOffset) * SMOOTHING;

  if(Math.abs(targetOffset - visualOffset) < 0.05){
    visualOffset = targetOffset;
  }

  stageEl.style.transform = `translateX(${visualOffset}px)`;

  const elastic = Math.min(Math.abs(visualOffset) / MAX_DRAG_OFFSET, 1);
  stageEl.style.setProperty("--elastic", elastic.toFixed(3));

  updateSpineMotion();

  requestAnimationFrame(updateVisualState);
}

function onDragStart(event){
  isDragging = true;
  dragStartX = getClientX(event);
  dragAccumulatedX = 0;
  stageEl.classList.add("dragging");
}

function onDragMove(event){
  if(!isDragging) return;

  const currentX = getClientX(event);
  dragAccumulatedX = currentX - dragStartX;
  targetOffset = getResistedOffset(dragAccumulatedX);

  if(dragAccumulatedX <= -STEP_THRESHOLD){
    moveCarousel(1);
    dragStartX = currentX;
    dragAccumulatedX = 0;
    targetOffset = -MAX_DRAG_OFFSET * 0.35;
  }
  else if(dragAccumulatedX >= STEP_THRESHOLD){
    moveCarousel(-1);
    dragStartX = currentX;
    dragAccumulatedX = 0;
    targetOffset = MAX_DRAG_OFFSET * 0.35;
  }
}

function onDragEnd(){
  isDragging = false;
  dragAccumulatedX = 0;
  targetOffset = 0;
  stageEl.classList.remove("dragging");
}

stageEl.addEventListener("mousedown", onDragStart);
window.addEventListener("mousemove", onDragMove);
window.addEventListener("mouseup", onDragEnd);

stageEl.addEventListener("touchstart", onDragStart, { passive:true });
window.addEventListener("touchmove", onDragMove, { passive:true });
window.addEventListener("touchend", onDragEnd);

renderAll(true, 0);
updateVisualState();