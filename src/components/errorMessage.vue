<template>
    <aside>
        {{ t('message.cameraDenied') }}
    </aside>
</template>
<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
<style scoped>
aside {
    background: var(--color-error);
    color: var(--color-text-message);
    border: 1px solid var(--color-text-message);
    border-radius: var(--border-radius);
    padding: var(--section-padding);
    position: absolute;
    z-index: var(--zIndex-error-message);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0.8;
}
</style>
