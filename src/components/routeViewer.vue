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
    </div>
</template>
<script lang="ts" setup>
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';

const props = defineProps<{
    image: ImageData | null;
    holds: Hold[];
}>();

const container = useTemplateRef('container');
const canvas = useTemplateRef('canvas');

const scaleRatio = ref(1);

watch(() => props.image, loadImage);
watch(() => props.holds, loadImage, { deep: true });

const containerRect = computed<DOMRect>(() => {
    const containerEl = container.value!;
    const rect = containerEl.getBoundingClientRect();

    return rect;
});

onMounted(() => {
    loadImage();
});

function loadImage() {
    const canvasEl = canvas.value!;
    const imgData = props.image;

    if (!canvasEl || !imgData) {
        return;
    }

    const { width, height } = imgData;

    const rect = containerRect.value;
    const scale = Math.min(rect.width / width, rect.height / height);
    scaleRatio.value = scale;

    canvasEl.width = width;
    canvasEl.height = height;

    const context = canvasEl.getContext('2d')!;

    context.putImageData(imgData, 0, 0);

    drawHolds();
}

const bgHoldColor = '#ffffff33';
const borderHoldColor = '#000000ff';

function drawHolds() {
    const canvasEl = canvas.value!;
    const context = canvasEl.getContext('2d')!;

    if (!context) {
        return;
    }

    const holdList = props.holds;
    const lineWidth = Math.max(1, canvasEl.height / 1000);

    context.fillStyle = bgHoldColor;
    context.strokeStyle = borderHoldColor;
    context.lineWidth = lineWidth;
    context.textBaseline = 'middle';
    context.textAlign = 'center';

    holdList.forEach((hold) => {
        const positions = hold.position;
        const radius = hold.size;
        const maxTextWidth = 2 * (radius - 2 * lineWidth);
        context.save();
        context.font = `${radius}px serif`;

        /* draw line between holds */
        if (positions.length > 1) {
            context.save();
            context.strokeStyle = bgHoldColor;
            context.lineWidth = lineWidth * 5;
            context.beginPath();
            positions.forEach(([x, y], idx) => {
                if (idx) {
                    context.lineTo(x, y);
                } else {
                    context.moveTo(x, y);
                }
            });
            context.stroke();
            context.restore();
        }

        /* draw holds */
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

        context.restore();
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
