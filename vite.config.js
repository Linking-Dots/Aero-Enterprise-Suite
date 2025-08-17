import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { createHtmlPlugin } from 'vite-plugin-html';
import { ViteMinifyPlugin } from 'vite-plugin-minify';
import path from 'path';

// Vite configuration
export default defineConfig({
    optimizeDeps: {
        exclude: ['styled-components'],
        include: [
            '@heroui/react',
            '@heroui/theme',
            '@mui/material',
            '@mui/icons-material',
            'framer-motion'
        ]
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react({
            jsxImportSource: '@emotion/react',
            babel: {
                plugins: ['@emotion/babel-plugin'],
            },
        }),
        createHtmlPlugin({
            minify: true, // Minify HTML output
        }),
        ViteMinifyPlugin(), // Additional minification
    ],
    server: {
        host: '127.0.0.1',
        port: 5173,
        hmr: {
            overlay: false
        },
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                secure: false,
            },
            '/login': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                secure: false,
            },
            '/register': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                secure: false,
            },
            '/check-user-type': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                secure: false,
            },
            '/check-domain': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                secure: false,
            }
        }
    },
    build: {
        rollupOptions: {
            external: [],
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    heroui: ['@heroui/react', '@heroui/theme'],
                    mui: ['@mui/material', '@mui/icons-material', '@mui/system'],
                    motion: ['framer-motion'],
                    charts: ['react-chartjs-2', 'recharts'],
                },
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]'
            }
        },
        target: 'esnext',
        sourcemap: false,
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        },
        chunkSizeWarningLimit: 1000,
        assetsInlineLimit: 4096
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
        },
    }
});