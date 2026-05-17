<template>
    <button
        ref="buttonRef"
        v-bind="$attrs"
        class="confirm-button"
        :class="{ active: isActive }"
        :disabled="disabled"
        @click.stop="actionButton"
    >
        <MyIcon :icon="icon ?? 'delete'" />
        <slot />
    </button>
    <Teleport to="body">
        <Transition>
            <div v-if="isActive"
                class="tooltip"
                :class="resolvedPosition"
                :style="tooltipVars"
            >
                {{ message }}
            </div>
        </Transition>
    </Teleport>
</template>

<script lang="ts" setup>
import MyIcon, { type Icons } from '@/components/myIcon.vue';
import { computed, ref, useTemplateRef } from 'vue';

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

defineOptions({ inheritAttrs: false });

const doubleClick = ref(0);
const isActive = computed(() => doubleClick.value !== 0);
const tooltipPosition = computed(() => props.position ?? 'top');
const buttonRef = useTemplateRef<HTMLButtonElement>('buttonRef');
const buttonRect = ref<DOMRect | null>(null);
const TOOLTIP_HEIGHT_ESTIMATE = 50;
const TIMEOUT_TO_CONFIRM = 2_000;

const resolvedPosition = computed(() => {
    const pos = tooltipPosition.value;

    if (!buttonRect.value) {
        return pos;
    }

    const rect = buttonRect.value;

    if (pos === 'top' && rect.top < TOOLTIP_HEIGHT_ESTIMATE) {
        return 'bottom';
    }

    if (pos === 'bottom' && rect.bottom > window.innerHeight - TOOLTIP_HEIGHT_ESTIMATE) {
        return 'top';
    }

    return pos;
});

const tooltipVars = computed<Record<string, string>>(() => {
    if (!buttonRect.value) {
        return {} as Record<string, string>;
    }

    const rect = buttonRect.value;

    return {
        '--anchor-top': `${rect.top}px`,
        '--anchor-bottom': `${rect.bottom}px`,
        '--anchor-left': `${rect.left}px`,
        '--anchor-right': `${rect.right}px`,
        '--anchor-width': `${rect.width}px`,
        '--anchor-height': `${rect.height}px`,
    };
});

function actionButton() {
    if (doubleClick.value) {
        emit('click');
    } else {
        if (buttonRef.value) {
            buttonRect.value = buttonRef.value.getBoundingClientRect();
        }

        doubleClick.value = window.setTimeout(() => {
            doubleClick.value = 0;
        }, props.duration ?? TIMEOUT_TO_CONFIRM);
    }
}

</script>

<style scoped>
.confirm-button {
    position: relative;
}

.tooltip {
    position: fixed;
    z-index: var(--zIndex-modal);
    background-color: var(--color-background-mute);
    border: var(--field-border);
    color: var(--color-text);
    white-space: nowrap;
    padding: var(--field-padding);
    box-shadow: var(--shadow-lg);
}

.tooltip.top {
    bottom: calc(100dvh - var(--anchor-top) + var(--field-padding-sm));
    left: calc(var(--anchor-left) + var(--anchor-width) / 2);
    transform: translateX(-50%);
}

.tooltip.bottom {
    top: calc(var(--anchor-bottom) + var(--field-padding-sm));
    left: calc(var(--anchor-left) + var(--anchor-width) / 2);
    transform: translateX(-50%);
}

.tooltip.left {
    top: calc(var(--anchor-top) + var(--anchor-height) / 2);
    right: calc(100dvw - var(--anchor-left) + var(--field-padding-sm));
    transform: translateY(-50%);
}

.tooltip.right {
    top: calc(var(--anchor-top) + var(--anchor-height) / 2);
    left: calc(var(--anchor-right) + var(--field-padding-sm));
    transform: translateY(-50%);
}

.v-enter-active,
.v-leave-active {
  transition: opacity var(--transition-normal) ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
