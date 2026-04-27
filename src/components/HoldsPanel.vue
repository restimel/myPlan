<template>
    <SidePanel @close="emit('close')">
        <div class="panel-row">
            <button
                class="action"
                :class="{ active: sizeOpen }"
                :title="t('action.holdSize')"
                @click="sizeOpen = !sizeOpen"
            >
                <MyIcon icon="size" />
            </button>
            <div v-if="sizeOpen" class="slider-overlay">
                <input
                    class="slider"
                    type="range"
                    min="2"
                    max="100"
                    :value="store.defaultHoldSize"
                    @input="(evt) => store.changeAllHoldsSize(+(evt.currentTarget as HTMLInputElement).value)"
                />
                <span class="slider-value">{{ Math.round(store.defaultHoldSize) }}</span>
            </div>
        </div>
    </SidePanel>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import MyIcon from '@/components/myIcon.vue';
import SidePanel from '@/components/SidePanel.vue';
import type { RouteStore } from '@/stores/RouteStore';

defineProps<{
    store: RouteStore;
}>();

const emit = defineEmits<{
    close: [];
}>();

const { t } = useI18n();

const sizeOpen = ref(false);
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
    width: 3ch;
    text-align: end;
}
</style>