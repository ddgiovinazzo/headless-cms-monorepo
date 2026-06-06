import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    // Force the server root path to anchor to the local sub-app context
    root: resolve(__dirname),
    server: {
        host: '0.0.0.0',
        port: 5173,
        watch: {
            usePolling: true // Ensures file changes on your Mac sync reliably with Docker
        }
    }
});