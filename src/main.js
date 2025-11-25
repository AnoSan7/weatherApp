let getWeather=async(city)=>{
    let response=await fetch(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${city}?unitGroup=us&key=PJWSS4TLJKSKT2Y62AGZG9EJ5&contentType=json`);
    if(!response.ok){
        return null;
    }
    let data=await response.json();
    return data;
}

function changeCity(newcity){
    return newcity.charAt(0).toUpperCase()+newcity.slice(1).toLowerCase();
}

const searchForm=document.querySelector("#search-form");
const cityInput=document.querySelector("#city-input");
const metricRadio=document.querySelector("#metric");
const loadingDialog=document.querySelector("#loading-dialog");

searchForm.addEventListener("submit",async (e)=>{
    e.preventDefault();
    let city=cityInput.value;
    let city1=changeCity(city);
    toggleLoading(true);
    let data=await getWeather(city1);
    toggleLoading(false);
    renderWeather(data);
});

function toggleLoading(show){
    if(show){
        loadingDialog.showModal();
    }
    else{
        loadingDialog.close();
    }
}

function renderWeather(data){
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
        if(errorMessage.classList.contains("hidden")){
            errorMessage.classList.remove("hidden");
        }
        if(!elements.weatherInfo.classList.contains("hidden")){
            elements.weatherInfo.classList.add("hidden");
        }
        return;
    }
    if(!errorMessage.classList.contains("hidden")){
        errorMessage.classList.add("hidden");
    }
    if(elements.weatherInfo.classList.contains("hidden")){
        elements.weatherInfo.classList.remove("hidden");
    }
    elements.weatherCondition.textContent=data.days[0].conditions;
    elements.cityName.textContent=data.resolvedAddress;
    let currTemp=data.days[0].temp;
    let feelsLikeTemp=data.days[0].feelslike;
    if(metricRadio.checked){
        currTemp=((currTemp-32)*5/9).toFixed(1);
        feelsLikeTemp=((feelsLikeTemp-32)*5/9).toFixed(1);
        elements.temperature.textContent=`Temperature: ${currTemp}°C`;
        elements.feelsLike.textContent=`Feels Like: ${feelsLikeTemp}°C`;
    }
    else{
        elements.temperature.textContent=`Temperature: ${currTemp}°F`;
        elements.feelsLike.textContent=`Feels Like: ${feelsLikeTemp}°F`;
    }
    elements.description.textContent=`Description: ${data.days[0].conditions}`;
    elements.humidity.textContent=`Humidity: ${data.days[0].humidity}%`;
    elements.windSpeed.textContent=`Wind Speed: ${data.days[0].windspeed} mph`;
}