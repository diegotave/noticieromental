(() => {
  const TOTAL_FRAMES = 8;
  const FIRST_FRAME = 0;
  const LAST_FRAME = 7;
  const FRAME_DELAY = 40;

  const stage = document.getElementById("ui-stage");
  const visual = document.getElementById("acercaDeVisual");
  const trigger = document.getElementById("acercaDeTrigger");

  if (!stage || !visual || !trigger) {
    return;
  }

  const frames = [];
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const num = String(i).padStart(5, "0");
    frames.push(`BOTON/AcercaDe_${num}.png`);
  }

  let currentFrame = 0;
  let targetFrame = 0;
  let timer = null;
  let touchOpened = false;

  function preloadFrames() {
    for (const src of frames) {
      const img = new Image();
      img.src = src;
    }
  }

  function stopAnimation() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function renderFrame(index) {
    visual.src = frames[index];
    currentFrame = index;
  }

  function animateTo(target) {
    stopAnimation();
    targetFrame = target;

    function step() {
      if (currentFrame === targetFrame) {
        timer = null;
        return;
      }

      currentFrame += currentFrame < targetFrame ? 1 : -1;
      visual.src = frames[currentFrame];
      timer = setTimeout(step, FRAME_DELAY);
    }

    step();
  }

  function fitStage() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = Math.min(vw / 1920, vh / 1080);
    stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }

  preloadFrames();
  renderFrame(FIRST_FRAME);
  fitStage();

  window.addEventListener("resize", fitStage);

  trigger.addEventListener("mouseenter", () => {
    animateTo(LAST_FRAME);
  });

  trigger.addEventListener("mouseleave", () => {
    animateTo(FIRST_FRAME);
  });

  trigger.addEventListener("focus", () => {
    animateTo(LAST_FRAME);
  });

  trigger.addEventListener("blur", () => {
    animateTo(FIRST_FRAME);
  });

  trigger.addEventListener("click", (event) => {
    if (window.matchMedia("(hover: none)").matches) {
      event.preventDefault();
      touchOpened = !touchOpened;
      animateTo(touchOpened ? LAST_FRAME : FIRST_FRAME);
    }
  });
})();