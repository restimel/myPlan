<template>
    <button
        class="confirm-button"
        :class="{
            active: isActive,
        }"
        :disabled="disabled"
        @click.stop="actionButton"
    >
        <MyIcon :icon="icon ?? 'delete'" />
        <Transition>
            <div v-if="isActive"
                class="tooltip"
                :class="tooltipPosition"
            >
                {{ message }}
            </div>
        </Transition>
    </button>
</template>

<script lang="ts" setup>
import MyIcon, { type Icons } from '@/components/myIcon.vue';
import { computed, ref } from 'vue';

const props = defineProps<{
    disabled?: boolean;
    icon?: Icons;
    message: string;
    duration?: number;
    position?: 'top' | 'bottom' | 'left' | 'right';
}>();

const emit = defineEmits<{
    click: [],
}>();

const doubleClick = ref(0);
const isActive = computed(() => doubleClick.value !== 0);
const tooltipPosition = computed(() => props.position || 'top');

function actionButton() {
    if (doubleClick.value) {
        emit('click');
    } else {
        doubleClick.value = setTimeout(() => {
            doubleClick.value = 0;
        }, props.duration ?? 2_000);
    }
}

</script>

<style scoped>
.confirm-button {
    position: relative;
    overflow: visible;
    anchor-name: --anchor-button-confirm;
}

.tooltip {
    position: absolute;
    background-color: var(--color-background-mute);
    border: 1px solid var(--color-border);
    color: var(--color-text);
    white-space: nowrap;
    padding: var(--field-padding);
    margin: var(--field-padding-sm);
    box-shadow: var(--shadow-lg);
}
.tooltip.top {
    bottom: 100%;
    bottom: anchor(top);
}
.tooltip.bottom {
    top: 100%;
    top: anchor(bottom);
}
.tooltip.left {
    right: 100%;
    right: anchor(left);
}
.tooltip.right {
    left: 100%;
    left: anchor(right);
}
@supports (position-anchor: --my-anchor) {
    .tooltip {
        position-anchor: --anchor-button-confirm;
        position: fixed;
    }
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
