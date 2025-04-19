<template>
    <aside v-if="opacity > 0"
        class="message"
        :class="{
            small: small,
        }"
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
const small = ref(false);
let timer = 0;

const ANIMATION_DELAY = 1_200;

watch(() => props.message, animation, { immediate: true });

function animation() {
    opacity.value = 1;
    small.value = false;
    clearTimeout(timer);

    timer = setTimeout(() => {
        small.value = true;
    }, ANIMATION_DELAY);
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
    width: 100%;
    pointer-events: none;
    user-select: none;
    font-size: 3em;
    font-weight: 600;
    opacity: var(--opacity, 0.3);

    transition: all 1s ease;
}

.small {
    top: 0;
    font-size: 0.9em;
    transform: translate(-50%, 0);
    padding-top: 0;
}
</style>
