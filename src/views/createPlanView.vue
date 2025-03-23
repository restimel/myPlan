<template>
    <div class="container">
        <VideoPlan v-if="mode === 'video'"
            @image="getImage"
        />
        <CanvasHold v-if="mode === 'canvas'"
            :image="image"
            @back="mode = 'video'"
        />
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import VideoPlan from '@/components/videoPlan.vue';
import CanvasHold from '@/components/canvasHold.vue';

const mode = ref<'video' | 'canvas'>('video');
const image = ref<ImageData | null>(null);

function getImage(data: ImageData | null) {
    if (!data) {
        return;
    }

    image.value = data;
    mode.value = 'canvas';
}

</script>

<style>
.container {
    display: grid;
    grid-template-rows: 1fr max-content;
    grid-template-areas: "content" "actions";
}

.canvas-container.canvas {
    display: block;
}

footer {
    grid-area: actions;
    background: var(--color-secondary);
    color: var(--color-txt-secondary);
    display: flex;
    flex-direction: row;
    justify-content: center;
    gap: var(--spacing-sm);
}
button {
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
}
</style>
