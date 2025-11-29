require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const OMDB_API_KEY = process.env.OMDB_API_KEY; // Change to OMDB

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const OMDB_BASE_URL = 'http://www.omdbapi.com/';

// Home route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Search movies - OMDb style
app.get('/api/movies/search', async (req, res) => {
    try {
        const query = req.query.q;
        const page = req.query.page || 1;
        
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const response = await axios.get(
            `${OMDB_BASE_URL}?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}&page=${page}&type=movie`
        );
        
        if (response.data.Response === 'False') {
            return res.status(404).json({ 
                error: 'No movies found',
                message: response.data.Error 
            });
        }
        
        console.log(`Found ${response.data.Search.length} movies for: "${query}"`);
        res.json(response.data);
    } catch (error) {
        console.error('Search error:', error.message);
        res.status(500).json({ 
            error: 'Search failed', 
            details: error.message 
        });
    }
});

// Get movie details by ID
app.get('/api/movie/:id', async (req, res) => {
    try {
        const movieId = req.params.id;
        const response = await axios.get(
            `${OMDB_BASE_URL}?apikey=${OMDB_API_KEY}&i=${movieId}&plot=full`
        );
        
        if (response.data.Response === 'False') {
            return res.status(404).json({ 
                error: 'Movie not found',
                message: response.data.Error 
            });
        }
        
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching movie details:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch movie details',
            details: error.message 
        });
    }
});

// Get popular movies (we'll simulate with search)
app.get('/api/movies/popular', async (req, res) => {
    try {
        // Search for popular movies to simulate "popular"
        const response = await axios.get(
            `${OMDB_BASE_URL}?apikey=${OMDB_API_KEY}&s=avengers&type=movie`
        );
        
        if (response.data.Response === 'False') {
            return res.status(404).json({ 
                error: 'No popular movies found',
                message: response.data.Error 
            });
        }
        
        console.log(`Fetched ${response.data.Search.length} popular movies`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching popular movies:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch popular movies',
            details: error.message 
        });
    }
});

// Get movies by year
app.get('/api/movies/year/:year', async (req, res) => {
    try {
        const year = req.params.year;
        const response = await axios.get(
            `${OMDB_BASE_URL}?apikey=${OMDB_API_KEY}&s=movie&y=${year}&type=movie`
        );
        
        if (response.data.Response === 'False') {
            return res.status(404).json({ 
                error: 'No movies found for this year',
                message: response.data.Error 
            });
        }
        
        res.json(response.data);
    } catch (error) {
        console.error('Year filter error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch movies by year',
            details: error.message 
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Movie Discovery API (OMDb)'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Route not found'
    });
});

app.listen(PORT, () => {
    console.log(`🎬 Movie Discovery Server running on port ${PORT}`);
    console.log(`📍 Local: http://localhost:${PORT}`);
    console.log(`🔑 OMDb API Key: ${OMDB_API_KEY ? 'Loaded ✅' : 'Missing ❌'}`);
});