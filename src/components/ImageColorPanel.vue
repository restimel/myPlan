<template>
    <SidePanel @close="emit('close')">
        <div class="color-row">
            <button
                class="action"
                :class="{ active: magicActive }"
                :title="t('action.magicHold')"
                @click="emit('toggleMagic')"
            >
                <MyIcon icon="magic" />
            </button>
        </div>
        <div class="color-row">
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
                <span class="slider-value">{{ colorMargin }}</span>
            </div>
        </div>
        <div class="color-row">
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
                <span class="slider-value">{{ contrast }}%</span>
            </div>
        </div>
        <div class="color-row">
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
                <span class="slider-value">{{ brightness }}%</span>
            </div>
        </div>
    </SidePanel>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import MyIcon from '@/components/myIcon.vue';
import SidePanel from '@/components/SidePanel.vue';

const props = defineProps<{
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

watch(() => props.hasColor, (hasColor) => {
    if (!hasColor) {
        marginOpen.value = false;
    }
});
</script>

<style scoped>
.color-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--spacing-xs);
}

.slider-overlay {
    display: flex;
    align-items: center;
    padding: var(--spacing-xs);
    background: rgba(0, 0, 0, 0.7);
    border-radius: var(--border-radius);
}

.slider {
    width: min(200px, calc(100vw - var(--button-size) - var(--spacing-sm) * 3));
    cursor: pointer;
}

.slider-value {
    color: var(--vt-c-white);
    font-size: var(--font-size-sm);
    width: 5ch;
    text-align: end;
}
</style>