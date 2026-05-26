<template>
    <div class="container view-page">
        <ChronometerPlayer show-clock show-close :horizontal="isLandscape" />
    </div>
</template>

<script lang="ts" setup>
import { onMounted, onBeforeUnmount } from 'vue';
import ChronometerPlayer from '@/components/timer/ChronometerPlayer.vue';
import { useMediaQuery } from '@vueuse/core';

const isLandscape = useMediaQuery('(orientation: landscape)');

onMounted(async () => {
    try {
        await document.documentElement.requestFullscreen();
    } catch {
        /* fullscreen not available or denied */
    }
});

onBeforeUnmount(() => {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    }
});
</script>

<style scoped>
.container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
}
</style>
