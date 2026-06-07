import express from 'express';
import cors from 'cors'; // 1. Import the CORS package
import { createClient } from 'redis';

const app = express();
const PORT = process.env.PORT || 3001;
const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL;

// 2. Enable CORS configuration for your Vite frontend development server
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true // Essential for when we pass official session tokens later
}));

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

async function startServer() {
    await redisClient.connect();
    console.log('Connected to Redis Cache Tier Successfully');

    app.use(express.json());

    // Example cached route: Fetching posts from Headless WordPress
    app.get('/api/posts', async (req, res) => {
        const cacheKey = 'wp:posts:all';

        try {
            // 1. Check Redis Cache
            const cachedPosts = await redisClient.get(cacheKey);
            if (cachedPosts) {
                console.log('Cache Hit! Serving from Redis...');
                return res.json(JSON.parse(cachedPosts));
            }

            // 2. Fetch from WordPress CMS
            console.log('Cache Miss! Fetching from WordPress CMS...');
            const response = await fetch(`${WORDPRESS_API_URL}/wp/v2/posts`);

            // NEW: If WordPress returns a 404, 403, or 500, forward that exact status to the client
            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                console.warn(`WordPress Upstream responded with status ${response.status}`);
                return res.status(response.status).json(errorPayload);
            }

            const data = await response.json();

            // 3. Save to Redis Cache if valid
            await redisClient.setEx(cacheKey, 300, JSON.stringify(data));

            return res.json(data);
        } catch (error) {
            console.error('Error fetching posts:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.listen(PORT, () => {
        console.log(`API Middleman listening on port ${PORT}`);
    });
}

startServer();