export interface Post {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    date: string;
}

export interface ApiResponse {
    success: boolean;
    count: number;
    data: Post[];
    meta?: {
        warning?: string;
        errorDetails?: string;
    };
}