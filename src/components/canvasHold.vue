<template>
    <div
        ref="container"
        class="canvas-container"
        :style="`--scale: ${scaleRatio};`"
    >
        <canvas
            ref="canvas"
            id="canvasPicture"
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

const container = useTemplateRef('container');
const canvas = useTemplateRef('canvas');
const canvasLayer = useTemplateRef('canvasLayer');

const scaleRatio = ref(1);
const threshold = ref(10);
const selectHold = ref<Hold | null>(null);

watch(() => props.image, loadImage);
watch(holdList, drawHolds, { deep: true });

onMounted(() => {
    loadImage();
});

function loadImage() {
    const containerEl = container.value!;
    const canvasEl = canvas.value!;
    const canvasLayerEl = canvasLayer.value!;
    const imgData = props.image;

    if (!containerEl || !canvasEl || !imgData) {
        return;
    }

    const { width, height } = imgData;

    const rect = containerEl.getBoundingClientRect();
    const scale = Math.min(rect.width / width, rect.height / height);
    scaleRatio.value = scale;

    canvasEl.width = width;
    canvasEl.height = height;
    canvasLayerEl.width = width;
    canvasLayerEl.height = height;

    const context = canvasEl.getContext('2d')!;

    resetHolds(); // probably not the good place

    context.putImageData(imgData, 0, 0);
}

function setHold(event: MouseEvent) {
    const canvasLayerEl = canvasLayer.value!;
    const rect = canvasLayerEl.getBoundingClientRect();
    const scale = scaleRatio.value;

    /* This is to draw around 35 holds on height */
    const size = canvasLayerEl.height / 70;

    /* position in the context of the canvas */
    const mouseX = Math.round(event.clientX - rect.left);
    const mouseY = Math.round(event.clientY - rect.top);

    const canvasX = mouseX / scale;
    const canvasY = mouseY / scale;

    addHold(canvasX, canvasY, size);
}

function drawHolds() {
    const canvasLayerEl = canvasLayer.value!;
    const context = canvasLayerEl.getContext('2d')!;

    if (!context) {
        return;
    }

    const lineWidth = Math.max(1, canvasLayerEl.height / 1000);

    context.clearRect(0, 0, canvasLayerEl.width, canvasLayerEl.height);

    context.fillStyle = '#ffffff33';
    context.strokeStyle = '#000000ff';
    context.lineWidth = lineWidth;
    context.textBaseline = 'middle';
    context.textAlign = 'center';

    holdList.value.forEach((hold) => {
        const positions = hold.position;
        const radius = hold.size;
        const maxTextWidth = 2 * (radius - 2 * lineWidth);
        context.font = `${radius}px serif`;

        positions.forEach(([x, y]) => {
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
            context.stroke();

            const text = Array.isArray(hold.value) ?
                hold.value.map((value) => value.toString(10)).join(', ') :
                hold.value.toString(10);

            context.strokeText(text, x, y, maxTextWidth);
        });
    });
}

</script>
<style scoped>
#canvasLayer,
#canvasPicture {
    position: absolute;
    background-color: var(--color-background);
    grid-area: content;
    transform: scale(var(--scale));
    transform-origin: top left;
}

#canvasLayer {
    background-color: transparent;
}

.canvas-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: auto;
    background: var(--color-bg-media);
}
</style>
