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
            @mousedown="mouseDown"
            @touchstart="touchStart"
            @mouseup="mouseUp"
            @touchend="touchEnd"
            @mousemove="mouseMove"
            @touchmove="touchMove"
        ></canvas>
        <HoldMenu v-if="selectHold && (mouseAction === 'selection' || mouseAction === 'menu')"
            :hold="selectHold"
            :scale="scaleRatio"
            :canMove="mouseAction === 'selection'"
            :containerSize="containerRect"
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
    getHold,
    holdList,
    linkHolds,
    moveHold,
    removeHold,
} from '@/utils/holds';
import { getDistance, getMiddle } from '@/utils/geometry';
import { debug, log } from '@/utils/debug';
import { saveRoute } from '@/utils/storage';
import { drawHolds } from '@/utils/canvas/draw';
import HoldMenu from '@/components/holdMenu.vue';
import MyIcon from '@/components/myIcon.vue';
import GuideMessage from '@/components/guideMessage.vue';
import { exportImage } from '@/utils/files';
import { screenListener } from '@/utils/screenEvent';

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

/**
 *               start=mousedown/touchstart
 *               move=mousemove/touchmove
 *               end=mouseup/touchend
 *     ┌──────┐
 *     │ None ◄───────────────────────────────────────────┐
 *     └──┬───┘     move (default behavior: scroll)       │
 *        │      ┌───────────────────────────────────────►│
 *        │      │  start   ┌──────┐        end           │
 *        │start ├─────────►│ zoom ├─────────────────────►┤
 *    ┌───▼────┐ │  end     └──────┘                      │
 *    │ active ├─┼────────────────────────► setHold ──────┤
 *    └───┬────┘                                          │
 *  ┌ ─ ─ ┴ ─ ─ ─ ┐ end ┌────────┐ 200 ms                 │
 *   HoldSelection ─────► double ┼────────► setHold ──────┤
 *  └ ─ ┬ ─ ─ ─┬─ ┘     └────┬───┘ start                  │
 *      │      │move         └────────────► doubleHold ───┤
 * 500ms│  ┌───▼──┐ end                                   │
 *      │  │ move ┼───────────────────────► moveHold ─────┤
 *      │  └──────┘                                       │
 *   ┌──▼────────┐                                        │
 *   │ selection ├────────┐                               │
 *   └──┬─────┬──┘      display             actions       │
 *      │     │end       menu   ─────────────────────────►┤
 *      │  ┌──▼───┐       │                               │
 *  move│  │ menu ├───────┘                               │
 *      │  └──┬───┘                                       │
 *      │     │          start                            │
 *      │     └──────────────────────────────────────────►┤
 *   ┌──▼───┐       end                                   │
 *   │ link ├─────────────────────────────► linkHolds ────┘
 *   └──────┘
 */

 type MouseAction = 'none' | 'active' | 'selection' | 'menu' | 'move' | 'double' | 'link' | 'zoom';

/** in ms */
const holdMouseDuration = 500;
const doubleMouseDuration = 200;

/** The minimum ratio before applying the zoom */
const minimalZoomRatio = 1e-5;

const defaultPosition: Point = [0, 0];
const mouseAction = ref<MouseAction>('none');
const lastPosition = ref<Point>(defaultPosition);
const lastPosition2 = ref<Point>(defaultPosition);
let lastPositionIndex: number[] = [];
const selectHold = ref<Hold | null>(null);
let interactionTimer = 0;

let debugZoom = -1;

/* {{{ new event management */

const screenEvent = screenListener({
    rect: canvasRect,
    scale: scaleRatio,
    onStart: start,
    onEnd: end,
    onMove: moveContext,
    onZoom: zoomContext,
});

function start(positions: Point[]) {
    startInteraction(positions[0]);
}

function end(point: Point) {
    stopInteraction(point);
}

function moveContext(point: Point) {
    move(point);
}

function zoomContext(newRatio: number, offsetDx: number, offsetDy: number) {
    scaleRatio.value = newRatio;
    offsetX.value += offsetDx;
    offsetY.value += offsetDy;
}

/* }}} */

watch(selectHold, drawRoute);
watch(lastPosition, () => {
    if (mouseAction.value === 'link') {
        drawRoute();
    }
});

const minimalMovement = computed(() => {
    return defaultHoldSize.value / 2;
});

function getPosition(event: MouseEvent | Touch): Point {
    const rect = canvasRect.value;
    const scale = scaleRatio.value;

    /* DOM position relative to the canvas element */
    const mouseX = Math.round(event.clientX - rect.left);
    const mouseY = Math.round(event.clientY - rect.top);

    /* position in the context of the canvas */
    const canvasX = mouseX / scale;
    const canvasY = mouseY / scale;

    return [canvasX, canvasY];
}

function resetAction() {
    mouseAction.value = 'none';
    lastPosition.value = defaultPosition;
    lastPosition2.value = defaultPosition;
    lastPositionIndex = [];
    selectHold.value = null;
    debugZoom = -1;
}

function touchStart(event: TouchEvent) {
    if (debug.value?.featureNext) {
        return screenEvent(event);
    }

    const list = event.touches;

    if (list.length > 1) {
        if (mouseAction.value === 'active' && list.length === 2) {
            const newTouch = list[0].identifier === lastPositionIndex[0] ? list[1] : list[0];
            const position = getPosition(newTouch);

            lastPosition2.value = position;
            lastPositionIndex[1] = newTouch.identifier;

            mouseAction.value = 'zoom';
            event.preventDefault();

            return;
        }

        resetAction();
        return;
    }

    const position = getPosition(list[0]);
    lastPositionIndex[0] = list[0].identifier;

    startInteraction(position);

    if (selectHold.value) {
        event.preventDefault();
        log('time', `touchStart {${event.changedTouches[0].identifier}} (with hold)`);
    } else {
        log('time', 'touchStart (no hold)');
    }
}

function touchEnd(event: TouchEvent) {
    if (debug.value?.featureNext) {
        return screenEvent(event);
    }

    const list = event.changedTouches;
    const position = getPosition(list[0]);

    lastPositionIndex.splice(lastPositionIndex.indexOf(list[0].identifier));

    log('time', `touchEnd {${event.changedTouches[0].identifier}}`);

    stopInteraction(position);
    event.preventDefault();
}

function zoom(list: TouchList) {
    const lastP1 = list[0].identifier === lastPositionIndex[0] ? lastPosition.value : lastPosition2.value;
    const lastP2 = list[0].identifier === lastPositionIndex[0] ? lastPosition2.value : lastPosition.value;
    const newP1 = getPosition(list[0]);
    const newP2 = getPosition(list[1]);

    const oldDist = getDistance(lastP1, lastP2);
    const newDist = getDistance(newP1, newP2);
    const ratio = newDist / oldDist;

    let dist1 = 0;
    let dist2 = 0;
    if (debug.value?.featureNext) {
        dist1 = getDistance(lastP1, newP1);
        dist2 = getDistance(lastP2, newP2);


        const orientation = newDist > oldDist ? 1 : -1;
        const isSameOrientation = orientation === debugZoom;
        debugZoom = orientation;

        const areaInfo = [list[0].radiusX, list[0].radiusY, list[0].rotationAngle, list[0].force];
        log('zoom', `orientation: ${orientation}|d1:${dist1}(${dist1 * scaleRatio.value})|d2:${dist2}(${dist2*scaleRatio.value})|${minimalMovement.value}||${areaInfo.join(', ')}`);

        if (!isSameOrientation) {
            return;
        }
    }

    /* Avoid too small changes */
    if (Math.abs(1 - ratio) < minimalZoomRatio) {
        return;
    }

    const oldRatio = scaleRatio.value;
    const newRatio = oldRatio * ratio;

    const center = getMiddle(newP1, newP2);
    const offsetDx = center[0] * (newRatio - oldRatio);
    const offsetDy = center[1] * (newRatio - oldRatio);

    /* Apply transformation */
    scaleRatio.value = newRatio;
    offsetX.value += offsetDx;
    offsetY.value += offsetDy;

    /* save state for future event */
    lastPosition.value = newP1;
    lastPosition2.value = newP2;

}

function touchMove(event: TouchEvent) {
    if (debug.value?.featureNext) {
        return screenEvent(event);
    }

    const action = mouseAction.value;

    if (action === 'none') {
        return;
    }

    const list = event.touches;
    const selectedHold = selectHold.value;

    if (action === 'zoom') {
        event.preventDefault();

        zoom(list);

        return;
    }

    if (!selectedHold) {
        resetAction();
        return;
    }

    const position = getPosition(list[0]);

    if (action === 'active' || action === 'selection') {
        const distance = getDistance(lastPosition.value, position);
        const thresholdSize = selectedHold.size;

        if (distance * 2 < thresholdSize) {
            return;
        }

        log('time', `touch move {${event.changedTouches[0].identifier}} (${position} / ${distance})`);
    } else {
        log('time', `touch move {${event.changedTouches[0].identifier}} (${position})`);
    }

    move(position);
}

function mouseDown(event: MouseEvent) {
    if (debug.value?.featureNext) {
        return screenEvent(event);
    }

    const point = getPosition(event);

    startInteraction(point);
}

function mouseUp(event: MouseEvent) {
    if (debug.value?.featureNext) {
        return screenEvent(event);
    }

    const position = getPosition(event);

    stopInteraction(position);
}

function mouseMove(event: MouseEvent) {
    if (debug.value?.featureNext) {
        return screenEvent(event);
    }

    const position = getPosition(event);

    move(position);
}

function startInteraction(point: Point) {
    const action = mouseAction.value;

    if (action === 'double' && selectHold.value) {
        doubleHold(selectHold.value?.index);
        selectHold.value = null;
        resetAction();
        log('interaction', '(after double) none');
        return;
    }
    if (action === 'menu') {
        resetAction();
        log('interaction', 'none');
        return;
    }

    lastPosition.value = point;
    mouseAction.value = 'active';

    const hold = getHold(lastPosition.value);

    if (hold) {
        selectHold.value = hold;
        interactionTimer = setTimeout(() => {
            log('time', '(called) startInteraction');
            mouseAction.value = 'selection';
            log('interaction', `${mouseAction.value} (hold: ${selectHold.value?.value}, ${selectHold.value?.position})`);
        }, holdMouseDuration);
        log('time', 'start startInteraction');
    } else {
        log('interaction', `${mouseAction.value} (hold: ${selectHold.value?.value})`);
    }
}

function stopInteraction(position: Point) {
    clearTimeout(interactionTimer);
    log('time', '(stopped) stopInteraction');

    const action = mouseAction.value;
    const originHold = selectHold.value;

    switch (action) {
        case 'active':
            if (originHold) {
                mouseAction.value = 'double';

                interactionTimer = setTimeout(() => {
                    setHold(position);
                    log('interaction', `[done (timed)] ${mouseAction.value} (position: ${position})`);
                    resetAction();
                }, doubleMouseDuration);

                log('interaction', `[Done] ${mouseAction.value} (position: ${position})`);

                return;
            }

            setHold(position);
            log('interaction', `[Done] ${action} (position: ${position})`);
            break;
        case 'selection':
            mouseAction.value = 'menu';
            log('interaction', `[Done] ${mouseAction.value}`);
            return;
        case 'move':
            log('interaction', `[Done] ${action}`);
            break;
        case 'link': {
            const targetHold = getHold(position);

            if (targetHold && originHold) {
                linkHolds(originHold.index, targetHold.index);
                log('interaction', `[Done] ${action} (position: ${position})`);
            }
        }
    }

    resetAction();
}

function move(position: Point) {
    const action = mouseAction.value;
    const selectedHold = selectHold.value;

    if (action === 'none') {
        return;
    }

    if (!selectedHold) {
        resetAction();
        return;
    }

    switch (action) {
        case 'move':
            moveHold(selectedHold.index, lastPosition.value, position);
            lastPosition.value = position;
            break;
        case 'link':
            lastPosition.value = position;
            break;
        case 'active': {
            const distance = getDistance(position, lastPosition.value);
            clearTimeout(interactionTimer);
            log('time', '(stopped) move');

            if (distance > minimalMovement.value ) {
                moveHold(selectedHold.index, lastPosition.value, position);
                lastPosition.value = position;
                mouseAction.value = 'move';
            }
            break;
        }
        case 'selection':
            if (getDistance(position, lastPosition.value) > defaultHoldSize.value ) {
                lastPosition.value = position;
                mouseAction.value = 'link';
            }
            break;
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
