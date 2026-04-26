<template>
    <SidePanel @close="emit('cancel')">
        <div class="panel-row">
            <button
                class="action"
                :class="{ active: topOpen }"
                :title="t('action.warpTop')"
                @click="topOpen = !topOpen"
            >
                <MyIcon icon="up" />
            </button>
            <div v-if="topOpen" class="slider-overlay">
                <input
                    type="range"
                    min="0"
                    max="100"
                    :value="warpTop"
                    @input="(evt) => warpTop = Math.min(warpBottom - 1, +(evt.currentTarget as HTMLInputElement).value)"
                    class="slider"
                />
                <span class="slider-value">{{ warpTop }}%</span>
            </div>
        </div>
        <div class="panel-row">
            <button
                class="action"
                :class="{ active: bottomOpen }"
                :title="t('action.warpBottom')"
                @click="bottomOpen = !bottomOpen"
            >
                <MyIcon icon="down" />
            </button>
            <div v-if="bottomOpen" class="slider-overlay">
                <input
                    type="range"
                    min="0"
                    max="100"
                    :value="warpBottom"
                    @input="(evt) => warpBottom = Math.max(warpTop + 1, +(evt.currentTarget as HTMLInputElement).value)"
                    class="slider"
                />
                <span class="slider-value">{{ warpBottom }}%</span>
            </div>
        </div>
        <div class="panel-row">
            <button
                class="action"
                :class="{ active: factorOpen }"
                :title="t('action.warpFactor')"
                @click="factorOpen = !factorOpen"
            >
                <MyIcon icon="size" />
            </button>
            <div v-if="factorOpen" class="slider-overlay">
                <input
                    type="range"
                    min="100"
                    max="500"
                    step="5"
                    v-model.number="warpFactor"
                    class="slider"
                />
                <span class="slider-value">×{{ (warpFactor / 100).toFixed(2) }}</span>
            </div>
        </div>
        <div v-if="warpDefined"
            class="panel-row"
        >
            <button
                class="action"
                :title="t('action.removeWarp')"
                @click="emit('removeWarp')"
            >
                <MyIcon icon="delete" />
            </button>
        </div>
        <div class="panel-row">
            <button
                class="action"
                :title="t('action.confirm')"
                @click="emit('validate')"
            >
                <MyIcon icon="ok" />
            </button>
        </div>
    </SidePanel>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import MyIcon from '@/components/myIcon.vue';
import SidePanel from '@/components/SidePanel.vue';

defineProps<{
    warpDefined: boolean;
}>();

const emit = defineEmits<{
    validate: [];
    cancel: [];
    removeWarp: [];
}>();

const warpTop = defineModel<number>('warpTop', { required: true });
const warpBottom = defineModel<number>('warpBottom', { required: true });
/*
 * warpFactor is stored as an integer × 100 (e.g. 150 = ×1.5).
 * The slider operates directly on this integer value.
 */
const warpFactor = defineModel<number>('warpFactor', { required: true });

const { t } = useI18n();

const topOpen = ref(false);
const bottomOpen = ref(false);
const factorOpen = ref(false);
</script>

<style scoped>
.panel-row {
    position: relative;
}

.slider-overlay {
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    margin-left: var(--spacing-xs);
    display: flex;
    align-items: center;
    padding: var(--spacing-xs);
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border: 1px solid var(--glass-border);
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