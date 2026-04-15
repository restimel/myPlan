import { fileURLToPath, URL } from 'node:url';
import pkg from './package.json';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    base: '/myPlan/test/',
    define: {
        __APP_VERSION__: JSON.stringify(pkg.version),
        __APP_LICENCE__: JSON.stringify(pkg.license),
        __TITLE__: '"MyPlan - test"',
        __CONTEXT__: '"Test"',
    },
    plugins: [
        vue(),
        vueDevTools(),
        VitePWA({
            registerType: 'prompt',
            injectRegister: 'auto',
            strategies: 'generateSW',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,webm,ttf}'],
                navigateFallback: '/myPlan/test/index.html',
            },
            manifest: {
                name: 'MyPlan - test',
                short_name: 'MyPlan test',
                description: 'Climbing route planner (test)',
                theme_color: '#03378c',
                background_color: '#121212',
                display: 'standalone',
                orientation: 'any',
                start_url: '/myPlan/test/',
                scope: '/myPlan/test/',
                icons: [
                    { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
                    { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
                    { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    build: {
        outDir: 'dist/test',
        emptyOutDir: true,
    },
});
