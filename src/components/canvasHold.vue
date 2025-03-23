<template>
    <div
        class="canvas-container"
    >
        <canvas
            ref="canvas"
            id="canvas"
        ></canvas>
        <canvas
            ref="canvasLayer"
            id="canvasLayer"
            @click="setHold"
        ></canvas>
    </div>
    <footer>
        <button
            @click="emit('back')"
        >
            Take another photo
        </button>
        <button v-if="holdList.length > 0"
            @click="removeHold()"
        >
            Remove last hold
        </button>
    </footer>
</template>
<script lang="ts" setup>
import { onMounted, ref, useTemplateRef, watch } from 'vue';
import {
    addHold,
    type Hold,
    holdList,
    removeHold,
    resetHolds,
} from '@/utils/holds';

const props = defineProps<{
    image: ImageData | null;
}>();

const emit = defineEmits<{
    back: [];
}>();

const canvas = useTemplateRef('canvas');
const canvasLayer = useTemplateRef('canvasLayer');

const threshold = ref(10);
const selectHold = ref<Hold | null>(null);

watch(() => props.image, loadImage);
watch(holdList, drawHolds, { deep: true });

onMounted(() => {
    loadImage();
});

function loadImage() {
    const canvasEl = canvas.value!;
    const canvasLayerEl = canvasLayer.value!;
    const imgData = props.image;

    if (!canvasEl || !imgData) {
        return;
    }

    const { width, height } = imgData;

    canvasEl.width = width;
    canvasEl.height = height;
    canvasLayerEl.width = width;
    canvasLayerEl.height = height;

    const context = canvasEl.getContext('2d')!;

    resetHolds(); // probably not the good place

    context.putImageData(
        imgData,
        0,
        0
    );
}

function setHold(event: MouseEvent) {
    const canvasLayerEl = canvasLayer.value!;
    const rect = canvasLayerEl.getBoundingClientRect();

    /* position in the context of the canvas */
    const mouseX = Math.round(event.clientX - rect.left);
    const mouseY = Math.round(event.clientY - rect.top);

    addHold(mouseX, mouseY);
}

function drawHolds() {
    const canvasLayerEl = canvasLayer.value!;
    const context = canvasLayerEl.getContext('2d')!;

    if (!context) {
        return;
    }

    context.clearRect(0, 0, canvasLayerEl.width, canvasLayerEl.height);

    context.fillStyle = '#ffffff33';
    context.strokeStyle = '#000000ff';
    context.lineWidth = 1;
    context.textBaseline = 'middle';
    context.textAlign = 'center';

    holdList.value.forEach((hold) => {
        const {x, y} = hold;
        const radius = 20;

        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
        context.stroke();

        context.strokeText(hold.value.toString(10), x, y);
    });
}

</script>
<style scoped>
#canvasLayer,
#canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 1px solid black;
    background-color: white;
    grid-area: content;
}

#canvasLayer {
    background-color: transparent;
}

.canvas-container {
    position: relative;
    width: 100%;
    height: 100%;
}
</style>
