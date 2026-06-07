import React, { useState, useEffect } from 'react';

interface Post {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    date: string;
}

interface ApiResponse {
    success: boolean;
    count: number;
    data: Post[];
    meta?: {
        warning?: string;
        errorDetails?: string;
    };
}

export default function App() {
    // Session & Data States
    const [token, setToken] = useState<string | null>(localStorage.getItem('vault_jwt'));
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    // Defensive Error Boundary States
    const [systemWarning, setSystemWarning] = useState<string | null>(null);
    const [technicalDetails, setTechnicalDetails] = useState<string | null>(null);

    // Login Form States
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState<string | null>(null);

    // Trigger login handshake
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError(null);

        try {
            const res = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                localStorage.setItem('vault_jwt', data.token);
                setToken(data.token);
            } else {
                setAuthError(data.meta?.errorDetails || 'Invalid credentials.');
            }
        } catch {
            setAuthError('Unable to connect to authentication gateway.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('vault_jwt');
        setToken(null);
        setPosts([]);
        setSystemWarning(null);
        setTechnicalDetails(null);
    };

    // SECURE AUTHORIZED NETWORK COUPLING PIPELINE
    useEffect(() => {
        if (!token) return;

        const fetchProtectedPosts = async () => {
            setLoading(true);
            setSystemWarning(null);
            setTechnicalDetails(null);

            try {
                const res = await fetch('http://localhost:3001/api/posts', {
                    headers: {
                        // Passing the signed token configuration signature down the wire
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data: ApiResponse = await res.json();

                if (res.ok && data.success) {
                    setPosts(data.data);
                } else {
                    // Captures normalized defensive warnings sent from the middleware layer
                    setSystemWarning(data.meta?.warning || 'Failed to sync content nodes.');
                    setTechnicalDetails(data.meta?.errorDetails || `HTTP Error Code: ${res.status}`);
                }
            } catch (err) {
                setSystemWarning('Network failure trying to contact the secure middleware proxy.');
                setTechnicalDetails(err instanceof Error ? err.message : 'Unknown link drop.');
            } finally {
                setLoading(false);
            }
        };

        fetchProtectedPosts();
    }, [token]);

    // UNAUTHENTICATED GATEWAY VIEW
    if (!token) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', fontFamily: 'sans-serif' }}>
                <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', width: '100%', maxWidth: '400px' }}>
                    <h2 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Decoupled Monorepo</h2>
                    <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '14px' }}>Sign in to query the protected API gateway tier.</p>

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px', fontWeight: 600, color: '#475569' }}>Username</label>
                            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} required />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px', fontWeight: 600, color: '#475569' }}>Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="password123" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} required />
                        </div>

                        {authError && (
                            <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#991b1b', fontSize: '13px', marginBottom: '1rem' }}>
                                {authError}
                            </div>
                        )}

                        <button type="submit" style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                            Authenticate Session
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // AUTHENTICATED DASHBOARD PORTAL
    return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#0f172a' }}>Headless Content Workspace</h1>
                    <span style={{ fontSize: '12px', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Session Active</span>
                </div>
                <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                    Disconnect
                </button>
            </div>

            {/* Defensive Infrastructure Warning System */}
            {systemWarning && (
                <div style={{ backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', padding: '1rem', borderRadius: '4px', marginBottom: '2rem' }}>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: '#b45309' }}>System Status Note</h4>
                    <p style={{ margin: 0, color: '#78350f', fontSize: '14px' }}>{systemWarning}</p>
                    {technicalDetails && (
                        <code style={{ display: 'block', marginTop: '0.5rem', fontSize: '12px', color: '#92400e', background: '#fef3c7', padding: '4px' }}>
                            Diagnostics: {technicalDetails}
                        </code>
                    )}
                </div>
            )}

            {/* Main Data Render Frame */}
            <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '2rem' }}>
                <h3 style={{ marginTop: 0, borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem', color: '#1e293b' }}>Aggregated Node Graph Contents</h3>
                {loading ? (
                    <p style={{ color: '#64748b' }}>Evaluating secure serverless data channels...</p>
                ) : posts.length === 0 ? (
                    <div style={{ padding: '1.5rem 0', color: '#64748b', fontStyle: 'italic' }}>
                        No Content Nodes Active: The authorization pipeline is fully operational, but upstream providers are responding with zero data records.
                    </div>
                ) : (
                    <div>
                        {posts.map(post => (
                            <div key={post.id} style={{ borderBottom: '1px solid #f1f5f9', padding: '1rem 0' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>{post.title}</h4>
                                <div style={{ color: '#475569', fontSize: '14px' }} dangerouslySetInnerHTML={{ __html: post.content }} />
                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Published: {new Date(post.date).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}