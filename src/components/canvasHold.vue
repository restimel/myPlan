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
            @mousedown="startInteraction"
            @mouseup="stopInteraction"
            @mousemove="move"
        ></canvas>
        <HoldMenu v-if="selectHold && (mouseAction === 'selection' || mouseAction === 'menu')"
            :hold="selectHold"
            :canMove="mouseAction === 'selection'"
            @close="mouseAction = 'none'"
        />
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
    doubleHold,
    getHold,
    holdList,
    linkHolds,
    moveHold,
    removeHold,
    resetHolds,
} from '@/utils/holds';
import { getDistance } from '@/utils/geometry';
import { debugMessage } from '@/utils/debug';
import HoldMenu from '@/components/holdMenu.vue';

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
const holdSize = ref(20);

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

    /* This is to draw around 35 holds on height */
    holdSize.value = canvasLayerEl.height / 70;
}

function setHold(point: Point) {
    addHold(point[0], point[1], holdSize.value);
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

        if (positions.length > 1) {
            context.save();
            context.strokeStyle = '#ffffff33';
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

/* {{{ Canvas interaction */

type MouseAction = 'none' | 'active' | 'selection' | 'menu' | 'move' | 'double' | 'link';

/** in ms */
const holdMouseDuration = 500;
const doubleMouseDuration = 200;

const mouseAction = ref<MouseAction>('none');
const lastPosition = ref<Point>([0, 0]);
const selectHold = ref<Hold | null>(null);
let interactionTimer = 0;

function getPosition(event: MouseEvent): Point {
    const canvasLayerEl = canvasLayer.value!;
    const rect = canvasLayerEl.getBoundingClientRect();
    const scale = scaleRatio.value;

    /* DOM position relative to the canvas element */
    const mouseX = Math.round(event.clientX - rect.left);
    const mouseY = Math.round(event.clientY - rect.top);

    /* position in the context of the canvas */
    const canvasX = mouseX / scale;
    const canvasY = mouseY / scale;

    return [canvasX, canvasY];
}

function startInteraction(event: MouseEvent) {
    const action = mouseAction.value;

    if (action === 'double' && selectHold.value) {
        doubleHold(selectHold.value?.index);
        selectHold.value = null;
        mouseAction.value = 'none';
        debugMessage.value = 'Interaction: (after double) none';
        return;
    }
    if (action === 'menu') {
        mouseAction.value = 'none';
        debugMessage.value = 'Interaction: none';
        return;
    }

    lastPosition.value = getPosition(event);
    mouseAction.value = 'active';

    const hold = getHold(lastPosition.value);

    if (hold) {
        selectHold.value = hold;
        interactionTimer = setTimeout(() => {
            mouseAction.value = 'selection';
            debugMessage.value = `Interaction: ${mouseAction.value} (hold: ${selectHold.value?.value}, ${selectHold.value?.position})`;
        }, holdMouseDuration);
    }

    debugMessage.value = `Interaction: ${mouseAction.value} (hold: ${selectHold.value?.value})`;
}

function stopInteraction(event: MouseEvent) {
    clearTimeout(interactionTimer);

    const position = getPosition(event);
    const action = mouseAction.value;
    const originHold = selectHold.value;

    switch (action) {
        case 'active':
            if (originHold) {
                mouseAction.value = 'double';

                interactionTimer = setTimeout(() => {
                    setHold(position);
                    debugMessage.value = `Interaction (done (timed)): ${mouseAction.value} (position: ${position})`;
                    mouseAction.value = 'none';
                    selectHold.value = null;
                }, doubleMouseDuration);

                debugMessage.value = `Interaction (done): ${mouseAction.value} (position: ${position})`;

                return;
            }

            setHold(position);
            debugMessage.value = `Interaction (done): ${action} (position: ${position})`;
            break;
        case 'selection':
            mouseAction.value = 'menu';
            debugMessage.value = `Interaction (done): ${mouseAction.value}`;
            return;
        case 'move':
            debugMessage.value = `Interaction (done): ${action}`;
            break;
        case 'link': {
            const targetHold = getHold(position);

            if (targetHold && originHold) {
                linkHolds(originHold.index, targetHold.index);
                debugMessage.value = `Interaction (done): ${action} (position: ${position})`;
            }
        }
    }

    mouseAction.value = 'none';
    selectHold.value = null;
}

function move(event: MouseEvent) {
    const action = mouseAction.value;
    const selectedHold = selectHold.value;

    if (action === 'none' || !selectedHold) {
        return;
    }

    const position = getPosition(event);
    switch (action) {
        case 'move':
            moveHold(selectedHold.index, lastPosition.value, position);
            lastPosition.value = position;
            debugMessage.value = `Interaction: move (hold: ${selectHold.value?.value} ${selectHold.value?.position})`;
            break;
        case 'active':
            clearTimeout(interactionTimer);

            /* ×2 is to reduce the threshold before moving it */
            if (getDistance(position, lastPosition.value) * 2 < holdSize.value ) {
                moveHold(selectedHold.index, lastPosition.value, position);
                lastPosition.value = position;
                mouseAction.value = 'move';
            }
            break;
        case 'selection':
            if (getDistance(position, lastPosition.value) < holdSize.value ) {
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
