<template>
    <input
        type="number"
        v-model="model"
        :min="min"
        :max="max"
    >
</template>

<script lang="ts" setup>

const {
    min = 0,
    max = 60,
} = defineProps<{
    min?: number;
    max?: number;
}>();
const model = defineModel();

</script>

<style scoped>
</style>
