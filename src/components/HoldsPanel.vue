<template>
    <SidePanel @close="emit('close')" />
</template>

<script lang="ts" setup>
import SidePanel from '@/components/SidePanel.vue';

const emit = defineEmits<{
    close: [];
}>();
</script>