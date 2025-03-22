<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
    <main class="app">
        <header>
            <div class="wrapper">
                <nav>
                    <RouterLink to="/">Home</RouterLink>
                    <RouterLink to="/about">About</RouterLink>
                </nav>
            </div>
        </header>

        <RouterView />
    </main>
</template>

<style scoped>

main {
    display: grid;
    grid-template-rows: max-content 1fr;
    grid-template-columns: 1fr;
    width: 100vw;
    height: 100vh;
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
}

@media (orientation:landscape) {
    nav {
        flex-direction: column;
    }
}

nav a.router-link-exact-active {
    background: var(--color-secondary);
    color: var(--color-txt-secondary);
}

nav a.router-link-exact-active:hover {
    background-color: transparent;
}

nav a {
    color: var(--color-txt-primary);
    display: inline-block;
    padding: 0 1rem;
    border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
    border: 0;
}

</style>
