import pluginVue from 'eslint-plugin-vue';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
// import pluginVitest from '@vitest/eslint-plugin';

/*
 * To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
 * import { configureVueProject } from '@vue/eslint-config-typescript'
 * configureVueProject({ scriptLangs: ['ts', 'tsx'] })
 * More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup
 */

export default defineConfigWithVueTs(
    {
        name: 'app/files-to-lint',
        files: ['**/*.{ts,mts,tsx,vue}'],
    },

    {
        name: 'app/files-to-ignore',
        ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
    },

    pluginVue.configs['flat/essential'],
    vueTsConfigs.recommended,

    {
        // ...pluginVitest.configs.recommended,
        files: ['src/**/__tests__/*'],
    },
    {
        rules: {
            'indent': ['error', 4, { 'SwitchCase': 1 }],
            'semi': ['error', 'always'],
            'quotes': ['error', 'single'],
            'multiline-comment-style': ['error', 'starred-block'],
            'comma-dangle': ['error', {
                'arrays': 'always-multiline',
                'objects': 'always-multiline',
                'imports': 'always-multiline',
                'exports': 'always-multiline',
                'functions': 'never',
            }],
        },
    }
);
