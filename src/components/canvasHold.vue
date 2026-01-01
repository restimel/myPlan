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
            :class="{
                isDoingMagic: willApplyGrey,
            }"
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
            :store="routeStore"
            @close="closeMenu"
        />
        <GuideMessage :message="t('build.setHolds')" />
    </div>
    <footer class="footer-actions">
        <button v-show="!menuOpen"
            class="action"
            @click="menuAction('back')"
            :title="t('action.anotherPhoto')"
        >
            <MyIcon icon="recapture" />
        </button>
        <ActionMenu
            :actions="[
                {
                    type: 'back',
                    icon: 'recapture',
                },
                {
                    type: 'magicHold',
                    icon: 'magic',
                    active: willApplyGrey,
                },
                {
                    type: 'removeHold',
                    icon: 'delete',
                    disabled: store.holds.length === 0,
                    title: t('action.removeLast'),
                },
                {
                    type: 'save',
                    icon: 'save',
                    disabled: store.holds.length === 0,
                    title: t('action.save'),
                },
                {
                    type: 'validate',
                    icon: 'ok',
                    disabled: store.holds.length === 0,
                    title: t('action.validate'),
                },
            ]"
            @open="(value) => menuOpen = value"
            @action="menuAction"
        />
        <button v-show="!menuOpen"
            class="action"
            :disabled="store.holds.length === 0"
            @click="removeHold()"
            :title="t('action.removeLast')"
        >
            <MyIcon icon="delete" />
        </button>
        <span class="separator"></span>
        <button v-show="!menuOpen"
            class="action"
            @click="validate()"
            :disabled="store.holds.length === 0"
            :title="t('action.validate')"
        >
            <MyIcon icon="ok" />
        </button>
        <span class="info" v-if="debug">
            <input type="range" min="0.1" max="10" step="0.1" v-model="scaleRatio" />{{ Math.round(scaleRatio * 10) / 10 }}
        </span>

        <MyIcon v-if="highlightColor"
            icon="magic"
            class="status"
            @click="setGrey()"
        />
    </footer>
</template>
<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { debug, log } from '@/utils/debug';
import { saveRoute } from '@/utils/storage';
import { drawHolds } from '@/utils/canvas/draw';
import HoldMenu from '@/components/holdMenu.vue';
import ActionMenu from '@/components/viewer/actionsMenu.vue';
import MyIcon from '@/components/myIcon.vue';
import GuideMessage from '@/components/guideMessage.vue';
import { exportImage } from '@/utils/files';
import { screenListener } from '@/utils/screenEvent';
import { setup, type ScreenAction } from '@/utils/screenStates';
import { hysterisPoint } from '@/utils/movePoint';
import { filterToGrey, unsetGreyHold } from '@/utils/image';
import type { RouteStore } from '@/stores/RouteStore';
import routeStore from '@/stores/RouteStore';

const props = defineProps<{
    image: ImageData | null;
    store: RouteStore;
}>();

const emit = defineEmits<{
    back: [];
    view: [];
}>();

const { t } = useI18n();

const container = useTemplateRef('container');
const canvas = useTemplateRef('canvas');
const canvasLayer = useTemplateRef('canvasLayer');

const activeImage = ref<ImageData | null>(null);

const scaleRatio = ref(1);
const updateRect = ref(0);
const offsetX = ref(0);
const offsetY = ref(0);

const willApplyGrey = ref(false);
const highlightColor = ref(false);
const referenceColor = ref<ColorRGB>(props.store.settings.greyedImage.color ?? [0, 0, 0]);
const menuOpen = ref(false);

watch(() => props.image, () => {
    /* It will reset the effect on image and apply the image to canvas */
    setGrey();
});
watch(() => props.store.holds, drawRoute, { deep: true });

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

function menuAction(action: string) {
    switch (action) {
        case 'back':
            emit('back');
            break;
        case 'magicHold':
            toggleGrey();
            break;
        case 'removeHold':
            removeHold();
            break;
        case 'save':
            save();
            break;
        case 'validate':
            validate();
            break;
        default:
            /* eslint-disable-next-line no-console */
            console.warn('action "%s" non implemented yet', action);
    }
}

function loadImage(data?: ImageData) {
    const canvasEl = canvas.value!;
    const canvasLayerEl = canvasLayer.value!;
    let imgData: ImageData | undefined;

    if (!data) {
        const color = referenceColor.value;

        if (color && props.image) {
            imgData = filterToGrey(props.image, props.store.holds, color);
        }
    } else {
        imgData = data;
    }

    if (!canvasEl || !imgData) {
        activeImage.value = null;

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
    props.store.setDefaultSize(canvasLayerEl.height / 60);

    drawHolds(props.store.holds, canvasLayerEl);

    activeImage.value = imgData;
}

function removeHold() {
    props.store.removeHold();

    if (highlightColor.value) {
        loadImage();
    }
}

function setGrey(point?: Point) {
    const originImage = props.image;

    willApplyGrey.value = false;
    highlightColor.value = false;

    if (!originImage) {
        return;
    }

    if (!point) {
        props.store.setGrey();
        loadImage(originImage);

        return;
    }

    const pointIndex = (Math.round(point[0]) + Math.round(point[1]) * originImage.width) * 4;
    const color: ColorRGB = [
        originImage.data[pointIndex],
        originImage.data[pointIndex + 1],
        originImage.data[pointIndex + 2],
    ];

    if (color[0] === undefined) {
        log('warning', `No color [${pointIndex} / ${originImage.data.length}]`);
        loadImage(originImage);

        return;
    }

    referenceColor.value = color;

    const image = filterToGrey(originImage, props.store.holds, color);

    props.store.setGrey({
        color,
    });
    loadImage(image);

    highlightColor.value = true;
}

function setHold(point: Point) {
    if (willApplyGrey.value) {
        return setGrey(point);
    }

    const hold = props.store.addHold(point[0], point[1], props.store.defaultHoldSize);

    if (highlightColor.value && activeImage.value && props.image) {
        const image = unsetGreyHold(activeImage.value, props.image, hold);
        loadImage(image);
    }
}

function closeMenu() {
    mouseAction.value = 'none';
    selectHold.value = null;
}

function validate() {
    /* Save the original image in order to keep the color */
    const image = props.image;

    if (!image) {
        return;
    }

    const settings = {
        routeName: props.store.routeName,
        greyedImage: {
            color: highlightColor.value ? referenceColor.value : undefined,
        },
    };

    if (saveRoute(image, props.store.holds, settings)) {
        emit('view');
    }
}

function toggleGrey() {
    if (!willApplyGrey.value && highlightColor.value) {
        setGrey();

        return;
    }

    willApplyGrey.value = !willApplyGrey.value;
}

function save() {
    /* Prepare the image (in only one canvas) */
    const imgData = activeImage.value!;
    const canvasLayerEl = canvasLayer.value!;
    const context = canvasLayerEl.getContext('2d')!;
    context.putImageData(imgData, 0, 0);
    drawHolds(props.store.holds, canvasLayerEl);

    /* Create the file and download it */
    exportImage(canvasLayerEl);

    /* restore the canvas */
    drawRoute();
}

function drawRoute() {
    drawHolds(props.store.holds, canvasLayer.value!, {
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

const screenState = setup(props.store.holds, onAction);

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
            props.store.doubleHold(holdIndex);
            break;
        case 'linkHolds': {
            const originHold = screenState.holdSelection.value;
            const targetHold = screenState.holdSelection2.value;

            if (originHold && targetHold) {
                props.store.linkHolds(originHold.index, targetHold.index);
            }
            break;
        }
        case 'moveHold': {
            const hold = screenState.holdSelection.value;

            if (hold) {
                const lastPoint = fromPoint ?? screenState.mousePosition.value;

                props.store.moveHold(hold.index, lastPoint, point);
                lastPosition.value = point;
            }
            break;
        }
        case 'scroll': {
            const [dx, dy] = scrollPoints(point);

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

.isDoingMagic {
    cursor: url(@/assets/iconMagic.cur) 14 14, pointer;
}

.separator {
    width: var(--spacing-sm);
}
.info {
    font-size: 0.8em;
    color: var(--color-text-secondary);
}

.status {
    position: absolute;
    right: var(--spacing-lg);
    bottom: calc(var(--spacing-lg) + var(--button-size));
    background: var(--color-primary);
    color: var(--color-txt-primary);
    border-radius: 25px;
    cursor: pointer;
    --icon-size: 20px;
}
</style>
