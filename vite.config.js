import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

// Vite configuration optimized for large projects
export default defineConfig({
    optimizeDeps: {
        exclude: ['styled-components'],
        include: [
            '@heroui/react',
            '@heroui/theme',
            '@mui/material',
            'framer-motion',
            'react',
            'react-dom'
        ],
        force: true
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
    ],
    server: {
        host: '127.0.0.1',
        port: 5173,
        hmr: {
            overlay: false
        }
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Core React chunk
                    'react-vendor': ['react', 'react-dom'],
                    
                    // UI Libraries chunk
                    'ui-vendor': [
                        '@heroui/react', 
                        '@heroui/theme',
                        '@headlessui/react'
                    ],
                    
                    // Material UI chunk
                    'mui-vendor': [
                        '@mui/material', 
                        '@mui/system',
                        '@emotion/react',
                        '@emotion/styled'
                    ],
                    
                    // Animation libraries
                    'animation-vendor': ['framer-motion'],
                    
                    // Chart libraries
                    'chart-vendor': ['react-chartjs-2', 'recharts'],
                    
                    // Utility libraries
                    'utils-vendor': [
                        'lodash', 
                        'axios', 
                        'date-fns',
                        'dayjs'
                    ],
                    
                    // Form libraries
                    'form-vendor': [
                        'react-hook-form',
                        '@hookform/resolvers',
                        'zod'
                    ]
                },
                chunkFileNames: 'assets/js/[name]-[hash].js',
                entryFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
            },
            // Increase max chunk size to reduce number of files
            maxParallelFileOps: 2
        },
        target: 'esnext',
        sourcemap: false,
        minify: 'esbuild',
        chunkSizeWarningLimit: 2000,
        assetsInlineLimit: 8192,
        // Reduce concurrent file operations
        commonjsOptions: {
            include: [/node_modules/],
            transformMixedEsModules: true
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
        },
    },
    esbuild: {
        // Optimize esbuild for better memory usage
        target: 'esnext',
        logOverride: {
            'this-is-undefined-in-esm': 'silent'
        }
    }
});