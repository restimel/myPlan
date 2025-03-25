<template>
<aside v-if="debug">
    {{ debugMessage }}
</aside>
</template>
<script lang="ts" setup>
import {
    debug,
    debugMessage,
} from '@/utils/debug.ts';

</script>
<style scoped>
aside {
    position: fixed;
    bottom: 0;
    right: 0;
    background: var(--color-background-soft);
    color: var(--color-text);
}
</style>
