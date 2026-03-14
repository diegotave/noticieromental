(() => {

  const stage = document.getElementById("phonavi-stage")
  const visual = document.getElementById("phonaviVisual")
  const trigger = document.getElementById("phonaviTrigger")
  
  if(!stage || !visual || !trigger) return
  
  const idle =
  "assets/IMAGES/BOTONES/BOTONTOPHONAVI.png"
  
  const hover =
  "assets/IMAGES/BOTONES/BOTONTOPHONAVI2.png"
  
  function preload(){
  
  const img1 = new Image()
  const img2 = new Image()
  
  img1.src = idle
  img2.src = hover
  
  }
  
  function fitStage(){
  
  const vw = window.innerWidth
  const vh = window.innerHeight
  
  const scale = Math.min(vw/1920 , vh/1080)
  
  stage.style.transform =
  `translate(-50%, -50%) scale(${scale})`
  
  }
  
  preload()
  fitStage()
  
  window.addEventListener("resize",fitStage)
  
  trigger.addEventListener("mouseenter",()=>{
  
  visual.src = hover
  
  })
  
  trigger.addEventListener("mouseleave",()=>{
  
  visual.src = idle
  
  })
  
  })()