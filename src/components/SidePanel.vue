<template>
    <aside class="side-panel" @pointerdown.stop>
        <div class="side-panel__close">
            <button
                class="btn-small"
                @click="emit('close')"
            >
                <MyIcon icon="cancel" />
            </button>
        </div>
        <slot />
    </aside>
</template>

<script lang="ts" setup>
import MyIcon from '@/components/myIcon.vue';

const emit = defineEmits<{
    close: [];
}>();
</script>

<style scoped>
.side-panel {
    position: absolute;
    z-index: var(--zIndex-panel-menu);
    left: var(--spacing-sm);
    top: 50%;
    transform: translateY(-50%);
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs);
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border: 1px solid var(--glass-border);
    border-radius: var(--border-radius);
}

.side-panel__close {
    display: flex;
    justify-content: center;
    align-items: center;
    width: var(--button-size);
}
</style>
