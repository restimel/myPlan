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
    <RouteMenu @action="action" />
</template>
<script lang="ts" setup>
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useRouter } from 'vue-router';
import { drawHolds, drawInformation } from '@/utils/canvas/draw';
import { exportImage } from '@/utils/files';
import { defaultHoldSize, load } from '@/utils/holds';
import RouteMenu, { type Action } from '@/components/viewer/routeMenu.vue';

const props = defineProps<{
    image: ImageData | null;
    holds: Hold[];
}>();

const router = useRouter();

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

    drawRoute();
    drawDetails();
}

function drawRoute() {
    drawHolds(props.holds, canvas.value!);
}

function drawDetails() {
    drawInformation(props.holds, canvas.value, defaultHoldSize.value);
}

function action(type: Action) {
    switch (type) {
        case 'edit':
            load({
                holds: props.holds,
                image: props.image!,
            });

            router.push('/build');

            break;
        case 'exportFile': {
            const canvasEl = canvas.value!;

            exportImage(canvasEl, 'finalRoute.png');
        }
    }
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
