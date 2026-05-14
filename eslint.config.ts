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
            'comma-dangle': ['error', {
                'arrays': 'always-multiline',
                'objects': 'always-multiline',
                'imports': 'always-multiline',
                'exports': 'always-multiline',
                'functions': 'never',
            }],
            'curly': ['error', 'all'],
            'id-length': ['error', { min: 2, exceptions: ['t', 'x', 'y'] }],
            'indent': ['error', 4, { 'SwitchCase': 1 }],
            'multiline-comment-style': ['error', 'starred-block'],
            'no-console': 'error',
            'padding-line-between-statements': [
                'error',
                { blankLine: 'always', prev: '*', next: 'multiline-block-like' },
                { blankLine: 'always', prev: 'multiline-block-like', next: '*' },
            ],
            'quotes': ['error', 'single'],
            'semi': ['error', 'always'],
        },
    }
);
