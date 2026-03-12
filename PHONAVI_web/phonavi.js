const albums = [
  {
    artist: "Howe Gelb",
    title: "Album name",
    cover: "CDS/Howe_Gelb-disc_name/Front.jpg",
  },
  {
    artist: "Lady Gaga",
    title: "Album name",
    cover: "CDS/Lady_gaga-disc_name/cover1.jpg",
  },
];

const frontOverlayPath = "IMAGES/REPRODUCTOR_PHONAVI/FRENTECD.png";
const spineOverlayPath = "IMAGES/REPRODUCTOR_PHONAVI/LOMOCD.png";

const currentFrontAlbumIndex = 0;
const sideOpacitiesNearToFar = [0.8, 0.8, 0.6, 0.6, 0.3, 0.3];

const leftSpinesEl = document.getElementById("leftSpines");
const rightSpinesEl = document.getElementById("rightSpines");
const frontCdEl = document.getElementById("frontCd");
const frontCaptionEl = document.getElementById("frontCaption");

function createFrontCd(album) {
  frontCdEl.innerHTML = `
    <div class="front-image-box">
      <img
        src="${album.cover}"
        alt="${album.artist} - ${album.title}"
      />
    </div>
    <img
      class="front-overlay"
      src="${frontOverlayPath}"
      alt=""
      aria-hidden="true"
    />
  `;

  frontCaptionEl.textContent = `${album.artist} - ${album.title}`;
}

function createSpine(album, opacityValue) {
  const spine = document.createElement("div");
  spine.className = "spine";
  spine.style.opacity = opacityValue;

  spine.innerHTML = `
    <div class="spine-image-box">
      <img
        src="${album.cover}"
        alt="${album.artist} - ${album.title}"
      />
    </div>
    <img
      class="spine-overlay"
      src="${spineOverlayPath}"
      alt=""
      aria-hidden="true"
    />
  `;

  return spine;
}

function getAlternatingAlbums(count) {
  const result = [];
  for (let i = 0; i < count; i += 1) {
    result.push(albums[i % albums.length]);
  }
  return result;
}

function fillSpines() {
  leftSpinesEl.innerHTML = "";
  rightSpinesEl.innerHTML = "";

  const allSpineAlbums = getAlternatingAlbums(12);
  const leftAlbums = allSpineAlbums.slice(0, 6);
  const rightAlbums = allSpineAlbums.slice(6, 12);

  leftAlbums.forEach((album, index) => {
    const opacityValue = sideOpacitiesNearToFar[5 - index];
    leftSpinesEl.appendChild(createSpine(album, opacityValue));
  });

  rightAlbums.forEach((album, index) => {
    const opacityValue = sideOpacitiesNearToFar[index];
    rightSpinesEl.appendChild(createSpine(album, opacityValue));
  });
}

createFrontCd(albums[currentFrontAlbumIndex]);
fillSpines();