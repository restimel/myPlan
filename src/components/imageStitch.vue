<template>
    <div class="stitch-wrapper">
        <canvas
            ref="previewRef"
            class="preview"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
        />
        <GuideMessage :message="t('build.stitchImages')" />
    </div>
    <footer class="footer-actions">
        <button
            class="action"
            @click="emit('cancel')"
            :title="t('action.cancel')"
        >
            <MyIcon icon="cancel" />
        </button>
        <button
            class="action"
            @click="validate()"
            :title="t('action.validate')"
        >
            <MyIcon icon="ok" />
        </button>
    </footer>
</template>

<script lang="ts" setup>
import { onMounted, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import MyIcon from '@/components/myIcon.vue';
import GuideMessage from '@/components/guideMessage.vue';
import { stitchImages } from '@/utils/image';

const props = defineProps<{
    imageTop: ImageData;
    imageBottom: ImageData;
    /* Which image is the newly captured one (the one the user expects to move) */
    movableImage: 'top' | 'bottom';
}>();

const emit = defineEmits<{
    merged: [ImageData, number, number];
    cancel: [];
}>();

const { t } = useI18n();

const previewRef = useTemplateRef<HTMLCanvasElement>('previewRef');

const HANDLE_RADIUS = 18;
const MAX_ANGLE = 45;
/* Default overlap: bottom 30% of imageTop overlaps top of imageBottom */
const DEFAULT_OVERLAP_RATIO = 0.3;

const COLOR_SEPARATOR = 'white';
const COLOR_HANDLE_STROKE = 'rgba(0, 0, 0, 0.6)';
const COLOR_HANDLE_POSITION = 'rgba(255, 255, 255, 0.85)';
const COLOR_HANDLE_ROTATION = 'rgba(180, 200, 255, 0.85)';
const COLOR_HANDLE_MOVE = 'rgba(255, 220, 100, 0.85)';
const COLOR_ARROW_FILL = 'white';

/* All positions stored in actual image pixel coordinates */
let cutYImg = 0;       /* separator Y, in image pixels */
let cutAngle = 0;      /* degrees -45..45 */
let imageOffsetX = 0;  /* imageBottom horizontal shift, image pixels */
let imageOffsetY = 0;  /* imageBottom vertical start, image pixels */

/* Off-screen canvases for the two images */
const topCanvas = document.createElement('canvas');
const bottomCanvas = document.createElement('canvas');

type DragMode = 'position' | 'rotation' | 'move' | null;
let dragMode: DragMode = null;
let lastClientX = 0;
let lastClientY = 0;

function setupOffscreen() {
    topCanvas.width = props.imageTop.width;
    topCanvas.height = props.imageTop.height;
    topCanvas.getContext('2d')!.putImageData(props.imageTop, 0, 0);

    bottomCanvas.width = props.imageBottom.width;
    bottomCanvas.height = props.imageBottom.height;
    bottomCanvas.getContext('2d')!.putImageData(props.imageBottom, 0, 0);
}

function initState() {
    imageOffsetX = 0;
    imageOffsetY = Math.round(props.imageTop.height * (1 - DEFAULT_OVERLAP_RATIO));
    cutYImg = Math.round((imageOffsetY + props.imageTop.height) / 2);
    cutAngle = 0;
}

/*
 * Returns the scale factor: image pixels → canvas pixels.
 * Uses a fixed total height (no overlap) so scale doesn't change when the user drags.
 */
function getImageScale(): number {
    const previewEl = previewRef.value!;
    const container = previewEl.parentElement!;
    const imageWidth = Math.max(props.imageTop.width, props.imageBottom.width);
    const totalH = props.imageTop.height + props.imageBottom.height;

    return Math.min(container.clientWidth / imageWidth, container.clientHeight / totalH);
}

function drawArrow(ctx: CanvasRenderingContext2D, angleDeg: number) {
    const armLen = HANDLE_RADIUS * 0.75;
    const headH = HANDLE_RADIUS * 0.32;
    const headW = HANDLE_RADIUS * 0.42;
    const stemW = HANDLE_RADIUS * 0.16;
    const innerGap = HANDLE_RADIUS * 0.1;

    ctx.save();
    ctx.rotate((angleDeg * Math.PI) / 180);
    ctx.beginPath();
    ctx.moveTo(0, -armLen);
    ctx.lineTo(-headW / 2, -(armLen - headH));
    ctx.lineTo(-stemW / 2, -(armLen - headH));
    ctx.lineTo(-stemW / 2, -innerGap);
    ctx.lineTo(stemW / 2, -innerGap);
    ctx.lineTo(stemW / 2, -(armLen - headH));
    ctx.lineTo(headW / 2, -(armLen - headH));
    ctx.closePath();
    ctx.fillStyle = COLOR_ARROW_FILL;
    ctx.fill();
    ctx.strokeStyle = COLOR_HANDLE_STROKE;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.restore();
}

function drawMoveHandle(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    ctx.beginPath();
    ctx.arc(cx, cy, HANDLE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = COLOR_HANDLE_MOVE;
    ctx.fill();
    ctx.strokeStyle = COLOR_HANDLE_STROKE;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    drawArrow(ctx, 0);
    drawArrow(ctx, 90);
    drawArrow(ctx, 180);
    drawArrow(ctx, 270);
    ctx.restore();
}

function drawPreview() {
    const previewEl = previewRef.value;

    if (!previewEl) {
        return;
    }

    const imageWidth = Math.max(props.imageTop.width, props.imageBottom.width);
    const totalH = imageOffsetY + props.imageBottom.height;
    const scale = getImageScale();
    const width = Math.round(imageWidth * scale);
    const height = Math.round(totalH * scale);

    previewEl.width = width;
    previewEl.height = height;

    const ctx = previewEl.getContext('2d')!;
    const topW = Math.round(props.imageTop.width * scale);
    const topH = Math.round(props.imageTop.height * scale);
    const bottomW = Math.round(props.imageBottom.width * scale);
    const bottomH = Math.round(props.imageBottom.height * scale);
    const offsetXPrev = Math.round(imageOffsetX * scale);
    const offsetYPrev = Math.round(imageOffsetY * scale);
    const midY = Math.round(cutYImg * scale);
    const rad = (cutAngle * Math.PI) / 180;
    const slope = Math.tan(rad);
    const leftY = midY - slope * (width / 2);
    const rightY = midY + slope * (width / 2);

    ctx.clearRect(0, 0, width, height);

    /* Top image — clipped above separator */
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, rightY);
    ctx.lineTo(0, leftY);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(topCanvas, 0, 0, topW, topH);
    ctx.restore();

    /* Bottom image — clipped below separator, placed at offset position */
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, leftY);
    ctx.lineTo(width, rightY);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(bottomCanvas, offsetXPrev, offsetYPrev, bottomW, bottomH);
    ctx.restore();

    /* Separator line */
    ctx.beginPath();
    ctx.moveTo(0, leftY);
    ctx.lineTo(width, rightY);
    ctx.strokeStyle = COLOR_SEPARATOR;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Position handle — center of separator */
    ctx.beginPath();
    ctx.arc(width / 2, midY, HANDLE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = COLOR_HANDLE_POSITION;
    ctx.fill();
    ctx.strokeStyle = COLOR_HANDLE_STROKE;
    ctx.lineWidth = 1;
    ctx.stroke();

    /* Rotation handle — right edge of separator */
    const rhx = width - HANDLE_RADIUS - 4;

    ctx.beginPath();
    ctx.arc(rhx, rightY, Math.round(HANDLE_RADIUS * 0.75), 0, Math.PI * 2);
    ctx.fillStyle = COLOR_HANDLE_ROTATION;
    ctx.fill();
    ctx.strokeStyle = COLOR_HANDLE_STROKE;
    ctx.lineWidth = 1;
    ctx.stroke();

    /* Move handle — center of the movable image */
    const moveHx = props.movableImage === 'top'
        ? Math.round(topW / 2)
        : offsetXPrev + Math.round(bottomW / 2);
    const moveHy = props.movableImage === 'top'
        ? Math.round(topH / 2)
        : offsetYPrev + Math.round(bottomH / 2);

    drawMoveHandle(ctx, moveHx, moveHy);
}

function canvasPoint(evt: PointerEvent): [number, number] {
    const previewEl = previewRef.value!;
    const rect = previewEl.getBoundingClientRect();

    return [
        (evt.clientX - rect.left) * (previewEl.width / rect.width),
        (evt.clientY - rect.top) * (previewEl.height / rect.height),
    ];
}

function onPointerDown(evt: PointerEvent) {
    const previewEl = previewRef.value!;
    const [px, py] = canvasPoint(evt);
    const { width } = previewEl;
    const scale = getImageScale();
    const midY = Math.round(cutYImg * scale);
    const slope = Math.tan((cutAngle * Math.PI) / 180);
    const rightY = midY + slope * (width / 2);
    const rhx = width - HANDLE_RADIUS - 4;
    const rhr = Math.round(HANDLE_RADIUS * 0.75);
    const offsetXPrev = Math.round(imageOffsetX * scale);
    const offsetYPrev = Math.round(imageOffsetY * scale);
    const topW = Math.round(props.imageTop.width * scale);
    const topH = Math.round(props.imageTop.height * scale);
    const bottomW = Math.round(props.imageBottom.width * scale);
    const bottomH = Math.round(props.imageBottom.height * scale);
    const moveHx = props.movableImage === 'top'
        ? Math.round(topW / 2)
        : offsetXPrev + Math.round(bottomW / 2);
    const moveHy = props.movableImage === 'top'
        ? Math.round(topH / 2)
        : offsetYPrev + Math.round(bottomH / 2);
    const dxPos = px - width / 2;
    const dyPos = py - midY;
    const dxRot = px - rhx;
    const dyRot = py - rightY;
    const dxMove = px - moveHx;
    const dyMove = py - moveHy;

    /* Check move handle first (it may overlap overlap zone) */
    if (dxMove * dxMove + dyMove * dyMove <= HANDLE_RADIUS * HANDLE_RADIUS) {
        dragMode = 'move';
        lastClientX = evt.clientX;
        lastClientY = evt.clientY;
        (evt.currentTarget as Element).setPointerCapture(evt.pointerId);

        return;
    }

    /* Check position handle */
    if (dxPos * dxPos + dyPos * dyPos <= HANDLE_RADIUS * HANDLE_RADIUS) {
        dragMode = 'position';
        lastClientY = evt.clientY;
        (evt.currentTarget as Element).setPointerCapture(evt.pointerId);

        return;
    }

    /* Check rotation handle */
    if (dxRot * dxRot + dyRot * dyRot <= rhr * rhr) {
        dragMode = 'rotation';
        lastClientY = evt.clientY;
        (evt.currentTarget as Element).setPointerCapture(evt.pointerId);
    }
}

function onPointerMove(evt: PointerEvent) {
    if (!dragMode) {
        return;
    }

    const previewEl = previewRef.value!;
    const { width } = previewEl;
    const rect = previewEl.getBoundingClientRect();
    const deltaClientX = evt.clientX - lastClientX;
    const deltaClientY = evt.clientY - lastClientY;

    lastClientX = evt.clientX;
    lastClientY = evt.clientY;

    if (dragMode === 'position') {
        const totalH = imageOffsetY + props.imageBottom.height;
        const deltaImg = deltaClientY * totalH / rect.height;
        const minCut = imageOffsetY;
        const maxCut = props.imageTop.height;

        cutYImg = Math.max(minCut, Math.min(maxCut, cutYImg + deltaImg));
    } else if (dragMode === 'move') {
        const totalH = props.imageTop.height + props.imageBottom.height;
        const imageWidth = Math.max(props.imageTop.width, props.imageBottom.width);
        const deltaImgY = deltaClientY * totalH / rect.height;
        const deltaImgX = deltaClientX * imageWidth / rect.width;
        const maxOffsetY = props.imageTop.height;
        /* When moving imageTop, invert deltas so the movable image follows the handle */
        const sign = props.movableImage === 'top' ? -1 : 1;

        imageOffsetY = Math.max(0, Math.min(maxOffsetY, imageOffsetY + sign * deltaImgY));
        imageOffsetX += sign * deltaImgX;
        /* Keep separator in the overlap zone */
        cutYImg = Math.max(imageOffsetY, Math.min(props.imageTop.height, cutYImg));
    } else if (dragMode === 'rotation') {
        const [, py] = canvasPoint(evt);
        const scale = getImageScale();
        const midY = cutYImg * scale;
        const slope = (py - midY) / (width / 2);

        cutAngle = Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, Math.atan(slope) * 180 / Math.PI));
    }

    drawPreview();
}

function onPointerUp() {
    dragMode = null;
}

function validate() {
    const totalH = imageOffsetY + props.imageBottom.height;
    const cutY = cutYImg / totalH;
    const result = stitchImages(props.imageTop, props.imageBottom, cutY, cutAngle, Math.round(imageOffsetX), Math.round(imageOffsetY));

    emit('merged', result, Math.round(imageOffsetX), Math.round(imageOffsetY));
}

onMounted(() => {
    setupOffscreen();
    initState();
    drawPreview();
});
</script>

<style scoped>
.stitch-wrapper {
    height: 100%;
    width: 100%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

.preview {
    touch-action: none;
    max-width: 100%;
    max-height: 100%;
    cursor: crosshair;
}
</style>
