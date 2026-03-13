const albums = [
  {
  artist:"Lady Gaga",
  title:"Album name",
  cover:"CDS/Lady_gaga-disc_name/cover1.jpg"
  },
  {
  artist:"Howe Gelb",
  title:"Album name",
  cover:"CDS/Howe_Gelb-disc_name/Front.jpg"
  },
  {
  artist:"The Clash",
  title:"London Calling",
  cover:"CDS/TheClash_London calling/cover.jpg"
  },
  {
  artist:"Cindy Lauper",
  title:"She's So Unusual",
  cover:"CDS/Cindy Lauper - She/covercindy.jpg"
  },
  {
  artist:"Nirvana",
  title:"Nevermind",
  cover:"CDS/Nirvana-nevermind/covernirvana.jpg"
  }
  ];
  
  const leftSpinesEl=document.getElementById("leftSpines");
  const rightSpinesEl=document.getElementById("rightSpines");
  const frontCoverEl=document.getElementById("frontCover");
  const stageEl=document.getElementById("stage");
  
  const albumMetaEl=document.getElementById("albumMeta");
  const metaArtistCurrentEl=document.getElementById("metaArtistCurrent");
  const metaTitleCurrentEl=document.getElementById("metaTitleCurrent");
  const metaArtistNextEl=document.getElementById("metaArtistNext");
  const metaTitleNextEl=document.getElementById("metaTitleNext");
  
  const opacityClassesNearToFar=[
  "op100",
  "op100",
  "op80",
  "op80",
  "op60",
  "op60"
  ];
  
  let currentIndex=0;
  let dragStartX=0;
  let dragAccumulatedX=0;
  let isDragging=false;
  
  let targetOffset=0;
  let visualOffset=0;
  
  let metaSwitchTimeout=null;
  
  const STEP_THRESHOLD=70;
  const MAX_DRAG_OFFSET=34;
  const SMOOTHING=0.18;
  
  function getAlbumAt(index){
  const total=albums.length;
  const normalizedIndex=((index%total)+total)%total;
  return albums[normalizedIndex];
  }
  
  function createSpine(album,opacityClass){
  const spine=document.createElement("div");
  spine.className=`spine-wrap ${opacityClass}`;
  spine.innerHTML=`
  <img class="spine-cover" src="${album.cover}" alt="${album.artist} - ${album.title}">
  <img class="spinepng" src="IMAGES/REPRODUCTOR_PHONAVI/LOMOCD4.png" alt="">
  `;
  return spine;
  }
  
  function renderFront(){
  const currentAlbum=getAlbumAt(currentIndex);
  frontCoverEl.src=currentAlbum.cover;
  frontCoverEl.alt=`${currentAlbum.artist} - ${currentAlbum.title}`;
  }
  
  function renderMeta(initial=false){
  const currentAlbum=getAlbumAt(currentIndex);
  
  if(initial){
  metaArtistCurrentEl.textContent=currentAlbum.artist;
  metaTitleCurrentEl.textContent=currentAlbum.title;
  metaArtistNextEl.textContent=currentAlbum.artist;
  metaTitleNextEl.textContent=currentAlbum.title;
  return;
  }
  
  metaArtistNextEl.textContent=currentAlbum.artist;
  metaTitleNextEl.textContent=currentAlbum.title;
  
  albumMetaEl.classList.remove("switching");
  void albumMetaEl.offsetWidth;
  albumMetaEl.classList.add("switching");
  
  clearTimeout(metaSwitchTimeout);
  metaSwitchTimeout=setTimeout(()=>{
  metaArtistCurrentEl.textContent=currentAlbum.artist;
  metaTitleCurrentEl.textContent=currentAlbum.title;
  albumMetaEl.classList.remove("switching");
  },180);
  }
  
  function renderSpines(){
  leftSpinesEl.innerHTML="";
  rightSpinesEl.innerHTML="";
  
  for(let i=6;i>=1;i--){
  const album=getAlbumAt(currentIndex-i);
  const opacityClass=opacityClassesNearToFar[i-1];
  leftSpinesEl.appendChild(createSpine(album,opacityClass));
  }
  
  for(let i=1;i<=6;i++){
  const album=getAlbumAt(currentIndex+i);
  const opacityClass=opacityClassesNearToFar[i-1];
  rightSpinesEl.appendChild(createSpine(album,opacityClass));
  }
  }
  
  function renderAll(initial=false){
  renderFront();
  renderMeta(initial);
  renderSpines();
  }
  
  function moveCarousel(direction){
  currentIndex+=direction;
  renderAll(false);
  }
  
  function getClientX(event){
  if(event.touches && event.touches.length>0){
  return event.touches[0].clientX;
  }
  
  if(event.changedTouches && event.changedTouches.length>0){
  return event.changedTouches[0].clientX;
  }
  
  return event.clientX;
  }
  
  function getResistedOffset(value){
  const clamped=Math.max(-STEP_THRESHOLD,Math.min(STEP_THRESHOLD,value));
  const sign=clamped<0?-1:1;
  const amount=Math.abs(clamped)/STEP_THRESHOLD;
  const eased=1-Math.pow(1-amount,2);
  return sign*eased*MAX_DRAG_OFFSET;
  }
  
  function updateVisualState(){
  visualOffset+=(targetOffset-visualOffset)*SMOOTHING;
  
  if(Math.abs(targetOffset-visualOffset)<0.05){
  visualOffset=targetOffset;
  }
  
  stageEl.style.transform=`translateX(${visualOffset}px)`;
  
  const elastic=Math.min(Math.abs(visualOffset)/MAX_DRAG_OFFSET,1);
  stageEl.style.setProperty("--elastic",elastic.toFixed(3));
  
  requestAnimationFrame(updateVisualState);
  }
  
  function onDragStart(event){
  isDragging=true;
  dragStartX=getClientX(event);
  dragAccumulatedX=0;
  stageEl.classList.add("dragging");
  }
  
  function onDragMove(event){
  if(!isDragging) return;
  
  const currentX=getClientX(event);
  dragAccumulatedX=currentX-dragStartX;
  targetOffset=getResistedOffset(dragAccumulatedX);
  
  if(dragAccumulatedX<=-STEP_THRESHOLD){
  moveCarousel(1);
  dragStartX=currentX;
  dragAccumulatedX=0;
  targetOffset=-MAX_DRAG_OFFSET*0.35;
  }
  else if(dragAccumulatedX>=STEP_THRESHOLD){
  moveCarousel(-1);
  dragStartX=currentX;
  dragAccumulatedX=0;
  targetOffset=MAX_DRAG_OFFSET*0.35;
  }
  }
  
  function onDragEnd(){
  isDragging=false;
  dragAccumulatedX=0;
  targetOffset=0;
  stageEl.classList.remove("dragging");
  }
  
  stageEl.addEventListener("mousedown",onDragStart);
  window.addEventListener("mousemove",onDragMove);
  window.addEventListener("mouseup",onDragEnd);
  
  stageEl.addEventListener("touchstart",onDragStart,{passive:true});
  window.addEventListener("touchmove",onDragMove,{passive:true});
  window.addEventListener("touchend",onDragEnd);
  
  renderAll(true);
  updateVisualState();