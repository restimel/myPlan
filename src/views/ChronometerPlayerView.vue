<template>
    <div class="container view-page">
        <ChronometerPlayer show-clock show-close />
    </div>
</template>

<script lang="ts" setup>
import ChronometerPlayer from '@/components/timer/ChronometerPlayer.vue';
</script>

<style scoped>
.container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
}
</style>
