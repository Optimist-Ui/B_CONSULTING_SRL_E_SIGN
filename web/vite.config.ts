// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'pdfjs-worker': ['pdfjs-dist/build/pdf.worker.min.mjs'],
                },
            },
        },
    },
    server: {
        cors: true,
    },
});