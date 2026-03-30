<template>
    <CanvasDisplay
        ref="canvasDisplayRef"
        :image="activeImage"
        :store="store"
        :onAction="onCanvasAction"
        :layerClass="{ isDoingMagic: willApplyGrey }"
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
        <ImageCorrection v-if="correctionMenuOpen"
            :magicActive="willApplyGrey"
            :hasColor="highlightColor"
            v-model:colorMargin="colorMargin"
            v-model:contrast="contrast"
            v-model:brightness="brightness"
            @close="correctionMenuOpen = false"
            @toggleMagic="toggleGrey"
        />
    </CanvasDisplay>
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
                    type: 'addPhotoAbove',
                    icon: 'captureAbove',
                    title: t('action.addPhotoAbove'),
                },
                {
                    type: 'addPhotoBelow',
                    icon: 'captureBelow',
                    title: t('action.addPhotoBelow'),
                },
                {
                    type: 'imageCorrection',
                    icon: 'imageCorrection',
                    active: correctionMenuOpen,
                    title: t('action.imageCorrection'),
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
import HoldMenu from '@/components/holdMenu.vue';
import ActionMenu from '@/components/viewer/actionsMenu.vue';
import MyIcon from '@/components/myIcon.vue';
import { exportImage } from '@/utils/files';
import {
    filterToGrey,
    unsetGreyHold,
    aggregateCanvas,
    applyBrightnessContrast,
} from '@/utils/image';
import ImageCorrection from '@/components/imageCorrection.vue';
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

const activeImage = ref<ImageData | null>(null);

const willApplyGrey = ref(false);
const highlightColor = ref(false);
const referenceColor = ref<ColorRGB>(props.store.settings.greyedImage.color ?? [0, 0, 0]);
const menuOpen = ref(false);
const correctionMenuOpen = ref(false);
const colorMargin = ref(props.store.settings.greyedImage.colorMargin ?? 15);
const contrast = ref(0);
const brightness = ref(0);

/* Accessors to state exposed by CanvasDisplay (defineExpose auto-unwraps refs) */
const selectHold = computed(() => canvasDisplayRef.value?.selectHold ?? null);
const mouseAction = computed(() => canvasDisplayRef.value?.mouseAction ?? 'none');
const offsetXValue = computed(() => canvasDisplayRef.value?.offsetX ?? 0);
const offsetYValue = computed(() => canvasDisplayRef.value?.offsetY ?? 0);
const scaleRatioValue = computed(() => canvasDisplayRef.value?.scaleRatio ?? 1);
const containerRectValue = computed(() => canvasDisplayRef.value?.containerRect ?? new DOMRect());

onMounted(() => {
    setGrey();
});

watch(() => props.image, () => {
    /* It will reset the effect on image and apply the image to canvas */
    setGrey();
});

watch([contrast, brightness, colorMargin], refreshImage);

watch(colorMargin, (value) => {
    if (highlightColor.value) {
        props.store.setGrey({ color: referenceColor.value, colorMargin: value });
    }
});

function menuAction(action: string) {
    switch (action) {
        case 'back':
            emit('back');
            break;
        case 'addPhotoAbove':
            emit('addPhoto', 'top');
            break;
        case 'addPhotoBelow':
            emit('addPhoto', 'bottom');
            break;
        case 'magicHold':
            toggleGrey();
            break;
        case 'imageCorrection':
            correctionMenuOpen.value = !correctionMenuOpen.value;
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

    activeImage.value = filterToGrey(correctedImage, props.store.holds, referenceColor.value, colorMargin.value);
}

function setGrey(point?: Point) {
    const originImage = props.image;

    willApplyGrey.value = false;
    highlightColor.value = false;

    if (!originImage) {
        activeImage.value = null;

        return;
    }

    const correctedImage = applyBrightnessContrast(originImage, brightness.value, contrast.value);

    if (!point) {
        props.store.setGrey();
        activeImage.value = correctedImage;

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
        activeImage.value = correctedImage;

        return;
    }

    const color = partialColor as ColorRGB;

    referenceColor.value = color;

    const image = filterToGrey(correctedImage, props.store.holds, color, colorMargin.value);

    props.store.setGrey({ color, colorMargin: colorMargin.value });
    activeImage.value = image;

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
    switch (action) {
        case 'setHold':
            setHold(point);
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
                props.store.moveHold(hold.index, fromPoint ?? point, point);
            }
            break;
        }
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
        activeImage.value = null;

        return;
    }

    if (highlightColor.value) {
        activeImage.value = filterToGrey(correctedImage, props.store.holds, referenceColor.value, colorMargin.value);

        return;
    }

    activeImage.value = correctedImage;
}

function setHold(point: Point) {
    if (willApplyGrey.value) {
        return setGrey(point);
    }

    const hold = props.store.addHold(point[0], point[1], props.store.defaultHoldSize);
    const correctedImage = getCorrectedImage();

    if (highlightColor.value && activeImage.value && correctedImage) {
        activeImage.value = unsetGreyHold(activeImage.value, correctedImage, hold);
    }
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
</style>
