import React, { useState, useEffect } from 'react';
import { Post, ApiResponse } from './types';

export default function App() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [systemWarning, setSystemWarning] = useState<string | null>(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    useEffect(() => {
        const fetchContent = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_URL}/api/posts`);

                if (!response.ok) {
                    throw new Error(`HTTP network error: ${response.status}`);
                }

                const payload: ApiResponse = await response.json();

                if (payload.success) {
                    setPosts(payload.data);
                } else {
                    // Fallback override path: backend error handled cleanly without crashing[cite: 1]
                    setPosts([]);
                    setSystemWarning(payload.meta?.warning || 'Unexpected content warning received.');
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Failed to establish connection to Middleman API.';
                setError(msg);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, [API_URL]);

    return (
        <div style={{ fontFamily: 'sans-serif', maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
            <header style={{ borderBottom: '2px solid #eaeaea', paddingBottom: '1rem', marginBottom: '2rem' }}>
                <h1>Decoupled Headless CMS Client</h1>
                <p style={{ color: '#666' }}>Architecture Pattern: React UI → Node Middleman → WordPress Core</p>
            </header>

            {/* Latency / Loading State */}
            {loading && <div style={{ padding: '2rem', textAlign: 'center', color: '#4a90e2' }}>Syncing with API Gateway...</div>}

            {/* Graceful Network Error Alert Boundary */}
            {error && (
                <div style={{ padding: '1rem', background: '#fff5f5', borderLeft: '4px solid #e53e3e', color: '#c53030', marginBottom: '1.5rem' }}>
                    <strong>Communication Error:</strong> {error}
                </div>
            )}

            {/* Upstream Degradation Warning Overlay */}
            {systemWarning && (
                <div style={{ padding: '1rem', background: '#fffaf0', borderLeft: '4px solid #dd6b20', color: '#dd6b20', marginBottom: '1.5rem' }}>
                    <strong>System Warning:</strong> {systemWarning}
                </div>
            )}

            {/* Content Rendering Block */}
            {!loading && posts.length === 0 && !error && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#718096', border: '1px dashed #cbd5e0' }}>
                    <h3>No Content Nodes Found</h3>
                    <p>The system is operational, but the upstream CMS has no active records.</p>
                </div>
            )}

            <main>
                {posts.map((post) => (
                    <article key={post.id} style={{ marginBottom: '2.5rem', borderBottom: '1px solid #edf2f7', paddingBottom: '1.5rem' }}>
                        <h2 style={{ color: '#2d3748', marginBottom: '0.5rem' }}>{post.title}</h2>
                        <small style={{ color: '#a0aec0' }}>Published: {new Date(post.date).toLocaleDateString()}</small>
                        <div
                            style={{ marginTop: '1rem', lineHeight: '1.6', color: '#4a5568' }}
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                    </article>
                ))}
            </main>
        </div>
    );
}