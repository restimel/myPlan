<template>
    <time class="current-time">{{ currentTime }}</time>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useNow } from '@vueuse/core';

const now = useNow({ interval: 1_000 });

const currentTime = computed(() => {
    return now.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
});
</script>

<style scoped>
.current-time {
    padding: 0.3em 0.5em;
    font-size: 0.75em;
    opacity: 0.8;
    pointer-events: none;
}
</style>