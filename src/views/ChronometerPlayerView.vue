<template>
    <div class="container view-page">
        <ChronometerPlayer show-clock show-close :horizontal="isLandscape" />
    </div>
</template>

<script lang="ts" setup>
import ChronometerPlayer from '@/components/timer/ChronometerPlayer.vue';
import { useMediaQuery } from '@vueuse/core';

const isLandscape = useMediaQuery('(orientation: landscape)');
</script>

<style scoped>
.container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
}
</style>
