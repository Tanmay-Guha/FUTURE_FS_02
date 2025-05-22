// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const cityName = document.getElementById('city-name');
const currentDate = document.getElementById('current-date');
const temperature = document.getElementById('temperature');
const weatherDescription = document.getElementById('weather-description');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');
const pressure = document.getElementById('pressure');
const forecastContainer = document.getElementById('forecast-container');
const favoritesList = document.getElementById('favorites-list');

// State
let favorites = JSON.parse(localStorage.getItem('weatherFavorites')) || [];

// Initialize
updateCurrentDate();
updateFavoritesDisplay();

// Event Listeners
searchBtn.addEventListener('click', searchWeather);
locationBtn.addEventListener('click', getLocationWeather);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchWeather();
});

// Functions
function updateCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDate.textContent = now.toLocaleDateString('en-US', options);
}

function updateFavoritesDisplay() {
    favoritesList.innerHTML = '';
    
    if (favorites.length === 0) {
        favoritesList.innerHTML = '<div class="no-favorites">No favorite cities yet</div>';
        return;
    }
    
    favorites.forEach(city => {
        const favoriteItem = document.createElement('div');
        favoriteItem.className = 'favorite-item';
        favoriteItem.innerHTML = `
            <span>${city}</span>
            <button class="remove-btn" data-city="${city}"><i class="fas fa-times"></i></button>
        `;
        
        favoriteItem.addEventListener('click', (e) => {
            if (!e.target.closest('.remove-btn')) {
                cityInput.value = city;
                searchWeather();
            }
        });
        
        favoritesList.appendChild(favoriteItem);
    });
    
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const cityToRemove = btn.getAttribute('data-city');
            removeFromFavorites(cityToRemove);
        });
    });
}

function addToFavorites(city) {
    if (!favorites.includes(city)) {
        favorites.push(city);
        localStorage.setItem('weatherFavorites', JSON.stringify(favorites));
        updateFavoritesDisplay();
        showMessage(`${city} added to favorites!`);
    }
}

function removeFromFavorites(city) {
    favorites = favorites.filter(fav => fav !== city);
    localStorage.setItem('weatherFavorites', JSON.stringify(favorites));
    updateFavoritesDisplay();
    showMessage(`${city} removed from favorites`);
}

function showMessage(message) {
    const msgEl = document.createElement('div');
    msgEl.className = 'status-message';
    msgEl.textContent = message;
    document.body.appendChild(msgEl);
    
    gsap.fromTo(msgEl,
        { opacity: 0, y: 20 },
        {
            opacity: 1,
            y: 0,
            duration: 0.3,
            onComplete: () => {
                setTimeout(() => {
                    gsap.to(msgEl, {
                        opacity: 0,
                        y: -20,
                        duration: 0.3,
                        onComplete: () => msgEl.remove()
                    });
                }, 2000);
            }
        }
    );
}

async function searchWeather() {
    const city = cityInput.value.trim();
    if (!city) {
        showError('Please enter a city name');
        return;
    }

    startLoading();

    try {
        const weatherData = await fetchWeatherData(city);
        displayWeatherData(weatherData.current, weatherData.forecast);
        
        gsap.from('.weather-card', {
            duration: 0.5,
            y: 20,
            opacity: 0,
            ease: 'power2.out'
        });
    } catch (error) {
        showError(error.message);
    } finally {
        stopLoading();
    }
}



// Update fetchWeatherData function
async function fetchWeatherData(city) {
    try {
        const [currentRes, forecastRes] = await Promise.all([
            fetch(`http://localhost:3001/api/weather?city=${city}`),
            fetch(`http://localhost:3001/api/forecast?city=${city}`)
        ]);

        if (!currentRes.ok) throw new Error('City not found');
        if (!forecastRes.ok) throw new Error('Forecast data unavailable');

        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();

        return { current: currentData, forecast: forecastData };
    } catch (error) {
        throw new Error('Failed to fetch weather data: ' + error.message);
    }
}

// Update fetchWeatherByCoords function
async function fetchWeatherByCoords(lat, lon) {
    try {
        const response = await fetch(`http://localhost:3001/api/weather/coordinates?lat=${lat}&lon=${lon}`);
        if (!response.ok) throw new Error('Location weather not found');
        
        const currentData = await response.json();
        
        // Get forecast using city name from current data
        const forecastRes = await fetch(`http://localhost:3001/api/forecast?city=${currentData.name}`);
        if (!forecastRes.ok) throw new Error('Forecast data unavailable');
        
        const forecastData = await forecastRes.json();

        return { current: currentData, forecast: forecastData };
    } catch (error) {
        throw new Error('Failed to fetch weather data: ' + error.message);
    }
}
function displayWeatherData(currentData, forecastData) {
    const city = currentData.name;
    cityName.textContent = `${city}, ${currentData.sys.country}`;
    
    // Remove any existing favorite button
    const existingBtn = document.querySelector('.add-favorite-btn');
    if (existingBtn) existingBtn.remove();
    
    // Add favorite button
    const addFavoriteBtn = document.createElement('button');
    addFavoriteBtn.className = 'add-favorite-btn';
    
    if (favorites.includes(city)) {
        addFavoriteBtn.innerHTML = '<i class="fas fa-star"></i> Favorited';
        addFavoriteBtn.style.background = 'rgba(67, 97, 238, 0.2)';
    } else {
        addFavoriteBtn.innerHTML = '<i class="far fa-star"></i> Add to Favorites';
    }
    
    addFavoriteBtn.onclick = () => {
        if (!favorites.includes(city)) {
            addToFavorites(city);
            addFavoriteBtn.innerHTML = '<i class="fas fa-star"></i> Favorited';
            addFavoriteBtn.style.background = 'rgba(67, 97, 238, 0.2)';
        }
    };
    
    cityName.insertAdjacentElement('afterend', addFavoriteBtn);
    
    temperature.innerHTML = `${Math.round(currentData.main.temp)}<span>°C</span>`;
    weatherDescription.textContent = currentData.weather[0].description;
    humidity.textContent = `${currentData.main.humidity}%`;
    wind.textContent = `${currentData.wind.speed} m/s`;
    pressure.textContent = `${currentData.main.pressure} hPa`;

    displayForecast(forecastData);
    updateBackground(currentData.weather[0].main);
}

function displayForecast(forecastData) {
    forecastContainer.innerHTML = '';

    const dailyForecasts = [];
    const daysAdded = new Set();
    
    forecastData.list.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        if (date.getHours() >= 11 && date.getHours() <= 14 && !daysAdded.has(day)) {
            dailyForecasts.push(forecast);
            daysAdded.add(day);
        }
    });

    const forecastsToShow = dailyForecasts.slice(0, 5);

    if (forecastsToShow.length === 0) {
        forecastContainer.innerHTML = `
            <div class="no-forecast">
                <i class="fas fa-cloud-sun"></i>
                <p>Forecast data not available</p>
            </div>
        `;
        return;
    }

    forecastsToShow.forEach((forecast, index) => {
        const date = new Date(forecast.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        forecastCard.style.animationDelay = `${index * 0.1}s`;
        
        forecastCard.innerHTML = `
            <div class="forecast-day">${day}</div>
            <div class="forecast-date">${dateStr}</div>
            <div class="forecast-description">${forecast.weather[0].description}</div>
            <div class="forecast-temp">
                <span class="max-temp">${Math.round(forecast.main.temp_max)}°</span>
                <span class="min-temp">${Math.round(forecast.main.temp_min)}°</span>
            </div>
        `;

        forecastContainer.appendChild(forecastCard);
    });
}

function updateBackground(weatherCondition) {
    const background = document.querySelector('.background-animation');
    let gradient;

    switch (weatherCondition.toLowerCase()) {
        case 'clear':
            gradient = 'linear-gradient(135deg, #56ccf2 0%, #2f80ed 100%)';
            break;
        case 'clouds':
            gradient = 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)';
            break;
        case 'rain':
            gradient = 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)';
            break;
        case 'snow':
            gradient = 'linear-gradient(135deg, #e6dada 0%, #274046 100%)';
            break;
        case 'thunderstorm':
            gradient = 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)';
            break;
        case 'drizzle':
            gradient = 'linear-gradient(135deg, #6190e8 0%, #a7bfe8 100%)';
            break;
        case 'mist':
        case 'fog':
        case 'haze':
            gradient = 'linear-gradient(135deg, #c9d6ff 0%, #e2e2e2 100%)';
            break;
        default:
            gradient = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
    }

    gsap.to(background, {
        duration: 1.5,
        background: gradient,
        ease: 'power2.inOut'
    });
}

function getLocationWeather() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
    }

    startLoading();

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const weatherData = await fetchWeatherByCoords(latitude, longitude);
                displayWeatherData(weatherData.current, weatherData.forecast);
                cityInput.value = weatherData.current.name;
            } catch (error) {
                showError('Error fetching weather for your location');
            } finally {
                stopLoading();
            }
        },
        (error) => {
            stopLoading();
            showError('Unable to retrieve your location: ' + error.message);
        }
    );
}

async function fetchWeatherByCoords(lat, lon) {
    try {
        const [currentRes, forecastRes] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`)
        ]);

        if (!currentRes.ok) throw new Error('Location weather not found');
        if (!forecastRes.ok) throw new Error('Forecast data unavailable');

        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();

        return { current: currentData, forecast: forecastData };
    } catch (error) {
        throw new Error('Failed to fetch weather data: ' + error.message);
    }
}

function showError(message) {
    let errorEl = document.querySelector('.error-message');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        document.body.appendChild(errorEl);
    }

    errorEl.textContent = message;
    
    gsap.fromTo(errorEl, 
        { opacity: 0, y: -20 },
        { 
            opacity: 1, 
            y: 0,
            duration: 0.3,
            onComplete: () => {
                gsap.to(errorEl, {
                    opacity: 0,
                    y: -20,
                    delay: 3,
                    duration: 0.3,
                    onComplete: () => errorEl.remove()
                });
            }
        }
    );
}

function startLoading() {
    let spinner = document.querySelector('.loading-spinner');
    if (!spinner) {
        spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(spinner);
    }
}

function stopLoading() {
    const spinner = document.querySelector('.loading-spinner');
    if (spinner) {
        gsap.to(spinner, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => spinner.remove()
        });
    }
}

// Initialize with default city
window.addEventListener('load', () => {
    gsap.from('.container', {
        duration: 1,
        opacity: 0,
        y: 50,
        ease: 'power2.out'
    });
    
    fetchWeatherData('Kolkata')
        .then(data => displayWeatherData(data.current, data.forecast))
        .catch(error => console.error('Initial load error:', error));
});