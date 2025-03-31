<template>
    <aside v-if="opacity > 0"
        class="message"
        :style="`--opacity: ${opacity};`"
    >
        {{ message }}
    </aside>
</template>
<script lang="ts" setup>
import { ref, watch } from 'vue';

type Props = {
    message: string;
};

const props = defineProps<Props>();

const opacity = ref(1);
let timer = 0;

const ANIMATION_DELAY = 1_200;
const ANIMATION_STEP = 80;

watch(() => props.message, animation, { immediate: true });

function animation() {
    opacity.value = 1;
    clearTimeout(timer);

    function reduceOpacity() {
        const value = opacity.value - 0.1;

        if (value > 0) {
            opacity.value = value;
            timer = setTimeout(reduceOpacity, ANIMATION_STEP);
        } else {
            opacity.value = 0;
        }
    }

    timer = setTimeout(reduceOpacity, ANIMATION_DELAY);
}
</script>
<style scoped>
.message {
    background: transparent;
    color: var(--color-text-details);
    text-shadow: var(--shadow-lg);
    border: none;
    padding: var(--section-padding);
    text-align: center;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    user-select: none;
    font-size: 3em;
    font-weight: 600;
    opacity: var(--opacity, 0.3);
}
</style>
