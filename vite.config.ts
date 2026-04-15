import { fileURLToPath, URL } from 'node:url';
import pkg from './package.json';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
    base: './',
    define: {
        __APP_VERSION__: JSON.stringify(pkg.version),
        __APP_LICENCE__: JSON.stringify(pkg.license),
        __TITLE__: '"MyPlan"',
        __CONTEXT__: '""',
    },
    plugins: [
        vue(),
        vueDevTools(),
        basicSsl({
            /** name of certification */
            name: 'test',
            /** custom trust domains */
            domains: ['*.custom.com'],
            /** custom certification directory */
            certDir: '/Users/.../.devServer/cert',
        }),
        VitePWA({
            registerType: 'prompt',
            injectRegister: 'auto',
            strategies: 'generateSW',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,webm,ttf}'],
                navigateFallback: 'index.html',
            },
            manifest: {
                name: 'MyPlan',
                short_name: 'MyPlan',
                description: 'Climbing route planner',
                theme_color: '#03378c',
                background_color: '#121212',
                display: 'standalone',
                orientation: 'any',
                start_url: './',
                scope: './',
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
});
