import express, { Request, Response } from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3001;
const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'http://localhost:8080/wp-json';

app.use(cors());
app.use(express.json());

// 1. Define the internal schema used by WordPress for string-rendered fields
interface WPRenderedString {
    rendered: string;
    protected?: boolean;
}

// 2. Define the structural contract for incoming raw third-party content
interface WordPressRawPost {
    id: number;
    date: string;
    slug: string;
    title: WPRenderedString;
    content: WPRenderedString;
    excerpt: WPRenderedString;
    status: string;
    [key: string]: unknown; // Gracefully allows unmapped backend properties without using 'any'
}

// 3. Define the strict outgoing contract guaranteed to our React client
interface TransformedPost {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    date: string;
}

// Main execution controller
app.get('/api/posts', async (req: Request, res: Response) => {
    try {
        // Query the core headless CMS layer with a standard network timeout policy
        const response = await axios.get<WordPressRawPost[]>(`${WORDPRESS_API_URL}/wp/v2/posts?_embed`, {
            timeout: 5000
        });

        // Pure serialization mapping using explicit structures 
        const serializedPosts: TransformedPost[] = response.data.map((post: WordPressRawPost) => ({
            id: post.id,
            title: post.title.rendered || 'Untitled Post',
            slug: post.slug || '',
            content: post.content.rendered || '',
            excerpt: post.excerpt.rendered || '',
            date: post.date || new Date().toISOString()
        }));

        return res.status(200).json({
            success: true,
            count: serializedPosts.length,
            data: serializedPosts
        });

    } catch (error: unknown) {
        // Defensive handling for runtime network or server failures[cite: 1]
        const errorMessage = error instanceof Error ? error.message : 'Unknown network failure';
        console.error(`[API Bridge Error]: ${errorMessage}`);

        return res.status(200).json({
            success: false,
            count: 0,
            data: [], // Safe client override prevents UI from throwing runtime exceptions[cite: 1]
            meta: {
                warning: "Upstream CMS service layer unavailable. Serving safe fallback array.",
                errorDetails: errorMessage
            }
        });
    }
});

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', runtime: 'NodeJS 20' });
});

app.listen(PORT, () => {
    console.log(`[API Middleman] Active local execution simulating Lambda on port ${PORT}`);
});