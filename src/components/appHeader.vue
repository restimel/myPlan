<template>
    <div class="wrapper">
        <div
            class="mobile-menu-button"
            @click="toggleMobileMenu"
        >
            <MyIcon icon="menu" :size="iconSizeMenu" />
            {{ 'Menu' }}
        </div>
        <div
            v-if="isMenuOpen"
            class="backdrop"
            @click="isMenuOpen = false"
        />
        <nav
            :class="{
                open: isMenuOpen,
            }"
        >
            <RouterLink to="/build"><MyIcon icon="edit" :size="iconSize" />{{ t('build.title') }}</RouterLink>
            <RouterLink to="/view"><MyIcon icon="view" :size="iconSize" /> {{ t('view.title') }}</RouterLink>
            <RouterLink to="/chronometerSettings"><MyIcon icon="chronometer" :size="iconSize" /> {{ t('chronometer.title') }}</RouterLink>
            <RouterLink to="/about"><MyIcon icon="question" :size="iconSize" /> {{ t('about.title') }}</RouterLink>
            <LanguageSelector />
        </nav>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import MyIcon from '@/components/myIcon.vue';
import LanguageSelector from '@/components/LanguageSelector.vue';

const { t } = useI18n();

const isMenuOpen = ref(false);
let removeHook = () => {};

const router = useRouter();

const iconSize = computed(() => {
    return 'var(--font-title-size)';
});

const iconSizeMenu = computed(() => {
    return 'var(--font-main-title-size)';
});

function toggleMobileMenu() {
    isMenuOpen.value = !isMenuOpen.value;
}

onMounted(() => {
    removeHook = router.afterEach(() => {
        isMenuOpen.value = false;
    });
});

onUnmounted(() => {
    if (removeHook) {
        removeHook();
    }
});

</script>
<style scoped>

nav {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    font-size: var(--font-title-size);
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
    display: inline-flex;
    align-items: center;
    padding: 0 1rem;
    border-left: 1px solid var(--color-border);
    box-shadow: inset 0 -3px 0 transparent;
    transition: box-shadow var(--transition-fast);
}

nav a > :deep(.icon) {
    margin-inline-end: var(--spacing-xs);
}

nav a.router-link-exact-active {
    background: rgba(255, 255, 255, 0.2);
    box-shadow: inset 0 -3px 0 var(--color-secondary);
}

@media (orientation:landscape) {
    nav a {
        box-shadow: inset 3px 0 0 transparent;
    }

    nav a.router-link-exact-active {
        box-shadow: inset 3px 0 0 var(--color-secondary);
    }
}

nav a:first-of-type {
    border-left: 0;
}

/* {{{ Mobile Styles */

.mobile-menu-button {
    display: none;
}

@media (max-width: 810px) {
    nav {
        flex-direction: column;
        font-size: var(--font-size-lg);
        position: absolute;
        z-index: var(--zIndex-main-menu);
        height: auto;
        background-color: var(--color-primary);
        box-shadow: var(--shadow-primary);
        transform: translateY(-100%);
        opacity: 0;
        pointer-events: none;
        transition: transform var(--transition-normal), opacity var(--transition-normal);
    }

    nav.open {
        border-top: var(--field-border);
        transform: translateY(0);
        opacity: 1;
        pointer-events: auto;
    }

    nav a {
        padding: var(--spacing-sm) var(--spacing-md);
        min-height: 2.75rem;
    }

    .mobile-menu-button {
        display: flex;
        flex-direction: row;
        align-content: center;
        justify-content: center;
        align-items: center;
        font-size: var(--font-main-title-size);
        cursor: pointer;
    }

    .backdrop {
        position: fixed;
        inset: 0;
        z-index: calc(var(--zIndex-main-menu) - 1);
        background: rgba(0, 0, 0, 0.3);
    }
}

/* }}} */
</style>
