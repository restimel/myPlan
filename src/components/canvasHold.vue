<template>
    <div
        ref="container"
        class="canvas-container"
        :style="`--scale: ${scaleRatio};`"
        @scroll="scrollContainer"
    >
        <canvas
            ref="canvas"
            id="canvasPicture"
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
        <HoldMenu v-if="selectHold && (mouseAction === 'selection' || mouseAction === 'menu')"
            :hold="selectHold"
            :scale="scaleRatio"
            :canMove="mouseAction === 'selection'"
            :containerSize="containerRect"
            :offsetX="offsetX"
            :offsetY="offsetY"
            @close="closeMenu"
        />
        <GuideMessage :message="t('build.setHolds')" />
    </div>
    <footer class="footer-actions">
        <button
            @click="emit('back')"
            :title="t('action.anotherPhoto')"
        >
            <MyIcon icon="recapture" />
        </button>
        <button
            :disabled="holdList.length === 0"
            @click="removeHold()"
            :title="t('action.removeLast')"
        >
            <MyIcon icon="delete" />
        </button>
        <span class="separator"></span>
        <button
            @click="validate()"
            :disabled="holdList.length === 0"
            :title="t('action.validate')"
        >
            <MyIcon icon="view" />
        </button>
        <button
            @click="save()"
            :disabled="holdList.length === 0"
            :title="t('action.save')"
        >
            <MyIcon icon="save" />
        </button>
        <span class="info" v-if="debug">
            <input type="range" min="0.1" max="10" step="0.1" v-model="scaleRatio" />{{ Math.round(scaleRatio * 10) / 10 }}
        </span>
    </footer>
</template>
<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
    addHold,
    defaultHoldSize,
    doubleHold,
    holdList,
    linkHolds,
    moveHold,
    removeHold,
} from '@/utils/holds';
import { debug, log } from '@/utils/debug';
import { saveRoute } from '@/utils/storage';
import { drawHolds } from '@/utils/canvas/draw';
import HoldMenu from '@/components/holdMenu.vue';
import MyIcon from '@/components/myIcon.vue';
import GuideMessage from '@/components/guideMessage.vue';
import { exportImage } from '@/utils/files';
import { screenListener } from '@/utils/screenEvent';
import { setup, type ScreenAction } from '@/utils/screenStates';
import { hysterisPoint } from '@/utils/movePoint';

const props = defineProps<{
    image: ImageData | null;
}>();

const emit = defineEmits<{
    back: [];
    view: [];
}>();

const { t } = useI18n();

const container = useTemplateRef('container');
const canvas = useTemplateRef('canvas');
const canvasLayer = useTemplateRef('canvasLayer');

const scaleRatio = ref(1);
const updateRect = ref(0);
const offsetX = ref(0);
const offsetY = ref(0);

watch(() => props.image, loadImage);
watch(holdList, drawRoute, { deep: true });

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

    const canvasEl = canvas.value!;
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

function loadImage() {
    const canvasEl = canvas.value!;
    const canvasLayerEl = canvasLayer.value!;
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
    canvasLayerEl.width = width;
    canvasLayerEl.height = height;

    const context = canvasEl.getContext('2d')!;

    context.putImageData(imgData, 0, 0);

    /* This is to draw around 30 holds on height */
    defaultHoldSize.value = canvasLayerEl.height / 60;

    drawHolds(holdList.value, canvasLayerEl);
}

function setHold(point: Point) {
    addHold(point[0], point[1], defaultHoldSize.value);
}

function closeMenu() {
    mouseAction.value = 'none';
    selectHold.value = null;
}

function validate() {
    const image = props.image;

    if (!image) {
        return;
    }

    if (saveRoute(props.image, holdList.value)) {
        emit('view');
    }
}

function save() {
    /* Prepare the image (in only one canvas) */
    const imgData = props.image!;
    const canvasLayerEl = canvasLayer.value!;
    const context = canvasLayerEl.getContext('2d')!;
    context.putImageData(imgData, 0, 0);
    drawHolds(holdList.value, canvasLayerEl);

    /* Create the file an download it */
    exportImage(canvasLayerEl);

    /* restore the canvas */
    drawRoute();
}

function drawRoute() {
    drawHolds(holdList.value, canvasLayer.value!, {
        refresh: true,
        line: mouseAction.value === 'link' ?
            [
                selectHold.value!.position[0],
                lastPosition.value,
            ] : undefined,
        selectedHold: selectHold.value,
    });
}

/* {{{ Canvas interaction */

const screenState = setup(holdList, onAction);

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

watch(selectHold, drawRoute);
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

function onAction(action: ScreenAction, point: Point, fromPoint?: Point) {
    switch (action) {
        case 'setHold':
            setHold(point);
            break;
        case 'doubleHold':
            const holdIndex = screenState.holdSelection.value?.index ?? 0;
            doubleHold(holdIndex);
            break;
        case 'linkHolds': {
            const originHold = screenState.holdSelection.value;
            const targetHold = screenState.holdSelection2.value;

            if (originHold && targetHold) {
                linkHolds(originHold.index, targetHold.index);
            }
            break;
        }
        case 'moveHold': {
            const hold = screenState.holdSelection.value;

            if (hold) {
                const lastPoint = fromPoint ?? screenState.mousePosition.value;

                moveHold(hold.index, lastPoint, point);
                lastPosition.value = point;
            }
            break;
        }
        case 'scroll': {
            const [dx, dy] = scrollPoints(point);

            console.log('scroll:', dx, dy);
            if (!dx && !dy) {
                return;
            }

            offsetX.value += dx * scaleRatio.value;
            offsetY.value += dy * scaleRatio.value;

            lastPosition.value = point;
            break;
        }
        case 'zoom':
            log('error', 'Zoom: should be managed by another route');
            break;
        default:
            log('error', `TODO: Manage ${action}`);
    }
}

/* }}} */

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

.separator {
    width: var(--spacing-sm);
}
.info {
    font-size: 0.8em;
    color: var(--color-text-secondary);
}
</style>
