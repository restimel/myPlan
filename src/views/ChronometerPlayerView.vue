<template>
    <div class="container view-page">
        <ChronometerPlayer show-clock />
        <RouterLink
            to="/chronometerSettings"
            class="back-btn"
            :title="t('chronometer.leaveFullscreen')"
        >
            <MyIcon icon="cancel" />
        </RouterLink>
    </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import ChronometerPlayer from '@/components/timer/ChronometerPlayer.vue';
import MyIcon from '@/components/myIcon.vue';

const { t } = useI18n();
</script>

<style scoped>
.container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.back-btn {
    position: absolute;
    top: var(--spacing-sm);
    left: var(--spacing-sm);
    z-index: var(--zIndex-chronometer);
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--button-size);
    height: var(--button-size);
    border-radius: 50%;
    color: var(--color-chronometer-text);
    text-decoration: none;
    opacity: 0.6;
}

.back-btn:hover {
    opacity: 1;
}
</style>
