import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Button, 
  IconButton, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Search as SearchIcon, 
  MyLocation as LocationIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

const WeatherDashboard = () => {
  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(
    JSON.parse(localStorage.getItem('weatherFavorites')) || []
  );

  const fetchWeatherData = async (cityName) => {
    setLoading(true);
    setError(null);
    try {
      const [current, forecast] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/weather?city=${cityName}`),
        axios.get(`${API_BASE_URL}/api/forecast?city=${cityName}`)
      ]);
      setWeatherData({
        current: current.data,
        forecast: forecast.data
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const getLocationWeather = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await axios.get(
              `${API_BASE_URL}/api/weather/coordinates?lat=${latitude}&lon=${longitude}`
            );
            setWeatherData(response.data);
            setCity(response.data.current.name || 'Your Location');
          } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch location weather');
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          setError('Geolocation error: ' + err.message);
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  const toggleFavorite = () => {
    if (!weatherData?.current?.name) return;
    
    const cityName = weatherData.current.name;
    const newFavorites = favorites.includes(cityName)
      ? favorites.filter(fav => fav !== cityName)
      : [...favorites, cityName];
    
    setFavorites(newFavorites);
    localStorage.setItem('weatherFavorites', JSON.stringify(newFavorites));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (city.trim()) {
      fetchWeatherData(city);
    }
  };

  const handleFavoriteClick = (favCity) => {
    setCity(favCity);
    fetchWeatherData(favCity);
  };

  return (
    <div className="weather-dashboard">
      <Typography variant="h3" gutterBottom>
        Weather Dashboard
      </Typography>

      <form onSubmit={handleSearch} className="search-form">
        <TextField
          label="Search city"
          variant="outlined"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          fullWidth
        />
        <Button 
          type="submit" 
          variant="contained" 
          color="primary"
          startIcon={<SearchIcon />}
        >
          Search
        </Button>
        <IconButton
          color="primary"
          onClick={getLocationWeather}
          title="Use my location"
        >
          <LocationIcon />
        </IconButton>
      </form>

      {favorites.length > 0 && (
        <div className="favorites-section">
          <Typography variant="h6">Favorite Cities</Typography>
          <div className="favorites-list">
            {favorites.map((fav) => (
              <Button
                key={fav}
                onClick={() => handleFavoriteClick(fav)}
                startIcon={<StarIcon color="primary" />}
              >
                {fav}
              </Button>
            ))}
          </div>
        </div>
      )}

      {loading && <CircularProgress />}

      {error && (
        <Snackbar open autoHideDuration={6000} onClose={() => setError(null)}>
          <Alert severity="error">{error}</Alert>
        </Snackbar>
      )}

      {weatherData?.current && (
        <Card className="weather-card">
          <CardContent>
            <div className="weather-header">
              <Typography variant="h4">
                {weatherData.current.name}, {weatherData.current.sys?.country}
              </Typography>
              <IconButton onClick={toggleFavorite}>
                {favorites.includes(weatherData.current.name) ? (
                  <StarIcon color="primary" />
                ) : (
                  <StarBorderIcon color="primary" />
                )}
              </IconButton>
              <Typography color="textSecondary">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Typography>
            </div>

            <div className="weather-main">
              <Typography variant="h2">
                {Math.round(weatherData.current.main?.temp)}°C
              </Typography>
              <Typography variant="h5" textTransform="capitalize">
                {weatherData.current.weather?.[0]?.description}
              </Typography>
            </div>

            <Grid container spacing={2} className="weather-details">
              <Grid item xs={4}>
                <Typography>Humidity</Typography>
                <Typography variant="h6">
                  {weatherData.current.main?.humidity}%
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography>Wind</Typography>
                <Typography variant="h6">
                  {weatherData.current.wind?.speed} m/s
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography>Pressure</Typography>
                <Typography variant="h6">
                  {weatherData.current.main?.pressure} hPa
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {weatherData?.forecast && (
        <div className="forecast-section">
          <Typography variant="h5">5-Day Forecast</Typography>
          <Grid container spacing={2}>
            {weatherData.forecast.list
              .filter((_, index) => index % 8 === 0) // Daily forecast
              .slice(0, 5)
              .map((day) => (
                <Grid item xs={12} sm={6} md={4} lg={2} key={day.dt}>
                  <Card className="forecast-card">
                    <CardContent>
                      <Typography>
                        {new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {new Date(day.dt * 1000).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Typography>
                      <Typography textTransform="capitalize">
                        {day.weather?.[0]?.description}
                      </Typography>
                      <div className="forecast-temp">
                        <span className="max-temp">
                          {Math.round(day.main?.temp_max)}°
                        </span>
                        <span className="min-temp">
                          {Math.round(day.main?.temp_min)}°
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </div>
      )}
    </div>
  );
};

export default WeatherDashboard;