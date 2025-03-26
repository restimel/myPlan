<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import DebugMessage from '@/components/debugMessage.vue';
</script>

<template>
    <main class="app">
        <header>
            <div class="wrapper">
                <nav>
                    <RouterLink to="/build">Build plan</RouterLink>
                    <RouterLink to="/about">About</RouterLink>
                </nav>
            </div>
        </header>

        <RouterView />
    </main>
    <DebugMessage />
</template>

<style scoped>

main {
    display: grid;
    grid-template-rows: max-content 1fr;
    grid-template-columns: 1fr;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    overflow: hidden;
}

@media (orientation:landscape) {
    main {
        grid-template-columns: max-content 1fr;
        grid-template-rows: 1fr;
    }
}

header {
    background: var(--color-primary);
    color: var(--color-txt-primary);
}

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

nav a.router-link-exact-active:hover {
    background-color: transparent;
}

nav a {
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
