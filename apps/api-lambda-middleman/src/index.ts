import express, { Request, Response } from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3001;
const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'http://localhost:8080/wp-json';

app.use(cors());
app.use(express.json());

interface WPRenderedString {
    rendered: string;
    protected?: boolean;
}

interface WordPressRawPost {
    id: number;
    date: string;
    slug: string;
    title: WPRenderedString;
    content: WPRenderedString;
    excerpt: WPRenderedString;
    status: string;
    [key: string]: unknown;
}

interface TransformedPost {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    date: string;
}

app.get('/api/posts', async (req: Request, res: Response) => {
    try {
        // Query upstream CMS engine
        const response = await axios.get<unknown>(`${WORDPRESS_API_URL}/wp/v2/posts?_embed`, {
            timeout: 5000
        });

        // DEFENSIVE TYPE GUARD: Confirm payload matches expected collection contract[cite: 1]
        if (!Array.isArray(response.data)) {
            throw new Error(`Upstream CMS returned an invalid payload structure (Expected Array, received ${typeof response.data}).`);
        }

        // Explicit compilation mapping safely guarded by structural verification
        const serializedPosts: TransformedPost[] = (response.data as WordPressRawPost[]).map((post) => ({
            id: post.id,
            title: post.title?.rendered || 'Untitled Post',
            slug: post.slug || '',
            content: post.content?.rendered || '',
            excerpt: post.excerpt?.rendered || '',
            date: post.date || new Date().toISOString()
        }));

        return res.status(200).json({
            success: true,
            count: serializedPosts.length,
            data: serializedPosts
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown network failure';
        console.error(`[API Bridge Mitigation Handled]: ${errorMessage}`);

        return res.status(200).json({
            success: false,
            count: 0,
            data: [], // Perfect client-side fallback asset protection[cite: 1]
            meta: {
                warning: "Upstream CMS content schema unavailable. Supplying safe array fallback.",
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