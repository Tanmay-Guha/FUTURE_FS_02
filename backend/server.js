require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

app.get('/api/weather', async (req, res) => {
    try {
        const { city } = req.query;
        if (!city) {
            return res.status(400).json({ error: 'City parameter is required' });
        }

        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${OPENWEATHER_API_KEY}`
        );
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching weather:', error.message);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

app.get('/api/forecast', async (req, res) => {
    try {
        const { city } = req.query;
        if (!city) {
            return res.status(400).json({ error: 'City parameter is required' });
        }

        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${OPENWEATHER_API_KEY}`
        );
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching forecast:', error.message);
        res.status(500).json({ error: 'Failed to fetch forecast data' });
    }
});

app.get('/api/weather/coordinates', async (req, res) => {
    try {
        const { lat, lon } = req.query;
        if (!lat || !lon) {
            return res.status(400).json({ error: 'Latitude and longitude parameters are required' });
        }

        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`
        );
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching weather by coordinates:', error.message);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});