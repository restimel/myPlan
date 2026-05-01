<template>
    <button v-if="isZoomed"
        class="zoom-reset"
        @click="emit('reset')"
        :title="t('action.zoomReset')"
    >
        ×{{ Math.round(props.scaleRatio / props.minScale * 10) / 10 }}
    </button>
</template>
<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
    scaleRatio: number;
    minScale: number;
}>();

const emit = defineEmits<{ reset: [] }>();

const { t } = useI18n();

const isZoomed = computed(() => props.scaleRatio > props.minScale * 1.01);
</script>
<style scoped>
.zoom-reset {
    position: absolute;
    z-index: var(--zIndex-status);
    left: var(--spacing-lg);
    bottom: calc(var(--spacing-lg) + var(--button-size));
    background: var(--color-primary);
    color: var(--color-txt-primary);
    border: none;
    border-radius: 25px;
    cursor: pointer;
    padding: 4px 10px;
    font-size: var(--font-size-md);
    font-weight: bold;
}
</style>
