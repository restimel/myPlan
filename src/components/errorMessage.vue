<template>
    <aside>
        Allow the access to the camera in order to take a picture of the route.
    </aside>
</template>
<script lang="ts" setup>
</script>
<style scoped>
aside {
    background: var(--color-error);
    color: var(--color-text-message);
    border: 1px solid var(--color-text-message);
    border-radius: var(--border-radius);
    padding: var(--section-padding);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0.8;
}
</style>
