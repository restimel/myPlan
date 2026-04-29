<template>
    <div class="canvas-wrapper">
        <div
            ref="container"
            class="canvas-container"
            :style="`--canvas-w: ${canvasDisplayWidth}px; --canvas-h: ${canvasDisplayHeight}px;`"
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
        <div v-if="debug" class="scroll-debug">
            <div>scale={{ scaleRatio.toFixed(3) }} min={{ minScale.toFixed(3) }}</div>
            <div>scroll=({{ Math.round(offsetX) }}, {{ Math.round(offsetY) }}) of ({{ scrollSize.width }}×{{ scrollSize.height }})</div>
            <div>client=({{ scrollSize.clientWidth }}×{{ scrollSize.clientHeight }})</div>
            <div>last_dx={{ debugScroll.dx.toFixed(1) }} dy={{ debugScroll.dy.toFixed(1) }} (img px)</div>
            <div>scroll_Δ=({{ debugScroll.scrollDx.toFixed(1) }}, {{ debugScroll.scrollDy.toFixed(1) }}) (CSS px)</div>
            <div>screen_Δ=({{ debugScroll.screenDx.toFixed(1) }}, {{ debugScroll.screenDy.toFixed(1) }}) (px)</div>
            <div>filter: dist={{ scrollPoints.debug.distance.toFixed(1) }} old={{ scrollPoints.debug.oldDistance.toFixed(1) }} thr={{ scrollPoints.debug.threshold.toFixed(2) }} Δa={{ (scrollPoints.debug.diffAngle * 180 / Math.PI).toFixed(0) }}°</div>
            <div>drops/pass={{ scrollPoints.debug.drops }}/{{ scrollPoints.debug.passes }} {{ scrollPoints.debug.dropped ? '(DROPPED)' : '' }}</div>
            <br>
            <div @click="logDebug = !logDebug">log: {{ logging }}</div>
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
import { debug, log } from '@/utils/debug';
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
const imageWidth = ref(0);
const imageHeight = ref(0);
const canvasDisplayWidth = computed(() => imageWidth.value * scaleRatio.value);
const canvasDisplayHeight = computed(() => imageHeight.value * scaleRatio.value);
const holdList = computed(() => props.store.holds);

const logDebug = ref(false);
const logging = computed(() => {
    if (!logDebug.value) {
        return 'OFF';
    }

    const logInteraction = [
        `scale=${scaleRatio.value.toFixed(3)} min=${minScale.value.toFixed(3)}`,
        `scroll=(${Math.round(offsetX.value)}, ${Math.round(offsetY.value)}) of (${scrollSize.value.width}×${scrollSize.value.height})`,
        `client=(${scrollSize.value.clientWidth}×${scrollSize.value.clientHeight})`,
        `last_dx=${debugScroll.value.dx.toFixed(1)} dy=${debugScroll.value.dy.toFixed(1)} (img px)`,
        `scroll_Δ=(${debugScroll.value.scrollDx.toFixed(1)}, ${debugScroll.value.scrollDy.toFixed(1)}) (CSS px)`,
        `screen_Δ=(${debugScroll.value.screenDx.toFixed(1)}, ${debugScroll.value.screenDy.toFixed(1)}) (px)`,
        `filter: dist=${scrollPoints.debug.distance.toFixed(1)} old=${scrollPoints.debug.oldDistance.toFixed(1)} thr=${scrollPoints.debug.threshold.toFixed(2)} Δa=${(scrollPoints.debug.diffAngle * 180 / Math.PI).toFixed(0)}°`,
        `drops/pass=${scrollPoints.debug.drops}/${scrollPoints.debug.passes} ${scrollPoints.debug.dropped ? '(DROPPED)' : ''}`,
    ];

    log('interaction', logInteraction.join(' ~~ '));

    return 'ON';
});

const debugScroll = ref({
    dx: 0, dy: 0,
    scrollDx: 0, scrollDy: 0,
    screenDx: 0, screenDy: 0,
});

type ScrollSize = {
    width: number;
    height: number;
    clientWidth: number;
    clientHeight: number;
};

const scrollSize = computed<ScrollSize>(() => {
    /* eslint-disable-next-line @typescript-eslint/no-unused-expressions -- forces recomputation */
    updateRect.value;
    const el = container.value;

    if (!el) {
        return {
            width: 0,
            height: 0,
            clientWidth: 0,
            clientHeight: 0,
        };
    }

    return {
        width: el.scrollWidth,
        height: el.scrollHeight,
        clientWidth: el.clientWidth,
        clientHeight: el.clientHeight,
    };
});

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
    const newHeight = img?.height ?? 0;
    const dimensionsChanged = newWidth !== prevImageSize.width || newHeight !== prevImageSize.height;

    prevImageSize = {
        width: newWidth,
        height: newHeight,
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
        offsetX.value = 0;
        offsetY.value = 0;
    }

    canvasImageEl.width = width;
    canvasImageEl.height = height;
    canvasHoldsEl.width = width;
    canvasHoldsEl.height = height;
    imageWidth.value = width;
    imageHeight.value = height;

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
        /*
         * Use the per-frame delta from screenEvent (fromPoint→point) directly.
         * Both points are converted with the same current rect, so any
         * scroll-induced rect change between events cancels out in the delta.
         */
        const dx = fromPoint ? fromPoint[0] - point[0] : 0;
        const dy = fromPoint ? fromPoint[1] - point[1] : 0;

        if (debug.value) {
            const scaleVal = scaleRatio.value;

            debugScroll.value = {
                dx, dy,
                scrollDx: dx * scaleVal,
                scrollDy: dy * scaleVal,
                screenDx: -dx * scaleVal,
                screenDy: -dy * scaleVal,
            };
        }

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
    minScale,
    containerRect,
    clearSelection() {
        mouseAction.value = 'none';
        selectHold.value = null;
    },
    resetZoom() {
        scaleRatio.value = minScale.value;
        offsetX.value = 0;
        offsetY.value = 0;
    },
});

</script>
<style scoped>
#canvasLayer,
#canvasBackground {
    position: absolute;
    top: 0;
    left: 0;
    width: var(--canvas-w);
    height: var(--canvas-h);
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

.scroll-debug {
    position: absolute;
    top: var(--spacing-xs);
    right: var(--spacing-xs);
    background: rgba(0, 0, 0, 0.7);
    color: #0f0;
    font-family: monospace;
    font-size: 10px;
    padding: 4px 6px;
    line-height: 1.3;
    z-index: var(--zIndex-modal);
    border-radius: 3px;
    white-space: nowrap;
}

</style>
