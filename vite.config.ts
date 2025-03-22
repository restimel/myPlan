import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vite.dev/config/
export default defineConfig({
    base: './',
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
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
});
