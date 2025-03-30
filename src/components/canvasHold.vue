<template>
    <div
        ref="container"
        class="canvas-container"
        :style="`--scale: ${scaleRatio};`"
        @scroll="forceUpdate"
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
    </div>
    <footer class="footer-actions">
        <button
            @click="emit('back')"
            :title="t('action.anotherPhoto')"
        >
            <MyIcon icon="photo" />
        </button>
        <button
            :disabled="holdList.length === 0"
            @click="removeHold()"
            :title="t('action.removeLast')"
        >
            <MyIcon icon="delete" />
        </button>
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
    resetHolds,
} from '@/utils/holds';
import { getDistance } from '@/utils/geometry';
import { log } from '@/utils/debug';
import { saveRoute } from '@/utils/storage';
import { drawHolds } from '@/utils/canvas/draw';
import HoldMenu from '@/components/holdMenu.vue';
import MyIcon from '@/components/myIcon.vue';

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

watch(() => props.image, loadImage);
watch(holdList, drawRoute, { deep: true });
watch(scaleRatio, forceUpdate);

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

    resetHolds(); // probably not the good place (if we want to edit saved)

    context.putImageData(imgData, 0, 0);

    /* This is to draw around 30 holds on height */
    defaultHoldSize.value = canvasLayerEl.height / 60;
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
    const link: HTMLAnchorElement = document.createElement('a');
    link.href = canvasLayer.value!.toDataURL('image/png');
    link.download = 'myPlan.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

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
 *     └──┬───┘                                           │
 *        │         start / move (let default behavior)   │
 *        │start ┌──────────────────────────────────────►─┤
 *    ┌───▼────┐ │  end                                   │
 *    │ active ┼─┼────────────────────────► setHold ──────┤
 *    └───┬────┘                                          │
 *  ┌ ─ ─ ┼ ─ ─ ─ ┐ end ┌────────┐ 200 ms                 │
 *   HoldSelection ─────► double ┼────────► setHold ──────┤
 *  └ ─ ┬ ─ ─ ─┬─ ┘     └────┬───┘ start                  │
 *      │      │move         └────────────► doubleHold ───┤
 * 500ms│  ┌───▼──┐ end                                   │
 *      │  │ move ┼───────────────────────► moveHold ─────┤
 *      │  └──────┘                                       │
 *   ┌──▼────────┐   display                              │
 *   │ selection ┼─── menu                                │
 *   └──┬─────┬──┘                                        │
 *      │     │end                                        │
 *      │  ┌──▼───┐      actions                          │
 *  move│  │ menu ┼──────────────────────────────────────►┤
 *      │  └──┬───┘                                       │
 *      │     │          start                            │
 *      │     └──────────────────────────────────────────►┤
 *   ┌──▼───┐       end                                   │
 *   │ link ┼─────────────────────────────► linkHolds ────┘
 *   └──────┘
 */

type MouseAction = 'none' | 'active' | 'selection' | 'menu' | 'move' | 'double' | 'link';

/** in ms */
const holdMouseDuration = 500;
const doubleMouseDuration = 200;

const mouseAction = ref<MouseAction>('none');
const lastPosition = ref<Point>([0, 0]);
const selectHold = ref<Hold | null>(null);
let interactionTimer = 0;

watch(selectHold, drawRoute);
watch(lastPosition, () => {
    if (mouseAction.value === 'link') {
        drawRoute();
    }
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

function touchStart(event: TouchEvent) {
    const list = event.touches;

    if (list.length > 1) {
        mouseAction.value = 'none';
        return;
    }

    const position = getPosition(list[0]);

    startInteraction(position);

    if (selectHold.value) {
        event.preventDefault();
        log('time', `touchStart {${event.changedTouches[0].identifier}} (with hold)`);
    } else {
        log('time', 'touchStart (no hold)');
    }
}

function touchEnd(event: TouchEvent) {
    const list = event.changedTouches;
    const position = getPosition(list[0]);

    log('time', `touchEnd {${event.changedTouches[0].identifier}}`);

    stopInteraction(position);
    event.preventDefault();
}

function touchMove(event: TouchEvent) {
    const action = mouseAction.value;

    if (action === 'none') {
        return;
    }

    const selectedHold = selectHold.value;

    if (!selectedHold) {
        mouseAction.value = 'none';
        return;
    }

    const list = event.touches;
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
    const point = getPosition(event);

    startInteraction(point);
}

function mouseUp(event: MouseEvent) {
    const position = getPosition(event);

    stopInteraction(position);
}

function mouseMove(event: MouseEvent) {
    const position = getPosition(event);

    move(position);
}

function startInteraction(point: Point) {
    const action = mouseAction.value;

    if (action === 'double' && selectHold.value) {
        doubleHold(selectHold.value?.index);
        selectHold.value = null;
        mouseAction.value = 'none';
        log('Interaction', '(after double) none');
        return;
    }
    if (action === 'menu') {
        mouseAction.value = 'none';
        log('Interaction', 'none');
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
            log('Interaction', `${mouseAction.value} (hold: ${selectHold.value?.value}, ${selectHold.value?.position})`);
        }, holdMouseDuration);
        log('time', 'start startInteraction');
    } else {
        log('Interaction', `${mouseAction.value} (hold: ${selectHold.value?.value})`);
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
                    log('Interaction', `[done (timed)] ${mouseAction.value} (position: ${position})`);
                    mouseAction.value = 'none';
                    selectHold.value = null;
                }, doubleMouseDuration);

                log('Interaction', `[Done] ${mouseAction.value} (position: ${position})`);

                return;
            }

            setHold(position);
            log('Interaction', `[Done] ${action} (position: ${position})`);
            break;
        case 'selection':
            mouseAction.value = 'menu';
            log('Interaction', `[Done] ${mouseAction.value}`);
            return;
        case 'move':
            log('Interaction', `[Done] ${action}`);
            break;
        case 'link': {
            const targetHold = getHold(position);

            if (targetHold && originHold) {
                linkHolds(originHold.index, targetHold.index);
                log('Interaction', `[Done] ${action} (position: ${position})`);
            }
        }
    }

    mouseAction.value = 'none';
    selectHold.value = null;
}

function move(position: Point) {
    const action = mouseAction.value;
    const selectedHold = selectHold.value;

    if (action === 'none') {
        return;
    }

    if (!selectedHold) {
        mouseAction.value = 'none';
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

            /* ×2 is to reduce the threshold before moving it */
            if (distance * 2 > defaultHoldSize.value ) {
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
</style>
