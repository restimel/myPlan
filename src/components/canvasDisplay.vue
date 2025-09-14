<template>
    <div
        ref="container"
        class="canvas-container"
        :style="`--scale: ${scaleRatio};`"
        @scroll="scrollContainer"
    >
        <canvas
            ref="canvasBackground"
            id="canvasBackground"
        ></canvas>
        <canvas
            ref="canvasLayer"
            id="canvasLayer"

            @mousedown="screenEvent"
            @touchstart="screenEvent"
            @mouseup="screenEvent"
            @touchend="screenEvent"
            @mousemove="screenEvent"
            @touchmove="screenEvent"
        ></canvas>
        <GuideMessage :message="message" />
    </div>
</template>
<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
    defaultHoldSize,
} from '@/utils/holds';
import { drawHolds, drawInformation } from '@/utils/canvas/draw';
import GuideMessage from '@/components/guideMessage.vue';
import { screenListener } from '@/utils/screenEvent';
import { setup, type ActionCb, type ScreenAction } from '@/utils/screenStates';
import { hysterisPoint } from '@/utils/movePoint';
import type { RouteStore } from '@/stores/RouteStore';

const { locale, t } = useI18n();

const props = defineProps<{
    image: ImageData | null;
    message: string;
    details?: boolean;
    store: RouteStore;
    onAction: ActionCb;
}>();

const emit = defineEmits<{
    canvas: [Set<HTMLCanvasElement>];
}>();

const container = useTemplateRef('container');
const canvasBackground = useTemplateRef('canvasBackground');
const canvasLayer = useTemplateRef('canvasLayer');
const canvasImage = computed(() => {
    if (props.details) {
        return canvasLayer.value;
    }

    return canvasBackground.value;
});
const canvasHolds = computed(() => {
    return canvasLayer.value;
});

const activeImage = ref<ImageData | null>(null);

const scaleRatio = ref(1);
const updateRect = ref(0);
const offsetX = ref(0);
const offsetY = ref(0);
const holdList = computed(() => props.store.holds);

watch(() => props.image, loadImage);
watch(holdList, () => {
    loadImage();
}, { deep: true });
watch(() => props.store.settings, () => {
    loadImage();
}, { deep: true });

if (props.details) {
    watch(locale, () => {
        loadImage();
    });
}

/* assert ratio is in bound */
watch(scaleRatio, (value, oldValue) => {
    if (value < 0.1) {
        scaleRatio.value = 0.1;
    } else if (value > 10) {
        scaleRatio.value = 10;
    }

    if (scaleRatio.value !== oldValue) {
        forceUpdate();
    }
});

/* update the offset (related to zoom) */
watch([offsetX, offsetY], () => {
    const containerEl = container.value;

    containerEl?.scrollTo(offsetX.value, offsetY.value);
    forceUpdate();
});

const containerRect = computed<DOMRect>(() => {
    /* eslint-disable-next-line @typescript-eslint/no-unused-expressions -- used to force computation again */
    updateRect.value;

    const containerEl = container.value!;
    const rect = containerEl.getBoundingClientRect();

    return rect;
});

const canvasRect = computed<DOMRect>(() => {
    /* eslint-disable-next-line @typescript-eslint/no-unused-expressions -- used to force computation again */
    updateRect.value;

    const canvasEl = canvasBackground.value!;
    const rect = canvasEl.getBoundingClientRect();

    return rect;
});

function forceUpdate() {
    updateRect.value++;
}

function scrollContainer() {
    const containerEl = container.value!;

    offsetX.value = containerEl.scrollLeft;
    offsetY.value = containerEl.scrollTop;
}

let observer: ResizeObserver;

onMounted(() => {
    observer = new ResizeObserver(() => {
        forceUpdate();
    });

    if (container.value) {
        observer.observe(container.value);
    }

    loadImage();
});

onBeforeUnmount(() => {
    observer?.disconnect();
});

function loadImage(data?: ImageData | null) {
    const canvasImageEl = canvasImage.value!;
    const canvasHoldsEl = canvasHolds.value!;
    const imgData = data ?? props.image;

    if (!canvasImageEl || !imgData) {
        activeImage.value = null;

        return;
    }

    const { width, height } = imgData;

    const rect = containerRect.value;
    const scale = Math.min(rect.width / width, rect.height / height);
    scaleRatio.value = scale;

    canvasImageEl.width = width;
    canvasImageEl.height = height;
    canvasHoldsEl.width = width;
    canvasHoldsEl.height = height;

    const context = canvasImageEl.getContext('2d')!;

    context.putImageData(imgData, 0, 0);

    /* This is to draw around 30 holds on height */
    defaultHoldSize.value = canvasHoldsEl.height / 60;

    drawRoute();
    if (props.details) {
        drawDetails();
    }

    activeImage.value = imgData;

    const listCanvas = new Set([canvasImageEl, canvasHoldsEl]);
    emit('canvas', listCanvas);
}

function drawRoute() {
    drawHolds(holdList.value, canvasHolds.value!, {
        refresh: !props.details,
        /*
         * line: mouseAction.value === 'link' ?
         *     [
         *         selectHold.value!.position[0],
         *         lastPosition.value,
         *     ] : undefined,
         * selectedHold: selectHold.value,
         */
    });
}

function drawDetails() {
    drawInformation(holdList.value, props.store.settings, {
        canvasEl: canvasHolds.value,
        defaultHoldSize: defaultHoldSize.value,
        t,
    });
}

/* {{{ Canvas interaction */

const screenState = setup(holdList, (action: ScreenAction, point: Point, fromPoint?: Point) => {
    if (action === 'scroll') {
        const [dx, dy] = scrollPoints(point);

        if (!dx && !dy) {
            return;
        }

        offsetX.value += dx * scaleRatio.value;
        offsetY.value += dy * scaleRatio.value;

        lastPosition.value = point;

        return;
    }

    props.onAction(action, point, fromPoint);
});

const screenEvent = screenListener({
    rect: canvasRect,
    scale: scaleRatio,
    onStart: start,
    onEnd: end,
    onMove: moveContext,
    onZoom: zoomContext,
});

const selectHold = screenState.holdSelection;
const mouseAction = screenState.actionState;
const lastPosition = screenState.mousePosition;
const scrollPoints = hysterisPoint(lastPosition.value);

watch(selectHold, () => {
    if (!props.details) {
        drawRoute();
    }
});
watch(lastPosition, () => {
    if (mouseAction.value === 'link') {
        drawRoute();
    }
});

function start(positions: Point[]) {
    const lastPoint = positions.at(-1)!;
    screenState.startInteraction(lastPoint);
    scrollPoints.reset(lastPoint);
}

function end(point: Point) {
    screenState.stopInteraction(point);
}

function moveContext(point: Point, fromPoint: Point, distance: number, event: Event) {
    screenState.moveInteraction(point, fromPoint, event);
}

function zoomContext(newRatio: number, offsetDx: number, offsetDy: number) {
    scaleRatio.value = newRatio;
    offsetX.value += offsetDx;
    offsetY.value += offsetDy;
}

/* }}} */

</script>
<style scoped>
#canvasLayer,
#canvasBackground {
    position: absolute;
    grid-area: content;
    transform: scale(var(--scale));
    transform-origin: top left;
}

#canvasBackground {
    z-index: var(--zIndex-bg-canvas);
    background-color: var(--color-background);
}

#canvasLayer {
    z-index: var(--zIndex-fg-canvas);
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
