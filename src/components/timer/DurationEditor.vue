<template>
    <span class="duration-editor">
        <NumberSelection
            v-model="hours"
            :max="24"
        />
        :
        <NumberSelection
            v-model="minutes"
            :max="59"
        />
        :
        <NumberSelection
            v-model="seconds"
            :max="59"
        />
    </span>
</template>

<script lang="ts" setup>
import NumberSelection from '@/components/NumberSelection.vue';
import { ref, watch } from 'vue';

const duration = defineModel<number>();
const hours = ref(0);
const minutes = ref(0);
const seconds = ref(0);

watch(duration, (totalDuration = 0) => {
    seconds.value = totalDuration % 60;
    minutes.value = Math.floor(totalDuration / 60) % 60;
    hours.value = Math.floor(totalDuration / 3_600);
}, { immediate: true });

watch([hours, minutes, seconds], () => {
    duration.value = hours.value * 3_600 + minutes.value * 60 + seconds.value;
});
</script>

<style scoped>
</style>
