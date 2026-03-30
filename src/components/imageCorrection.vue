<template>
    <aside class="correction-panel" @pointerdown.stop>
        <div class="correction-action">
            <button
                class="btn-small close-btn"
                @click="emit('close')"
            >
                <MyIcon icon="cancel" />
            </button>
        </div>
        <div class="correction-row">
            <button
                class="action"
                :class="{ active: magicActive }"
                :title="t('action.magicHold')"
                @click="emit('toggleMagic')"
            >
                <MyIcon icon="magic" />
            </button>
        </div>
        <div class="correction-row">
            <button
                class="action"
                :class="{ active: contrastOpen }"
                :title="t('action.contrast')"
                @click="contrastOpen = !contrastOpen"
            >
                <MyIcon icon="contrast" />
            </button>
            <div v-if="contrastOpen" class="slider-overlay">
                <input
                    type="range"
                    min="-100"
                    max="100"
                    :value="contrast"
                    class="slider"
                    @input="onContrastInput"
                />
            </div>
        </div>
        <div class="correction-row">
            <button
                class="action"
                :class="{ active: brightnessOpen }"
                :title="t('action.brightness')"
                @click="brightnessOpen = !brightnessOpen"
            >
                <MyIcon icon="brightness" />
            </button>
            <div v-if="brightnessOpen" class="slider-overlay">
                <input
                    type="range"
                    min="-100"
                    max="100"
                    :value="brightness"
                    class="slider"
                    @input="onBrightnessInput"
                />
            </div>
        </div>
    </aside>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import MyIcon from '@/components/myIcon.vue';

defineProps<{
    magicActive: boolean;
    contrast: number;
    brightness: number;
}>();

const emit = defineEmits<{
    close: [];
    toggleMagic: [];
    'update:contrast': [number];
    'update:brightness': [number];
}>();

const { t } = useI18n();

const contrastOpen = ref(false);
const brightnessOpen = ref(false);

function onContrastInput(event: Event) {
    const input = event.currentTarget as HTMLInputElement;

    emit('update:contrast', +input.value);
}

function onBrightnessInput(event: Event) {
    const input = event.currentTarget as HTMLInputElement;

    emit('update:brightness', +input.value);
}

</script>
<style scoped>
.correction-panel {
    position: absolute;
    z-index: var(--zIndex-menu);
    left: var(--spacing-sm);
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
}

.correction-action {
    display: flex;
    justify-content: center;
    align-items: center;
    width: var(--button-size);
}

.correction-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--spacing-xs);
}

.slider-overlay {
    display: flex;
    align-items: center;
    padding: var(--spacing-xs);
    background: rgba(0, 0, 0, 0.45);
    border-radius: var(--border-radius);
}

.slider {
    width: min(200px, calc(100vw - var(--button-size) - var(--spacing-sm) * 3));
    cursor: pointer;
}
</style>
