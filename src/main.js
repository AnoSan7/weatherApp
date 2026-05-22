let getWeather=async(city)=>{
    let response=await fetch(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${city}?unitGroup=us&key=PJWSS4TLJKSKT2Y62AGZG9EJ5&contentType=json`);
    if(!response.ok){
        return null;
    }
    let data=await response.json();
    return data;
}

function changeCity(newCity){
    return newCity.charAt(0).toUpperCase()+newCity.slice(1).toLowerCase();
}

const searchForm=document.querySelector("#search-form");
const cityInput=document.querySelector("#city-input");
const metricRadio=document.querySelector("#metric");
const imperialRadio=document.querySelector("#imperial");
const loadingDialog=document.querySelector("#loading-dialog");
let lastData = null;

// Icons map (simple emoji fallbacks)
const iconMap = {
    'clear-day':'☀️','clear-night':'🌙','partly-cloudy-day':'⛅','partly-cloudy-night':'🌙',
    'cloudy':'☁️','rain':'🌧️','snow':'❄️','fog':'🌫️','wind':'💨'
};

function toC(f){ return ((f-32)*5/9).toFixed(1); }
function fmtTemp(v){ return metricRadio && metricRadio.checked ? `${toC(v)}°C` : `${Math.round(v)}°F`; }
function fmtSpeed(s){ return metricRadio && metricRadio.checked ? `${Math.round(s*1.609)} km/h` : `${Math.round(s)} mph`; }
function fmtDistance(miles){ return metricRadio && metricRadio.checked ? `${(miles*1.609).toFixed(1)} km` : `${miles} mi`; }
function fmtPrecip(inches){ return metricRadio && metricRadio.checked ? `${(inches*25.4).toFixed(1)} mm` : `${inches} in`; }

searchForm.addEventListener("submit",async (e)=>{
    e.preventDefault();
    let city=cityInput.value;
    let city1=changeCity(city);
    toggleLoading(true);
    let data=await getWeather(city1);
    toggleLoading(false);
    lastData = data;
    renderWeather(data);
});

// re-render when unit toggles
metricRadio.addEventListener('change', ()=>{ if(lastData) renderWeather(lastData); });
if(imperialRadio){ imperialRadio.addEventListener('change', ()=>{ if(lastData) renderWeather(lastData); }); }

function toggleLoading(show){
    if(show){
        loadingDialog.showModal();
    }
    else{
        loadingDialog.close();
    }
}

function renderWeather(data){
    const weeklyContainer=document.querySelector("#weekly-forecast");
    const elements={
        weatherInfo:document.querySelector("#weather-info"),
        weatherCondition:document.querySelector("#weather-condition"),
        cityName:document.querySelector("#city-name"),
        temperature:document.querySelector("#temperature"),
        description:document.querySelector("#description"),
        humidity:document.querySelector("#humidity"),
        windSpeed:document.querySelector("#wind-speed"),
        feelsLike:document.querySelector("#feels-like")
    };
    const errorMessage=document.querySelector("#error-message");
    if(!data){
        errorMessage.textContent="No weather data found";
        if(errorMessage.classList.contains("is-hidden")){
            errorMessage.classList.remove("is-hidden");
        }
        if(!elements.weatherInfo.classList.contains("is-hidden")){
            elements.weatherInfo.classList.add("is-hidden");
        }
        if(weeklyContainer && !weeklyContainer.classList.contains('is-hidden')) weeklyContainer.classList.add('is-hidden');
        return;
    }
    if(!errorMessage.classList.contains("is-hidden")){
        errorMessage.classList.add("is-hidden");
    }
    if(elements.weatherInfo.classList.contains("is-hidden")){
        elements.weatherInfo.classList.remove("is-hidden");
    }
    elements.weatherCondition.textContent=data.days[0].conditions;
    elements.cityName.textContent=data.resolvedAddress;
    let currTemp=data.days[0].temp;
    let feelsLikeTemp=data.days[0].feelslike;
    // set icon
    const mainIcon = iconMap[data.days[0].icon] || '🌤️';
    const iconEl = document.querySelector('#weather-icon');
    if(iconEl) iconEl.textContent = mainIcon;
    elements.temperature.textContent = fmtTemp(currTemp);
    elements.feelsLike.textContent = `Feels Like: ${fmtTemp(feelsLikeTemp)}`;
    elements.description.textContent = `Description: ${data.days[0].conditions}`;
    elements.humidity.textContent = `Humidity: ${data.days[0].humidity}%`;
    elements.windSpeed.textContent = `Wind: ${fmtSpeed(data.days[0].windspeed)}`;
    // open details on click
    if(elements.weatherInfo){
        elements.weatherInfo.onclick = ()=> openDetailsDialog(data.days[0], data.resolvedAddress);
        elements.weatherInfo.setAttribute('aria-expanded','false');
    }

    // Weekly forecast (next 6 days excluding today)
    if(weeklyContainer){
        const upcoming = data.days.slice(1, 7); // next 6 days
        weeklyContainer.innerHTML = upcoming.map(day=>{
            const weekday = new Date(day.datetime).toLocaleDateString(undefined,{weekday:'short'});
            const icon = iconMap[day.icon] || '🌤️';
            const tmin = fmtTemp(day.tempmin);
            const tmax = fmtTemp(day.tempmax);
            const cond = day.conditions || '';
            return `
                <div class="bg-white/90 text-black p-4 rounded-lg flex flex-col items-center gap-2">
                    <div class="text-sm font-semibold">${weekday}</div>
                    <div class="text-3xl">${icon}</div>
                    <div class="text-sm">${tmin} / ${tmax}</div>
                    <div class="text-xs capitalize">${cond}</div>
                </div>
            `;
        }).join('');
        if(weeklyContainer.classList.contains('is-hidden')) weeklyContainer.classList.remove('is-hidden');
    }
}

// Open details dialog for a given day object
function openDetailsDialog(day, city){
    const dialog = document.querySelector('#details-dialog');
    if(!dialog) return;
    const cityEl = dialog.querySelector('#details-city');
    const dateEl = dialog.querySelector('#details-date');
    const mainTempEl = dialog.querySelector('#details-main-temp');
    const statsEl = dialog.querySelector('#details-stats');
    const hoursEl = dialog.querySelector('#details-hours');
    if(cityEl) cityEl.textContent = city || '';
    if(dateEl) dateEl.textContent = new Date(day.datetime).toLocaleDateString(undefined,{weekday:'long', month:'short', day:'numeric'});
    if(mainTempEl) mainTempEl.textContent = `High: ${fmtTemp(day.tempmax)}  •  Low: ${fmtTemp(day.tempmin)}  •  Avg: ${fmtTemp(day.temp)}`;

    // stats
    if(statsEl){
        statsEl.innerHTML = `
            <div><strong>Sunrise:</strong> ${day.sunrise || 'N/A'}</div>
            <div><strong>Sunset:</strong> ${day.sunset || 'N/A'}</div>
            <div><strong>UV Index:</strong> ${day.uvindex ?? 'N/A'}</div>
            <div><strong>Precip:</strong> ${fmtPrecip(day.precip ?? 0)} (${day.precipprob ?? 0}% chance)</div>
            <div><strong>Wind:</strong> ${fmtSpeed(day.windspeed ?? 0)} (gusts ${fmtSpeed(day.windgust ?? day.windspeed ?? 0)})</div>
            <div><strong>Pressure:</strong> ${day.pressure ?? 'N/A'} hPa</div>
            <div><strong>Visibility:</strong> ${fmtDistance(day.visibility ?? 0)}</div>
            <div><strong>Humidity:</strong> ${Math.round(day.humidity ?? 0)}%</div>
            <div><strong>Dew Point:</strong> ${fmtTemp(day.dew ?? 0)}</div>
            <div><strong>Cloud Cover:</strong> ${Math.round(day.cloudcover ?? 0)}%</div>
        `;
    }

    // hours
    if(hoursEl){
        const hours = day.hours || [];
        hoursEl.innerHTML = hours.map(h=>{
            const t = h.datetimeEpoch ? new Date(h.datetimeEpoch*1000).toLocaleTimeString(undefined,{hour:'2-digit', minute:'2-digit'}) : h.datetime;
            const ic = iconMap[h.icon] || '🌤️';
            return `
                <div class="min-w-[88px] p-2 bg-gray-100 text-black rounded-lg flex flex-col items-center gap-1">
                    <div class="text-xs">${t}</div>
                    <div class="text-xl">${ic}</div>
                    <div class="text-sm">${fmtTemp(h.temp)}</div>
                    <div class="text-xs opacity-80">${h.conditions || ''}</div>
                </div>
            `;
        }).join('');
    }

    // close handler
    const closeBtn = dialog.querySelector('#details-close');
    if(closeBtn){ closeBtn.onclick = ()=> dialog.close(); }
    dialog.showModal();
}