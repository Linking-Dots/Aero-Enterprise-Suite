import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';

const host = 'aero-enterprise-suite.com'; 
const certPath = 'D:/laragon/etc/ssl/laragon.crt'; 
const keyPath = 'D:/laragon/etc/ssl/laragon.key';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
        tailwindcss()
    ],
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
    server: { 
        host, 
        hmr: { host },
        https: {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
        },
        cors: {
            origin: 'https://aero-enterprise-suite.com',
            credentials: true,
        },
    },
});
