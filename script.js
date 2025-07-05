// API Configuration
const apiKey = '015e87c32d3e4643a5080911250507'; // Your WeatherAPI key
const baseUrl = 'https://api.weatherapi.com/v1';
let currentUnit = 'metric';

// DOM Elements
const searchBtn = document.getElementById('search-btn');
const locationInput = document.getElementById('location-input');
const darkModeToggle = document.getElementById('dark-mode-toggle');

// Nearby Ghanaian cities to show
const nearbyCities = [
    { name: "Kumasi", region: "Ashanti" },
    { name: "Tamale", region: "Northern" },
    { name: "Takoradi", region: "Western" },
    { name: "Cape Coast", region: "Central" }
];

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Load last searched city or default to Accra
    const lastCity = localStorage.getItem('lastCity') || 'Accra';
    locationInput.value = lastCity;
    fetchWeatherData(lastCity);
    
    // Load nearby locations
    createNearbyLocationCards();
    
    // Event Listeners
    searchBtn.addEventListener('click', searchLocation);
    locationInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchLocation();
    });
    
    darkModeToggle.addEventListener('change', toggleDarkMode);
    
    // Check for saved theme preference
    if (localStorage.getItem('darkMode') === 'false') {
        darkModeToggle.checked = false;
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
    }
});

// Search for a location
function searchLocation() {
    const city = locationInput.value.trim();
    if (city) {
        fetchWeatherData(city);
    } else {
        showError('Please enter a city name');
    }
}

// Fetch Weather Data
async function fetchWeatherData(city) {
    try {
        showLoading(true);
        
        const response = await fetch(
            `${baseUrl}/current.json?key=${apiKey}&q=${city}&aqi=no`
        );
        
        if (!response.ok) {
            throw new Error('City not found. Please try another location.');
        }
        
        const data = await response.json();
        displayWeatherData(data);
        
        // Save to localStorage
        localStorage.setItem('lastCity', city);
        
        // Fetch forecast
        fetchForecast(data.location.lat, data.location.lon);
        
    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

// Display Weather Data
function displayWeatherData(data) {
    // Current weather
    document.getElementById('city-name').textContent = data.location.name;
    document.getElementById('country').textContent = data.location.country;
    document.getElementById('current-temp').textContent = Math.round(data.current.temp_c);
    document.getElementById('weather-description').textContent = data.current.condition.text;
    
    // Weather icon
    const weatherIcon = document.getElementById('weather-icon');
    weatherIcon.src = `https:${data.current.condition.icon}`;
    weatherIcon.alt = data.current.condition.text;
    
    // Weather details
    document.getElementById('feels-like').textContent = `${Math.round(data.current.feelslike_c)}°C`;
    document.getElementById('humidity').textContent = `${data.current.humidity}%`;
    document.getElementById('wind-speed').textContent = `${Math.round(data.current.wind_kph)} km/h`;
    document.getElementById('pressure').textContent = `${data.current.pressure_mb} hPa`;
    
    // Update date and time
    updateDateTime(data.location.localtime);
    
    // Generate weather tips
    generateWeatherTips(data.current.condition.text, data.current.temp_c);
}

// Fetch Forecast Data
async function fetchForecast(lat, lon) {
    try {
        const response = await fetch(
            `${baseUrl}/forecast.json?key=${apiKey}&q=${lat},${lon}&days=5&aqi=no&alerts=no`
        );
        
        if (!response.ok) {
            throw new Error('Forecast data not available');
        }
        
        const data = await response.json();
        displayForecast(data.forecast.forecastday);
    } catch (error) {
        console.error('Error fetching forecast:', error);
        document.getElementById('forecast-container').innerHTML = 
            '<div class="loading-text">Forecast not available</div>';
    }
}

// Display Forecast Data with condition names and click functionality
function displayForecast(forecastDays) {
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = '';
    
    forecastDays.forEach((day, index) => {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const weatherCode = day.day.condition.code;
        const conditionText = day.day.condition.text;
        
        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        forecastCard.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <div class="forecast-icon">
                <i class="wi wi-owm-${getOWMCode(weatherCode)}"></i>
            </div>
            <div class="forecast-condition">${conditionText}</div>
            <div class="forecast-temp">
                <span class="max-temp">${Math.round(day.day.maxtemp_c)}°</span>
                <span class="min-temp">${Math.round(day.day.mintemp_c)}°</span>
            </div>
        `;
        
        // Add click event to show forecast details
        forecastCard.addEventListener('click', () => {
            showForecastDetails(day, date);
        });
        
        forecastContainer.appendChild(forecastCard);
        
        // Show first day's details by default
        if (index === 0) {
            showForecastDetails(day, date);
        }
    });
}

// Show detailed forecast when a day is clicked
function showForecastDetails(day, date) {
    const forecastDetails = document.getElementById('forecast-details');
    const dateString = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    forecastDetails.innerHTML = `
        <h3>${dateString}</h3>
        <div class="detail-row">
            <span class="detail-label">Condition</span>
            <span class="detail-value">${day.day.condition.text}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Max Temperature</span>
            <span class="detail-value">${Math.round(day.day.maxtemp_c)}°C</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Min Temperature</span>
            <span class="detail-value">${Math.round(day.day.mintemp_c)}°C</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Average Humidity</span>
            <span class="detail-value">${day.day.avghumidity}%</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Chance of Rain</span>
            <span class="detail-value">${day.day.daily_chance_of_rain}%</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Max Wind Speed</span>
            <span class="detail-value">${Math.round(day.day.maxwind_kph)} km/h</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">UV Index</span>
            <span class="detail-value">${day.day.uv}</span>
        </div>
    `;
    
    forecastDetails.classList.add('active');
}

// Create nearby location cards
function createNearbyLocationCards() {
    const nearbyContainer = document.getElementById('nearby-container');
    
    // Create cards for each nearby city
    nearbyCities.forEach(city => {
        const locationCard = document.createElement('div');
        locationCard.className = 'location-card';
        locationCard.innerHTML = `
            <h3>${city.name}</h3>
            <div class="location-temp">--°C</div>
            <i class="wi wi-day-cloudy"></i>
            <div class="location-desc">--</div>
        `;
        nearbyContainer.appendChild(locationCard);
        
        // Fetch weather data for this city
        fetchWeatherForNearbyLocation(city.name);
    });
}

// Fetch weather for a nearby location
async function fetchWeatherForNearbyLocation(city) {
    try {
        const response = await fetch(
            `${baseUrl}/current.json?key=${apiKey}&q=${city}&aqi=no`
        );
        
        if (!response.ok) {
            throw new Error('Weather data not available');
        }
        
        const data = await response.json();
        updateNearbyLocationCard(city, data);
    } catch (error) {
        console.error(`Error fetching weather for ${city}:`, error);
        updateNearbyLocationCard(city, null);
    }
}

// Update nearby location card with weather data
function updateNearbyLocationCard(city, data) {
    const locationCards = document.querySelectorAll('.location-card');
    locationCards.forEach(card => {
        if (card.textContent.includes(city)) {
            if (data) {
                const temp = Math.round(data.current.temp_c);
                const condition = data.current.condition.text;
                const iconCode = data.current.condition.code;
                
                card.innerHTML = `
                    <h3>${data.location.name}</h3>
                    <div class="location-temp">${temp}°C</div>
                    <i class="wi wi-owm-${getOWMCode(iconCode)}"></i>
                    <div class="location-desc">${condition}</div>
                `;
            } else {
                card.innerHTML = `
                    <h3>${city}</h3>
                    <div class="location-temp">--°C</div>
                    <i class="wi wi-na"></i>
                    <div class="location-desc">Data unavailable</div>
                `;
            }
            
            // Make card clickable to view this location
            card.addEventListener('click', () => {
                if (data) {
                    fetchWeatherData(data.location.name);
                    locationInput.value = data.location.name;
                }
            });
        }
    });
}

// Generate Weather Tips
function generateWeatherTips(weatherCondition, temperature) {
    const tipsContainer = document.getElementById('weather-tips');
    tipsContainer.innerHTML = '';
    
    // Create tips based on weather conditions
    const tips = [];
    
    // Temperature-based tips
    if (temperature < 10) {
        tips.push({
            icon: 'wi wi-snowflake-cold',
            title: 'Cold Weather',
            description: 'Wear multiple layers including a warm jacket, hat, and gloves.'
        });
        tips.push({
            icon: 'wi wi-thermometer-exterior',
            title: 'Frost Alert',
            description: 'Watch for icy surfaces when walking or driving.'
        });
    } else if (temperature > 30) {
        tips.push({
            icon: 'wi wi-hot',
            title: 'Heat Warning',
            description: 'Stay hydrated and avoid prolonged sun exposure.'
        });
        tips.push({
            icon: 'wi wi-sunscreen',
            title: 'Sun Protection',
            description: 'Apply sunscreen regularly and wear light clothing.'
        });
    } else {
        tips.push({
            icon: 'wi wi-thermometer',
            title: 'Mild Temperature',
            description: 'Dress in layers for changing conditions throughout the day.'
        });
    }
    
    // Weather condition tips
    const condition = weatherCondition.toLowerCase();
    if (condition.includes('rain')) {
        tips.push({
            icon: 'wi wi-rain',
            title: 'Rainy Conditions',
            description: 'Carry an umbrella and wear waterproof footwear.'
        });
    } 
    if (condition.includes('snow') || condition.includes('sleet')) {
        tips.push({
            icon: 'wi wi-snow',
            title: 'Snow Alert',
            description: 'Use winter tires and keep walkways clear.'
        });
    } 
    if (condition.includes('sunny') || condition.includes('clear')) {
        tips.push({
            icon: 'wi wi-day-sunny',
            title: 'Sunny Day',
            description: 'Great weather for outdoor activities!'
        });
    } 
    if (condition.includes('cloud')) {
        tips.push({
            icon: 'wi wi-cloudy',
            title: 'Cloudy Skies',
            description: 'UV rays can still penetrate clouds - consider sunscreen.'
        });
    } 
    if (condition.includes('thunder') || condition.includes('storm')) {
        tips.push({
            icon: 'wi wi-thunderstorm',
            title: 'Storm Warning',
            description: 'Avoid open areas and unplug electronic devices.'
        });
    }
    
    // Add general health tip
    tips.push({
        icon: 'wi wi-first-aid',
        title: 'Health Reminder',
        description: 'Check on elderly neighbors during extreme weather conditions.'
    });
    
    // Display the tips
    tips.forEach(tip => {
        const tipElement = document.createElement('div');
        tipElement.className = 'tip-item';
        tipElement.innerHTML = `
            <div class="tip-icon">
                <i class="${tip.icon}"></i>
            </div>
            <div class="tip-content">
                <div class="tip-title">${tip.title}</div>
                <div class="tip-description">${tip.description}</div>
            </div>
        `;
        tipsContainer.appendChild(tipElement);
    });
}

// Update Date and Time
function updateDateTime(localtime) {
    const date = new Date(localtime);
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    document.getElementById('date-time').textContent = date.toLocaleDateString('en-US', options);
}

// Toggle Dark Mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');
    localStorage.setItem('darkMode', darkModeToggle.checked);
}

// Show Loading State
function showLoading(isLoading) {
    const app = document.querySelector('.app');
    if (isLoading) {
        app.style.opacity = '0.7';
        app.style.pointerEvents = 'none';
    } else {
        app.style.opacity = '1';
        app.style.pointerEvents = 'auto';
    }
}

// Show Error Message
function showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    document.body.appendChild(errorElement);
    
    setTimeout(() => {
        errorElement.remove();
    }, 3000);
}

// Helper function to map WeatherAPI codes to OWM codes for icons
function getOWMCode(weatherCode) {
    // Simplified mapping - you may need to expand this
    const codeMap = {
        1000: 800, // Sunny/Clear
        1003: 801, // Partly cloudy
        1006: 802, // Cloudy
        1009: 804, // Overcast
        1030: 701, // Mist
        1063: 500, // Patchy rain
        1066: 600, // Patchy snow
        1069: 611, // Sleet
        1072: 300, // Freezing drizzle
        1087: 200, // Thundery outbreaks
        1114: 601, // Blowing snow
        1117: 602, // Blizzard
        1135: 741, // Fog
        1147: 741, // Freezing fog
        1150: 300, // Patchy light drizzle
        1153: 301, // Light drizzle
        1168: 302, // Freezing drizzle
        1171: 314, // Heavy freezing drizzle
        1180: 500, // Patchy light rain
        1183: 501, // Light rain
        1186: 502, // Moderate rain
        1189: 503, // Heavy rain
        1192: 504, // Light freezing rain
        1195: 511, // Heavy freezing rain
        1198: 611, // Light snow
        1201: 612, // Moderate snow
        1204: 613, // Heavy snow
        1207: 615, // Ice pellets
        1210: 600, // Patchy light snow
        1213: 601, // Light snow
        1216: 602, // Moderate snow
        1219: 603, // Heavy snow
        1222: 622, // Ice pellets
        1225: 622, // Heavy snow
        1237: 906, // Ice pellets
        1240: 520, // Light rain shower
        1243: 521, // Moderate rain shower
        1246: 522, // Torrential rain shower
        1249: 612, // Light sleet showers
        1252: 613, // Moderate sleet showers
        1255: 600, // Light snow showers
        1258: 601, // Moderate snow showers
        1261: 622, // Light showers of ice pellets
        1264: 622, // Moderate showers of ice pellets
        1273: 201, // Patchy light rain with thunder
        1276: 202, // Moderate rain with thunder
        1279: 230, // Patchy light snow with thunder
        1282: 232 // Moderate snow with thunder
    };
    
    return codeMap[weatherCode] || 800; // Default to clear sky
}

// Update weather data every 30 minutes
setInterval(() => {
    const currentCity = document.getElementById('city-name').textContent;
    if (currentCity && currentCity !== '--') {
        fetchWeatherData(currentCity);
    }
}, 30 * 60 * 1000);

// Update time every minute
setInterval(() => {
    const currentCity = document.getElementById('city-name').textContent;
    if (currentCity && currentCity !== '--') {
        const dateElement = document.getElementById('date-time');
        if (dateElement.textContent) {
            const timeString = dateElement.textContent.split('•')[1].trim();
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const formattedTime = `${hours}:${minutes} ${ampm}`;
            dateElement.textContent = dateElement.textContent.replace(timeString, formattedTime);
        }
    }
}, 60 * 1000);