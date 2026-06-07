import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3001;
const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'http://localhost:8080/wp-json';

app.use(cors());
app.use(express.json());

// Strict Contract Interfaces
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

// 1. Defensive Authorization Gate (Simulating an AWS API Gateway Custom Authorizer)
const validateBearerToken = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            count: 0,
            data: [],
            meta: {
                warning: "Access Denied. Authorization Header missing or structurally malformed.",
                errorDetails: "Missing 'Bearer <token>' pattern."
            }
        });
        return; // Cut off execution immediately; do not forward request
    }

    const token = authHeader.split(' ')[1];

    // For this local simulation, we accept a standardized mock token pattern
    if (token !== 'mock-secure-jwt-payload-token') {
        res.status(403).json({
            success: false,
            count: 0,
            data: [],
            meta: {
                warning: "Forbidden. The provided credential signature is invalid or expired.",
                errorDetails: "Signature verification check failed."
            }
        });
        return;
    }

    next(); // Token verified successfully, proceed to the protected route handler
};

// 2. Mock Authentication Issue Endpoint
app.post('/api/login', (req: Request, res: Response) => {
    const { username, password } = req.body;

    // Simple static criteria checking for local evaluation
    if (username === 'admin' && password === 'password123') {
        return res.status(200).json({
            success: true,
            token: 'mock-secure-jwt-payload-token',
            user: { uid: 'usr_9831', role: 'ContentManager' }
        });
    }

    return res.status(401).json({
        success: false,
        meta: {
            warning: "Authentication Failed.",
            errorDetails: "Invalid configuration credentials supplied."
        }
    });
});

// 3. Protected Content Aggregation Endpoint (Now guarded by token confirmation)
app.get('/api/posts', validateBearerToken, async (req: Request, res: Response) => {
    try {
        const response = await axios.get<unknown>(`${WORDPRESS_API_URL}/wp/v2/posts?_embed`, {
            timeout: 5000
        });

        if (!Array.isArray(response.data)) {
            throw new Error(`Upstream CMS returned an invalid payload structure (Expected Array, received ${typeof response.data}).`);
        }

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
        console.error(`[Guarded API Bridge Handled]: ${errorMessage}`);

        return res.status(200).json({
            success: false,
            count: 0,
            data: [],
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