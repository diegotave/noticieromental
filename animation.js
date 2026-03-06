const totalFrames = 214;
const fps = 30;
const frameDuration = 1000 / fps;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const frames = [];
let loadedCount = 0;
let currentFrame = 0;
let lastTime = 0;
let animationStarted = false;

function framePath(i) {
  return `VIDEOS/videomundo/Comp/videomundo_${String(i).padStart(5, "0")}.png`;
}

function drawFrame(index) {
  const img = frames[index];
  if (!img || !img.complete) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
}

function animate(timestamp) {
  if (!lastTime) lastTime = timestamp;

  const elapsed = timestamp - lastTime;

  if (elapsed >= frameDuration) {
    currentFrame = (currentFrame + 1) % totalFrames;
    drawFrame(currentFrame);
    lastTime = timestamp;
  }

  requestAnimationFrame(animate);
}

for (let i = 0; i < totalFrames; i++) {
  const img = new Image();

  img.onload = () => {
    loadedCount++;

    if (i === 0) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      drawFrame(0);
    }

    if (loadedCount === totalFrames && !animationStarted) {
      animationStarted = true;
      requestAnimationFrame(animate);
    }
  };

  img.onerror = () => {
    console.error("No se pudo cargar este frame:", framePath(i));
  };

  img.src = framePath(i);
  frames.push(img);
}