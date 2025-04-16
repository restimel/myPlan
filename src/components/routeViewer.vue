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
    </div>
    <RouteMenu @action="action" />
    <ModalPrompt v-if="showSettings"
        :title="t('view.settingsTitle')"
        :items="[{
            type: 'text',
            label: t('label.routeName'),
            value: settings.routeName,
            name: 'routeName',
        }]"
        @close="closeSettings"
    />
</template>
<script lang="ts" setup>
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { drawHolds, drawInformation } from '@/utils/canvas/draw';
import { exportImage } from '@/utils/files';
import { defaultHoldSize, load } from '@/utils/holds';
import RouteMenu, { type Action } from '@/components/viewer/routeMenu.vue';
import ModalPrompt from './modalPrompt.vue';

const props = defineProps<{
    image: ImageData | null;
    holds: Hold[];
    settings: RouteSettings;
}>();

const emit = defineEmits<{
    settings: [RouteSettings],
}>();

const router = useRouter();
const { t } = useI18n();

const container = useTemplateRef('container');
const canvas = useTemplateRef('canvas');

const scaleRatio = ref(1);

watch(() => props.image, loadImage);
watch(() => props.holds, loadImage, { deep: true });
watch(() => props.settings, loadImage, { deep: true });

const containerRect = computed<DOMRect>(() => {
    const containerEl = container.value!;
    const rect = containerEl.getBoundingClientRect();

    return rect;
});

onMounted(() => {
    loadImage();
});

function loadImage() {
    const canvasEl = canvas.value!;
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

    const context = canvasEl.getContext('2d')!;

    context.putImageData(imgData, 0, 0);

    drawDetails();
    drawRoute();
}

function drawRoute() {
    drawHolds(props.holds, canvas.value!);
}

function drawDetails() {
    drawInformation(props.holds, props.settings, canvas.value, defaultHoldSize.value);
}

function action(type: Action) {
    switch (type) {
        case 'edit':
            load({
                holds: props.holds,
                image: props.image!,
                settings: props.settings,
            });

            router.push('/build');

            break;
        case 'exportFile': {
            const canvasEl = canvas.value!;

            exportImage(canvasEl, 'finalRoute.png');
            break;
        }
        case 'settings':
            showSettings.value = true;
            break;
    }
}

/* {{{ menu settings */

const showSettings = ref(false);

type Settings = {
    routeName: string;
};

function closeSettings(result: Record<string, string | number> | undefined) {
    if (result) {
        emit('settings', result as Settings);
    }

    showSettings.value = false;
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
