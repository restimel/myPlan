<template>
    <div class="wrapper">
        <div
            class="mobile-menu-button"
            @click="toggleMobileMenu"
        >
            <MyIcon icon="menu" :size="16" />
            {{ 'Menu' }}
        </div>
        <nav
            :class="{
                open: isMenuOpen,
            }"
            @mousedown="close"
        >
            <RouterLink to="/build"><MyIcon icon="edit" :size="12" /> {{ t('build.title') }}</RouterLink>
            <RouterLink to="/view"><MyIcon icon="view" :size="12" />  {{ t('view.title') }}</RouterLink>
            <RouterLink to="/about"><MyIcon icon="question" :size="12" />  {{ t('about.title') }}</RouterLink>
            <LanguageSelector />
        </nav>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import MyIcon from '@/components/myIcon.vue';
import LanguageSelector from '@/components/LanguageSelector.vue';

const { t } = useI18n();

const isMenuOpen = ref(false);

function toggleMobileMenu() {
    isMenuOpen.value = !isMenuOpen.value;
}

function close() {
    /* differ the close in order to let mobile interaction with links */
    setTimeout(() => isMenuOpen.value = false, 5);
}
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

/* {{{ Mobile Styles */

.mobile-menu-button {
    display: none;
}

@media (max-width: 400px) {
    nav {
        display: none;
        flex-direction: column;
        background: var(--color-bg);
        font-size: 1.2em;

        position: absolute;
        z-index: 100;
        top: 20px;
        height: auto;
        background-color: var(--color-primary);
        box-shadow: var(--shadow-primary);
    }

    nav.open {
        border-top: var(--field-border);
        display: flex;
    }

    .mobile-menu-button {
        display: flex;
        flex-direction: row;
        align-content: center;
        justify-content: center;
        align-items: center;
    }
}

/* }}} */
</style>
