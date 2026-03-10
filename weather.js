const weatherCities = [
  { label:"Buenos Aires", query:"Buenos Aires", bgId:"3F0XlKxaqbk" },
  { label:"Madrid", query:"Madrid", bgId:"zbo6jUGrwdk" },
  { label:"Nueva York", query:"New York", bgId:"0FBiyFpV__g" },
  { label:"Tokio", query:"Tokyo", bgId:"zPH5KtjJFaQ" }
];

let weatherTimer = null;
let currentWeatherIndex = 0;
let currentYoutubeBgId = weatherCities[0].bgId;

function getYoutubeEmbedUrl(videoId){
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1`;
}

function createWeatherPage(slider, videoCount){
  const page = document.createElement("div");
  page.className = "page";
  page.id = "pageWeather";

  page.innerHTML = `
    <div class="youtube-bg">
      <iframe
        id="youtubeBgIframe"
        src="${getYoutubeEmbedUrl(currentYoutubeBgId)}"
        frameborder="0"
        allow="autoplay; fullscreen"
        allowfullscreen>
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

function createCityButtons(){
  const container = document.getElementById("weatherCityList");
  if(!container) return;

  container.innerHTML = "";

  weatherCities.forEach((city, index) => {
    const btn = document.createElement("button");
    btn.className = "city-pill";
    btn.innerText = city.label;

    btn.onclick = () => {
      currentWeatherIndex = index;
      stopWeatherRotation();
      renderWeatherCity(index);
      weatherTimer = setInterval(() => {
        currentWeatherIndex = (currentWeatherIndex + 1) % weatherCities.length;
        renderWeatherCity(currentWeatherIndex);
      }, 7000);
    };

    container.appendChild(btn);
  });
}

function setActiveCity(index){
  document.querySelectorAll(".city-pill").forEach((btn, i) => {
    btn.classList.toggle("active", i === index);
  });
}

function setWeatherBackground(id){
  const iframe = document.getElementById("youtubeBgIframe");
  if(!iframe) return;
  if(currentYoutubeBgId === id) return;

  currentYoutubeBgId = id;
  iframe.src = getYoutubeEmbedUrl(id);
}

async function renderWeatherCity(index){
  const city = weatherCities[index];
  if(!city) return;

  setActiveCity(index);
  setWeatherBackground(city.bgId);

  const cityEl = document.getElementById("tempCityName");
  const tempEl = document.getElementById("tempNumber");

  if(cityEl) cityEl.innerText = city.label.toUpperCase();
  if(tempEl) tempEl.innerText = "--";

  try{
    const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.query)}&count=1`);
    const geoData = await geo.json();

    if(!geoData.results || !geoData.results.length){
      throw new Error("Ciudad no encontrada");
    }

    const lat = geoData.results[0].latitude;
    const lon = geoData.results[0].longitude;

    const weather = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`);
    const weatherData = await weather.json();

    if(!weatherData.current || typeof weatherData.current.temperature_2m !== "number"){
      throw new Error("Sin temperatura");
    }

    if(tempEl){
      tempEl.innerText = Math.round(weatherData.current.temperature_2m);
    }
  }catch(e){
    if(tempEl){
      tempEl.innerText = "--";
    }
  }
}

function startWeatherRotation(){
  stopWeatherRotation();
  renderWeatherCity(currentWeatherIndex);

  weatherTimer = setInterval(() => {
    currentWeatherIndex = (currentWeatherIndex + 1) % weatherCities.length;
    renderWeatherCity(currentWeatherIndex);
  }, 7000);
}

function stopWeatherRotation(){
  if(weatherTimer){
    clearInterval(weatherTimer);
    weatherTimer = null;
  }
}