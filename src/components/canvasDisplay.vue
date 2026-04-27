<template>
    <div class="canvas-wrapper">
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
                :class="layerClass"
                @mousedown="screenEvent"
                @touchstart="screenEvent"
                @mouseup="screenEvent"
                @touchend="screenEvent"
                @mousemove="screenEvent"
                @touchmove="screenEvent"
                @wheel.prevent="screenEvent"
            ></canvas>
        </div>
        <div class="canvas-overlay">
            <slot />
            <GuideMessage :message="message" />
        </div>
    </div>
</template>
<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { drawHolds, drawInformation } from '@/utils/canvas/draw';
import GuideMessage from '@/components/guideMessage.vue';
import { screenListener } from '@/utils/screenEvent';
import { setup, type ActionCb, type ScreenAction } from '@/utils/screenStates';
import { hysterisPoint } from '@/utils/movePoint';
import type { RouteStore } from '@/stores/RouteStore';
import { filterToGrey } from '@/utils/image';

const { locale, t } = useI18n();

const props = defineProps<{
    image: ImageData | null;
    message: string;
    details?: boolean;
    store: RouteStore;
    onAction: ActionCb;
    noGreyFilter?: boolean;
    layerClass?: string | Record<string, boolean>;
    holdTransform?: (point: Point) => Point;
}>();

const emit = defineEmits<{
    canvas: [Set<HTMLCanvasElement>];
    scaleRatio: [number];
    containerRect: [DOMRect];
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
const minScale = ref(0.1);
const updateRect = ref(0);
const offsetX = ref(0);
const offsetY = ref(0);
const holdList = computed(() => props.store.holds);

/*
 * Track image dimensions to detect genuine image changes vs filter-only updates.
 * Only reset zoom when the image dimensions change (i.e. a new photo was loaded).
 * When magic color reapplies a filter on the same image, dimensions are identical
 * and the zoom level should be preserved. 
 */
let prevImageSize = { width: 0, height: 0 };

watch(() => props.image, () => {
    const img = props.image;
    const newWidth = img?.width ?? 0;
    const dimensionsChanged = newWidth !== prevImageSize.width;

    prevImageSize = {
        width: img?.width ?? 0,
        height: img?.height ?? 0,
    };
    loadImage(undefined, dimensionsChanged);
});
watch(holdList, () => {
    loadImage(undefined, false);
}, { deep: true });
watch(() => props.store.settings, () => {
    loadImage(undefined, false);
}, { deep: true });

if (props.details) {
    watch(locale, () => {
        loadImage();
    });
}

/* assert ratio is in bound */
watch(scaleRatio, (value, oldValue) => {
    if (value < minScale.value) {
        scaleRatio.value = minScale.value;
    } else if (value > 10) {
        scaleRatio.value = 10;
    }

    if (scaleRatio.value !== oldValue) {
        forceUpdate();
    }

    emit('scaleRatio', scaleRatio.value);
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

    if (!containerEl) {
        return new DOMRect();
    }

    const rect = containerEl.getBoundingClientRect();

    return rect;
});
watch(containerRect, (value) => {
    emit('containerRect', value);
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

function loadImage(data?: ImageData | null, resetZoom = true) {
    const canvasImageEl = canvasImage.value!;
    const canvasHoldsEl = canvasHolds.value!;
    let imgData: ImageData | undefined;
    const color = props.noGreyFilter ? undefined : props.store.settings.greyedImage.color;
    const colorMargin = props.store.settings.greyedImage.colorMargin;

    if (!canvasImageEl || (!data && !props.image)) {
        activeImage.value = null;

        return;
    }

    if (color) {
        imgData = filterToGrey(data ?? props.image!, props.store.holds, color, colorMargin);
    } else {
        imgData = data ?? props.image!;
    }

    const { width, height } = imgData;

    if (resetZoom) {
        const rect = containerRect.value;
        const scale = Math.min(rect.width / width, rect.height / height);

        minScale.value = scale;
        scaleRatio.value = scale;
    }

    canvasImageEl.width = width;
    canvasImageEl.height = height;
    canvasHoldsEl.width = width;
    canvasHoldsEl.height = height;

    const context = canvasImageEl.getContext('2d')!;

    context.putImageData(imgData, 0, 0);

    if (resetZoom) {
        /* Set default hold size proportional to image height (~30 holds fit vertically) */
        props.store.setDefaultSize(canvasHoldsEl.height / 60);
    }

    drawRoute();
    if (props.details) {
        drawDetails();
    }

    activeImage.value = imgData;

    const listCanvas = new Set([canvasImageEl, canvasHoldsEl]);
    emit('canvas', listCanvas);
}

function drawRoute() {
    const transform = props.holdTransform;
    const holds = transform
        ? holdList.value.map(hold => ({ ...hold, position: hold.position.map(transform) as Point[] }))
        : holdList.value;

    const rawFirstPos = selectHold.value?.position[0];
    const firstPos = transform && rawFirstPos ? transform(rawFirstPos) : rawFirstPos;

    drawHolds(holds, canvasHolds.value!, {
        refresh: !props.details,
        line: !props.details && mouseAction.value === 'link' && firstPos ?
            [firstPos, lastPosition.value] : undefined,
        selectedHold: !props.details ? selectHold.value ?? undefined : undefined,
    });
}

function drawDetails() {
    drawInformation(holdList.value, props.store.settings, {
        canvasEl: canvasHolds.value,
        defaultHoldSize: props.store.defaultHoldSize,
        t,
    });
}

/* {{{ Canvas interaction */

const screenState = setup(holdList.value, (action: ScreenAction, point: Point, fromPoint?: Point) => {
    if (action === 'scroll' || (props.details && action === 'moveHold')) {
        const [dx = 0, dy = 0] = scrollPoints(point);

        if (!dx && !dy) {
            return;
        }

        const containerEl = container.value;

        if (containerEl) {
            containerEl.scrollLeft += dx * scaleRatio.value;
            containerEl.scrollTop += dy * scaleRatio.value;
        }

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
const selectHold2 = screenState.holdSelection2;
const mouseAction = screenState.actionState;
const lastPosition = screenState.mousePosition;
const scrollPoints = hysterisPoint(lastPosition.value);

watch(selectHold, () => {
    if (!props.details) {
        drawRoute();
    }
});
watch(lastPosition, () => {
    if (mouseAction.value !== 'link') {
        return;
    }

    if (props.details) {
        const [dx = 0, dy = 0] = scrollPoints(lastPosition.value);

        if (!dx && !dy) {
            return;
        }

        offsetX.value += dx * scaleRatio.value;
        offsetY.value += dy * scaleRatio.value;
    } else {
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

    /*
     * Apply the scroll delta after the new scale is rendered, and let the
     * browser clamp it to the valid scroll range. The scroll event then syncs
     * offsetX/offsetY to the actual scrollLeft/scrollTop, so the overlay math
     * stays consistent even when the requested delta is out of bounds. 
     */
    nextTick(() => {
        const containerEl = container.value;

        if (!containerEl) {
            return;
        }

        containerEl.scrollLeft += offsetDx;
        containerEl.scrollTop += offsetDy;
    });
}

/* }}} */

defineExpose({
    selectHold,
    selectHold2,
    mouseAction,
    offsetX,
    offsetY,
    scaleRatio,
    containerRect,
    clearSelection() {
        mouseAction.value = 'none';
        selectHold.value = null;
    },
});

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
    touch-action: none;
}

.canvas-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.canvas-container {
    position: absolute;
    inset: 0;
    overflow: auto;
    background: var(--color-bg-media);
}

.canvas-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

</style>
