<template>
    <main class="app">
        <header>
            <AppHeader />
        </header>

        <RouterView />
    </main>
    <DebugMessage />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import DebugMessage from '@/components/debugMessage.vue';
import AppHeader from '@/components/appHeader.vue';

</script>

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

</style>
