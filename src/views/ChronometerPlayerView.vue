<template>
    <div class="container view-page">
        <ChronometerPlayer />
    </div>
</template>

<script lang="ts" setup>
import ChronometerPlayer from '@/components/timer/ChronometerPlayer.vue';
// import { useI18n } from 'vue-i18n';

// const { t } = useI18n();

</script>
<style scoped>

.container {
    width: 100%;
    height: 100%;
    overflow: hidden;
}

</style>
