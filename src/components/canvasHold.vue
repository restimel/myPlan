<template>
    <CanvasDisplay
        ref="canvasDisplayRef"
        :image="activeImage"
        :store="store"
        :onAction="onCanvasAction"
        :layerClass="{ isDoingMagic: willApplyGrey }"
        :holdTransform="holdTransform"
        :message="t('build.setHolds')"
        noGreyFilter
        @canvas="(list) => canvasList = list"
    >
        <HoldMenu v-if="selectHold && (mouseAction === 'selection' || mouseAction === 'menu')"
            :hold="selectHold"
            :scale="scaleRatioValue"
            :canMove="mouseAction === 'selection'"
            :containerSize="containerRectValue"
            :offsetX="offsetXValue"
            :offsetY="offsetYValue"
            :store="routeStore"
            @close="closeMenu"
        />
        <ImageColorPanel v-if="openPanel === 'color'"
            :magicActive="willApplyGrey"
            :hasColor="highlightColor"
            v-model:colorMargin="colorMargin"
            v-model:contrast="contrast"
            v-model:brightness="brightness"
            @close="openPanel = null"
            @toggleMagic="toggleGrey"
        />
        <ImageStructurePanel v-if="openPanel === 'structure'"
            :warpDefined="!!store.settings.warpZones?.[0]"
            @close="openPanel = null"
            @addPhotoAbove="emit('addPhoto', 'top')"
            @addPhotoBelow="emit('addPhoto', 'bottom')"
            @editWarp="openWarpEdit"
        />
        <WarpEditionPanel v-if="openPanel === 'warpEdit'"
            :warpDefined="!!store.settings.warpZones?.[0]"
            v-model:warpTop="warpTop"
            v-model:warpBottom="warpBottom"
            v-model:warpFactor="warpFactor"
            @validate="onWarpEditValidate"
            @cancel="onWarpEditCancel"
            @removeWarp="removeWarp"
        />
        <div v-if="openPanel === 'warpEdit' && activeImage"
            class="warp-zone-overlay"
            :style="{
                '--warp-top-y': warpTopDisplayY + 'px',
                '--warp-bottom-y': warpBottomDisplayY + 'px',
                '--img-left': imageDisplayLeft + 'px',
                '--img-width': imageDisplayWidth + 'px',
                '--container-width': containerRectValue.width + 'px',
            }"
        >
            <div class="warp-zone-region" />
            <div class="warp-line warp-line--top"
                @pointerdown.stop="(evt) => startDragLine('top', evt)"
            />
            <div class="warp-line warp-line--bottom"
                @pointerdown.stop="(evt) => startDragLine('bottom', evt)"
            />
        </div>
        <HoldsPanel v-if="openPanel === 'holds'"
            :store="store"
            @close="openPanel = null"
        />
        <div v-if="debug && openPanel === 'warpEdit'"
            class="warp-debug"
        >
            scale={{ scaleRatioValue.toFixed(3) }}
            offX={{ offsetXValue.toFixed(0) }}
            offY={{ offsetYValue.toFixed(0) }}
            imgW={{ props.image?.width }}
            imgH={{ props.image?.height }}
            dispL={{ imageDisplayLeft.toFixed(0) }}
            dispW={{ imageDisplayWidth.toFixed(0) }}
            topY={{ warpTopDisplayY.toFixed(0) }}
            botY={{ warpBottomDisplayY.toFixed(0) }}
        </div>
    </CanvasDisplay>
    <DialogConfirm v-if="insertPending"
        :message="t('action.insertHold')"
        @confirm="confirmInsert"
        @cancel="cancelInsert"
    >
        <input
            type="number"
            class="insert-dialog-input"
            :min="1"
            :max="store.top"
            v-model.number="insertValue"
        />
    </DialogConfirm>
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
                    type: 'structurePanel',
                    icon: 'imageStructure',
                    active: openPanel === 'structure',
                    title: t('action.imageStructure'),
                },
                {
                    type: 'colorPanel',
                    icon: 'imageCorrection',
                    active: openPanel === 'color',
                    title: t('action.imageCorrection'),
                },
                {
                    type: 'holdsPanel',
                    icon: 'hold',
                    active: openPanel === 'holds',
                    title: t('action.holdSize'),
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
            {{ Math.round(scaleRatioValue * 10) / 10 }}
        </span>

        <MyIcon v-if="highlightColor"
            icon="magic"
            class="status"
            @click="setGrey()"
        />
    </footer>
</template>
<script lang="ts" setup>
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { debug, log } from '@/utils/debug';
import { saveRoute } from '@/utils/storage';
import DialogConfirm from '@/components/dialogConfirm.vue';
import HoldMenu from '@/components/holdMenu.vue';
import ActionMenu from '@/components/viewer/actionsMenu.vue';
import MyIcon from '@/components/myIcon.vue';
import { exportImage } from '@/utils/files';
import {
    filterToGrey,
    unsetGreyHold,
    aggregateCanvas,
    applyBrightnessContrast,
    warpVerticalBand,
    warpPoint,
    unwarpPoint,
    warpY,
} from '@/utils/image';
import ImageColorPanel from '@/components/ImageColorPanel.vue';
import ImageStructurePanel from '@/components/ImageStructurePanel.vue';
import WarpEditionPanel from '@/components/WarpEditionPanel.vue';
import HoldsPanel from '@/components/HoldsPanel.vue';
import type { RouteStore } from '@/stores/RouteStore';
import routeStore from '@/stores/RouteStore';
import type { ScreenAction } from '@/utils/screenStates';
import CanvasDisplay from '@/components/canvasDisplay.vue';

const props = defineProps<{
    image: ImageData | null;
    store: RouteStore;
}>();

const emit = defineEmits<{
    back: [];
    view: [];
    addPhoto: ['top' | 'bottom'];
}>();

const { t } = useI18n();

const canvasDisplayRef = useTemplateRef<InstanceType<typeof CanvasDisplay>>('canvasDisplayRef');
const canvasList = ref<Set<HTMLCanvasElement>>();

/*
 * Source-space image after brightness/contrast/grey filters. Always has the same
 * dimensions as props.image. Used as input to the warp and as reference for
 * unsetGreyHold (which requires matching dimensions with the origin image).
 */
const filteredImage = ref<ImageData | null>(null);

/*
 * What is actually displayed on the canvas. Equals filteredImage when warp is
 * disabled; equals warpVerticalBand(filteredImage) when warp is active, which
 * may have a different height than the source image.
 */
const activeImage = ref<ImageData | null>(null);

const willApplyGrey = ref(false);
const highlightColor = ref(false);
const referenceColor = ref<ColorRGB>(props.store.settings.greyedImage.color ?? [0, 0, 0]);
const menuOpen = ref(false);
const openPanel = ref<'color' | 'structure' | 'holds' | 'warpEdit' | null>(null);
const insertPending = ref<Point | null>(null);
const insertValue = ref(1);
const colorMargin = ref(props.store.settings.greyedImage.colorMargin ?? 15);
const contrast = ref(0);
const brightness = ref(0);

/* Local editing state for the warp edition panel */
const warpTop = ref(20);
const warpBottom = ref(40);
/* warpFactor is stored as integer × 100 (150 = ×1.5), matching the WarpZone type */
const warpFactor = ref(150);

const warpZone = computed<WarpZone | null>(() => {
    if (openPanel.value === 'warpEdit') {
        if (warpFactor.value <= 100 || warpTop.value >= warpBottom.value) {
            return null;
        }

        return {
            top: warpTop.value,
            bottom: warpBottom.value,
            factor: warpFactor.value,
        };
    }

    return props.store.settings.warpZones?.[0] ?? null;
});

const holdTransform = computed<((point: Point) => Point) | undefined>(() => {
    const zone = warpZone.value;
    const srcH = props.image?.height;

    if (!zone || !srcH) {
        return undefined;
    }

    return (point: Point): Point => warpPoint(point, zone, srcH);
});

function applyWarp(image: ImageData): ImageData {
    return warpZone.value ? warpVerticalBand(image, warpZone.value) : image;
}

function updateActiveImage() {
    activeImage.value = filteredImage.value ? applyWarp(filteredImage.value) : null;
}

function unmapPoint(point: Point): Point {
    const zone = warpZone.value;

    if (!zone || !props.image) {
        return point;
    }

    return unwarpPoint(point, zone, props.image.height);
}

/* Accessors to state exposed by CanvasDisplay (defineExpose auto-unwraps refs) */
const selectHold = computed(() => canvasDisplayRef.value?.selectHold ?? null);
const mouseAction = computed(() => canvasDisplayRef.value?.mouseAction ?? 'none');
const offsetXValue = computed(() => canvasDisplayRef.value?.offsetX ?? 0);
const offsetYValue = computed(() => canvasDisplayRef.value?.offsetY ?? 0);
const scaleRatioValue = computed(() => canvasDisplayRef.value?.scaleRatio ?? 1);
const containerRectValue = computed(() => canvasDisplayRef.value?.containerRect ?? new DOMRect());

const imageDisplayLeft = computed(() => -offsetXValue.value);

const imageDisplayWidth = computed(() => {
    if (!props.image) {
        return 0;
    }

    return props.image.width * scaleRatioValue.value;
});

const warpTopDisplayY = computed(() => {
    if (!props.image) {
        return 0;
    }

    return (warpTop.value / 100) * props.image.height * scaleRatioValue.value - offsetYValue.value;
});

const warpBottomDisplayY = computed(() => {
    if (!props.image) {
        return 0;
    }

    const srcH = props.image.height;
    const zone = warpZone.value;

    if (!zone) {
        return (warpBottom.value / 100) * srcH * scaleRatioValue.value - offsetYValue.value;
    }

    return warpY((warpBottom.value / 100) * srcH, zone, srcH) * scaleRatioValue.value - offsetYValue.value;
});

onMounted(() => {
    setGrey();
});

watch(() => props.image, () => {
    /* It will reset the effect on image and apply the image to canvas */
    setGrey();
});

watch(warpZone, () => {
    updateActiveImage();
});

watch([contrast, brightness, colorMargin], refreshImage);

watch(colorMargin, (value) => {
    if (highlightColor.value) {
        props.store.setGrey({ color: referenceColor.value, colorMargin: value });
    }
});

function togglePanel(panel: 'color' | 'structure' | 'holds') {
    openPanel.value = openPanel.value === panel ? null : panel;
}

function menuAction(action: string) {
    switch (action) {
        case 'back':
            emit('back');
            break;
        case 'colorPanel':
            togglePanel('color');
            break;
        case 'structurePanel':
            togglePanel('structure');
            break;
        case 'holdsPanel':
            togglePanel('holds');
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

function removeHold() {
    props.store.removeHold();

    if (highlightColor.value) {
        applyGreyFilter();
    }
}

function applyGreyFilter() {
    if (!props.image) {
        return;
    }

    const correctedImage = applyBrightnessContrast(props.image, brightness.value, contrast.value);

    filteredImage.value = filterToGrey(correctedImage, props.store.holds, referenceColor.value, colorMargin.value);
    updateActiveImage();
}

function setGrey(point?: Point) {
    const originImage = props.image;

    willApplyGrey.value = false;
    highlightColor.value = false;

    if (!originImage) {
        filteredImage.value = null;
        activeImage.value = null;

        return;
    }

    const correctedImage = applyBrightnessContrast(originImage, brightness.value, contrast.value);

    if (!point) {
        props.store.setGrey();
        filteredImage.value = correctedImage;
        updateActiveImage();

        return;
    }

    const pointIndex = (Math.round(point[0]) + Math.round(point[1]) * originImage.width) * 4;
    const partialColor: Partial<ColorRGB> = [
        originImage.data[pointIndex],
        originImage.data[pointIndex + 1],
        originImage.data[pointIndex + 2],
    ];

    if (partialColor[0] === undefined) {
        log('warning', `No color [${pointIndex} / ${originImage.data.length}]`);
        filteredImage.value = correctedImage;
        updateActiveImage();

        return;
    }

    const color = partialColor as ColorRGB;

    referenceColor.value = color;

    const image = filterToGrey(correctedImage, props.store.holds, color, colorMargin.value);

    props.store.setGrey({ color, colorMargin: colorMargin.value });
    filteredImage.value = image;
    updateActiveImage();

    highlightColor.value = true;
}

function closeMenu() {
    canvasDisplayRef.value?.clearSelection();
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
            colorMargin: highlightColor.value ? colorMargin.value : undefined,
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
    if (!canvasList.value) {
        return;
    }

    const canvasEl = aggregateCanvas(canvasList.value);

    exportImage(canvasEl);
}

function onCanvasAction(action: ScreenAction, point: Point, fromPoint?: Point) {
    const pt = unmapPoint(point);
    const fromPt = fromPoint ? unmapPoint(fromPoint) : undefined;

    switch (action) {
        case 'setHold':
            setHold(pt);
            break;
        case 'doubleHold': {
            const holdIndex = canvasDisplayRef.value?.selectHold?.index ?? 0;
            props.store.doubleHold(holdIndex);
            break;
        }
        case 'linkHolds': {
            const originHold = canvasDisplayRef.value?.selectHold;
            const targetHold = canvasDisplayRef.value?.selectHold2;

            if (originHold && targetHold) {
                props.store.linkHolds(originHold.index, targetHold.index);
            }
            break;
        }
        case 'moveHold': {
            const hold = canvasDisplayRef.value?.selectHold;

            if (hold) {
                props.store.moveHold(hold.index, fromPt ?? pt, pt);
            }
            break;
        }
        case 'longPress':
            if (!willApplyGrey.value) {
                insertPending.value = pt;
                insertValue.value = props.store.top;
            }
            break;
        case 'scroll':
            log('error', 'Scroll: should be managed by another route');
            break;
        case 'zoom':
            log('error', 'Zoom: should be managed by another route');
            break;
        default:
            log('error', `TODO: Manage ${action}`);
    }
}

function getCorrectedImage(): ImageData | null {
    if (!props.image) {
        return null;
    }

    return applyBrightnessContrast(props.image, brightness.value, contrast.value);
}

function refreshImage() {
    const correctedImage = getCorrectedImage();

    if (!correctedImage) {
        filteredImage.value = null;
        activeImage.value = null;

        return;
    }

    if (highlightColor.value) {
        filteredImage.value = filterToGrey(correctedImage, props.store.holds, referenceColor.value, colorMargin.value);
    } else {
        filteredImage.value = correctedImage;
    }
    updateActiveImage();
}

function setHold(point: Point) {
    if (willApplyGrey.value) {
        return setGrey(point);
    }

    const hold = props.store.addHold(point[0], point[1], props.store.defaultHoldSize);
    const correctedImage = getCorrectedImage();

    if (highlightColor.value && filteredImage.value && correctedImage) {
        filteredImage.value = unsetGreyHold(filteredImage.value, correctedImage, hold);
        updateActiveImage();
    }
}

function confirmInsert() {
    const point = insertPending.value;

    if (!point) {
        return;
    }

    const hold = props.store.insertHold(point[0], point[1], props.store.defaultHoldSize, insertValue.value);
    const correctedImage = getCorrectedImage();

    if (highlightColor.value && filteredImage.value && correctedImage) {
        filteredImage.value = unsetGreyHold(filteredImage.value, correctedImage, hold);
        updateActiveImage();
    }

    insertPending.value = null;
}

function cancelInsert() {
    insertPending.value = null;
}

function startDragLine(which: 'top' | 'bottom', event: PointerEvent) {
    event.preventDefault();

    const startClientY = event.clientY;
    const startValue = which === 'top' ? warpTop.value : warpBottom.value;

    function onMove(evt: PointerEvent) {
        if (!props.image) {
            return;
        }

        const srcH = props.image.height;
        const deltaDisplay = evt.clientY - startClientY;
        const deltaSourcePx = which === 'top'
            ? deltaDisplay / scaleRatioValue.value
            : deltaDisplay / scaleRatioValue.value / (warpFactor.value / 100);
        const deltaPercent = (deltaSourcePx / srcH) * 100;

        if (which === 'top') {
            warpTop.value = Math.round(Math.max(0, Math.min(warpBottom.value - 1, startValue + deltaPercent)));
        } else {
            warpBottom.value = Math.round(Math.max(warpTop.value + 1, Math.min(100, startValue + deltaPercent)));
        }
    }

    function onUp() {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
}

function openWarpEdit() {
    const savedZone = props.store.settings.warpZones?.[0] ?? null;

    warpTop.value = savedZone?.top ?? 20;
    warpBottom.value = savedZone?.bottom ?? 40;
    warpFactor.value = savedZone?.factor ?? 150;
    openPanel.value = 'warpEdit';
}

function onWarpEditValidate() {
    props.store.setWarpZones([{
        top: warpTop.value,
        bottom: warpBottom.value,
        factor: warpFactor.value,
    }]);
    openPanel.value = null;
}

function onWarpEditCancel() {
    openPanel.value = null;
}

function removeWarp() {
    props.store.setWarpZones([]);
    openPanel.value = null;
}

</script>
<style scoped>
:deep(.isDoingMagic) {
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
    z-index: var(--zIndex-status);
    right: var(--spacing-lg);
    bottom: calc(var(--spacing-lg) + var(--button-size));
    background: var(--color-primary);
    color: var(--color-txt-primary);
    border-radius: 25px;
    cursor: pointer;
    --icon-size: 1cm;
}

.insert-dialog-input {
    font-size: var(--font-size-xl);
    text-align: center;
    width: 100%;
    padding: var(--spacing-sm);
    border: var(--field-border);
    border-radius: var(--border-radius-sm);
    background: var(--color-input-bg, var(--color-background));
    color: var(--color-text);
}

.warp-zone-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: var(--zIndex-warp);
}

.warp-zone-region {
    position: absolute;
    top: var(--warp-top-y);
    left: var(--img-left);
    width: var(--img-width);
    height: calc(var(--warp-bottom-y) - var(--warp-top-y));
    background: color-mix(in srgb, var(--color-secondary) 20%, transparent);
    pointer-events: none;
}

.warp-line {
    position: absolute;
    left: var(--img-left);
    width: var(--img-width);
    height: 3px;
    background: var(--color-secondary);
    transform: translateY(-50%);
    cursor: ns-resize;
    touch-action: none;
    pointer-events: auto;
}

.warp-line::before {
    content: '';
    position: absolute;
    inset: -20px 0;
}

.warp-line::after {
    content: '';
    position: absolute;
    left: clamp(0px, calc(var(--container-width) / 2 - var(--img-left)), var(--img-width));
    top: 50%;
    transform: translate(-50%, -50%);
    width: 48px;
    height: 20px;
    background: var(--color-secondary);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-sm);
}

.warp-line--top {
    top: var(--warp-top-y);
}

.warp-line--bottom {
    top: var(--warp-bottom-y);
}

.warp-debug {
    position: absolute;
    top: 0;
    left: 0;
    z-index: var(--zIndex-debug-message);
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    font-family: monospace;
    font-size: 11px;
    padding: 4px;
    pointer-events: none;
    white-space: pre;
}
</style>
