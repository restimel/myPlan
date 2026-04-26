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
    z-index: var(--zIndex-menu);
    left: var(--spacing-sm);
    top: 50%;
    transform: translateY(-50%);
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs);
    background: transparent;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: var(--border-radius);
}

.side-panel__close {
    display: flex;
    justify-content: center;
    align-items: center;
    width: var(--button-size);
}
</style>
