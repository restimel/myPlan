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
                :class="{ active: marginOpen }"
                :disabled="!hasColor"
                :title="t('action.colorMargin')"
                @click="marginOpen = !marginOpen"
            >
                <MyIcon icon="size" />
            </button>
            <div v-if="marginOpen" class="slider-overlay">
                <input
                    type="range"
                    min="1"
                    max="90"
                    v-model.number="colorMargin"
                    class="slider"
                />
            </div>
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
                    v-model.number="contrast"
                    class="slider"
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
                    v-model.number="brightness"
                    class="slider"
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
    hasColor: boolean;
}>();

const emit = defineEmits<{
    close: [];
    toggleMagic: [];
}>();

const colorMargin = defineModel<number>('colorMargin', { required: true });
const contrast = defineModel<number>('contrast', { required: true });
const brightness = defineModel<number>('brightness', { required: true });

const { t } = useI18n();

const marginOpen = ref(false);
const contrastOpen = ref(false);
const brightnessOpen = ref(false);

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
