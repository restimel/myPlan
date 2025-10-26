<template>
    <div class="container editor-page">
        <h1>
            {{ t('chronometer.settingsTitle') }}
        </h1>
        <ChronometerPlayer />
        <TimerTool />
    </div>
</template>

<script lang="ts" setup>
import ChronometerPlayer from '@/components/timer/ChronometerPlayer.vue';
import TimerTool from '@/components/TimerTool.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

</script>
<style scoped>

.container {
    display: grid;
    grid-template-rows: max-content max-content 1fr;
    grid-template-areas: "title" "chronometer" "content";
    align-items: center;
    justify-items: center;
    max-height: 100%;
    overflow: auto;
}

</style>
