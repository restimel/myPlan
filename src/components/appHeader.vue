<template>
    <div class="wrapper">
        <nav>
            <RouterLink to="/build"><MyIcon icon="edit" :size="12" /> {{ t('build.title') }}</RouterLink>
            <RouterLink to="/view"><MyIcon icon="view" :size="12" />  {{ t('view.title') }}</RouterLink>
            <RouterLink to="/about"><MyIcon icon="question" :size="12" />  {{ t('about.title') }}</RouterLink>
            <LanguageSelector />
        </nav>
    </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import MyIcon from '@/components/myIcon.vue';
import LanguageSelector from '@/components/LanguageSelector.vue';

const { t } = useI18n();
</script>
<style scoped>

nav {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    font-size: 12px;
    text-align: center;
    justify-content: center;
    gap: var(--spacing-sm);
}

@media (orientation:landscape) {
    nav {
        flex-direction: column;
    }
}

nav a {
    color: var(--color-txt-primary);
    display: inline-block;
    padding: 0 1rem;
    border-left: 1px solid var(--color-border);
}

nav a.router-link-exact-active {
    background: var(--color-secondary);
    color: var(--color-txt-secondary);
}

nav a:first-of-type {
    border: 0;
}
</style>
