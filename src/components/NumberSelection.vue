<template>
    <div class="roller">
        <button
            class="roller-btn btn-transparent"
            @click="increment"
        >
            <MyIcon icon="up" />
        </button>
        <div
            class="roller-viewport"
            @wheel.prevent="onWheel"
            @touchstart="onTouchStart"
            @touchmove.prevent="onTouchMove"
            @touchend="onTouchEnd"
        >
            <TransitionGroup
                :name="direction"
                tag="div"
                class="roller-track"
                @before-leave="onBeforeLeave"
            >
                <span
                    class="roller-value"
                    :key="prevValue"
                    @click="decrement"
                >{{ displayPrev }}</span>
                <span
                    class="roller-value"
                    :key="model"
                >{{ displayCurrent }}</span>
                <span
                    class="roller-value"
                    :key="nextValue"
                    @click="increment"
                >{{ displayNext }}</span>
            </TransitionGroup>
        </div>
        <button
            class="roller-btn btn-transparent"
            @click="decrement"
        >
            <MyIcon icon="down" />
        </button>
    </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import MyIcon from '@/components/myIcon.vue';

const {
    min = 0,
    max = 60,
} = defineProps<{
    min?: number;
    max?: number;
}>();

const model = defineModel<number>({ default: 0 });
const direction = ref('roll-up');

const range = computed(() => max - min + 1);

function wrap(value: number): number {
    const rng = range.value;

    return ((value - min) % rng + rng) % rng + min;
}

function increment() {
    direction.value = 'roll-up';
    model.value = wrap(model.value + 1);
}

function decrement() {
    direction.value = 'roll-down';
    model.value = wrap(model.value - 1);
}

const prevValue = computed(() => wrap(model.value - 1));
const nextValue = computed(() => wrap(model.value + 1));

const displayCurrent = computed(() => String(model.value).padStart(2, '0'));
const displayPrev = computed(() => String(prevValue.value).padStart(2, '0'));
const displayNext = computed(() => String(nextValue.value).padStart(2, '0'));

/* Wheel support (desktop) */
function onWheel(event: WheelEvent) {
    if (event.deltaY < 0) {
        increment();
    } else {
        decrement();
    }
}

/* Touch swipe support */
const touchStartY = ref(0);
const threshold = 30;

function onTouchStart(event: TouchEvent) {
    const touch = event.touches[0];

    if (touch) {
        touchStartY.value = touch.clientY;
    }
}

function onTouchMove(event: TouchEvent) {
    const touch = event.touches[0];

    if (!touch) {
        return;
    }

    const delta = touchStartY.value - touch.clientY;

    if (Math.abs(delta) >= threshold) {
        if (delta > 0) {
            increment();
        } else {
            decrement();
        }

        touchStartY.value = touch.clientY;
    }
}

function onTouchEnd() {
    touchStartY.value = 0;
}

function onBeforeLeave(element: Element) {
    const el = element as HTMLElement;

    el.style.top = `${el.offsetTop}px`;
}
</script>

<style scoped>
.roller {
    display: flex;
    flex-direction: column;
    align-items: center;
    user-select: none;
    touch-action: none;
}

.roller-btn {
    padding: var(--spacing-xs);
    min-height: auto;
}

.roller-viewport {
    --item-height: 1.8em;
    position: relative;
    height: calc(var(--item-height) * 3);
    overflow: hidden;
    perspective: 200px;
    mask-image: linear-gradient(to bottom, transparent, black 25%, black 75%, transparent);
    -webkit-mask-image: linear-gradient(to bottom, transparent, black 25%, black 75%, transparent);
}

/* Highlight behind the current (middle) value */
.roller-viewport::before {
    content: '';
    position: absolute;
    top: 50%;
    left: -4px;
    right: -4px;
    height: var(--item-height);
    transform: translateY(-50%);
    background: var(--color-background-mute);
    border-radius: var(--border-radius-sm);
    pointer-events: none;
    z-index: -1;
}

.roller-track {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
}

.roller-value {
    font-variant-numeric: tabular-nums;
    text-align: center;
    min-width: 2.5ch;
    height: var(--item-height);
    line-height: var(--item-height);
    font-weight: bold;
    cursor: pointer;
}

/* TransitionGroup: smooth repositioning of items that stay */
.roll-up-move,
.roll-down-move {
    transition: transform var(--transition-fast) ease-out;
}

/* Leaving items must be absolute so move animation works */
.roll-up-leave-active,
.roll-down-leave-active {
    position: absolute;
    width: 100%;
}

/* Enter & leave transitions */
.roll-up-enter-active,
.roll-up-leave-active,
.roll-down-enter-active,
.roll-down-leave-active {
    transition: transform var(--transition-fast) ease-out, opacity var(--transition-fast) ease-out;
}

/* Roll up (increment): enter from below, exit to top */
.roll-up-enter-from {
    transform: translateY(100%) rotateX(-45deg);
    opacity: 0;
}

.roll-up-leave-to {
    transform: translateY(-100%) rotateX(45deg);
    opacity: 0;
}

/* Roll down (decrement): enter from top, exit to bottom */
.roll-down-enter-from {
    transform: translateY(-100%) rotateX(45deg);
    opacity: 0;
}

.roll-down-leave-to {
    transform: translateY(100%) rotateX(-45deg);
    opacity: 0;
}
</style>
