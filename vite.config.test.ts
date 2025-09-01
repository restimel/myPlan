import { fileURLToPath, URL } from 'node:url';
import pkg from './package.json';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';

export default defineConfig({
    base: '/myPlan/test/',
    define: {
        __APP_VERSION__: JSON.stringify(pkg.version),
        __APP_LICENCE__: JSON.stringify(pkg.license),
    },
    plugins: [
        vue(),
        vueDevTools(),
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
