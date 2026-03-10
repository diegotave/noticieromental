/* CONFIGURACION */

const weatherCities=[
  {label:"Buenos Aires",query:"Buenos Aires",bgId:"0FBiyFpV__g"},
  {label:"Madrid",query:"Madrid",bgId:"zbo6jUGrwdk"},
  {label:"Nueva York",query:"New York",bgId:"0FBiyFpV__g"},
  {label:"Tokio",query:"Tokyo",bgId:"zPH5KtjJFaQ"}
  ];
  
  let weatherTimer=null;
  let currentWeatherIndex=0;
  
  /* CREAR PAGINA */
  
  function createWeatherPage(slider,videoCount){
  
  const page=document.createElement("div");
  page.className="page";
  page.id="pageWeather";
  
  page.innerHTML=`
  
  <div class="youtube-bg">
  <iframe id="youtubeBgIframe"
  src="https://www.youtube.com/embed/${weatherCities[0].bgId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${weatherCities[0].bgId}">
  </iframe>
  </div>
  
  <div class="youtube-overlay"></div>
  
  <div class="weather-city-list" id="weatherCityList"></div>
  
  <div class="weather-stage">
  
  <div class="weather-plate">
  
  <div class="weather-frame"></div>
  
  <div class="temp-wrap">
  <div class="temp-number" id="tempNumber">--</div>
  </div>
  
  <div class="temp-unit">°C</div>
  
  <div class="temp-subline">
  <div id="tempCityName">BUENOS AIRES</div>
  <div>EN VIVO</div>
  </div>
  
  </div>
  </div>
  
  <div class="arrow left" onclick="goToPage(${videoCount})"></div>
  <div class="arrow right" onclick="goToPage(1)"></div>
  
  `;
  
  slider.appendChild(page);
  
  createCityButtons();
  
  }
  
  /* BOTONES CIUDADES */
  
  function createCityButtons(){
  
  const container=document.getElementById("weatherCityList");
  
  weatherCities.forEach((city,index)=>{
  
  const btn=document.createElement("button");
  btn.className="city-pill";
  btn.innerText=city.label;
  
  btn.onclick=()=>{
  currentWeatherIndex=index;
  renderWeatherCity(index);
  };
  
  container.appendChild(btn);
  
  });
  
  }
  
  /* FONDO */
  
  function setWeatherBackground(id){
  
  const iframe=document.getElementById("youtubeBgIframe");
  
  iframe.src=`https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}`;
  
  }
  
  /* RENDER */
  
  async function renderWeatherCity(index){
  
  const city=weatherCities[index];
  
  setWeatherBackground(city.bgId);
  
  document.getElementById("tempCityName").innerText=city.label.toUpperCase();
  
  const geo=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city.query}&count=1`);
  const geoData=await geo.json();
  
  const lat=geoData.results[0].latitude;
  const lon=geoData.results[0].longitude;
  
  const weather=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`);
  const weatherData=await weather.json();
  
  document.getElementById("tempNumber").innerText=Math.round(weatherData.current.temperature_2m);
  
  }
  
  /* ROTACION */
  
  function startWeatherRotation(){
  
  renderWeatherCity(currentWeatherIndex);
  
  weatherTimer=setInterval(()=>{
  
  currentWeatherIndex=(currentWeatherIndex+1)%weatherCities.length;
  
  renderWeatherCity(currentWeatherIndex);
  
  },7000);
  
  }
  
  function stopWeatherRotation(){
  
  clearInterval(weatherTimer);
  
  }