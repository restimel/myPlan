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
    <div class="menu">
        <ActionMenu
            @action="action"
            :actions="[{
                type: 'edit',
                icon: 'edit',
            }, {
                type: 'exportFile',
                icon: 'file',
            }, {
                type: 'settings',
                icon: 'settings',
            }]"
        />
    </div>
    <RouteSettings
        :store="store"
        :show="showSettings"
        @close="showSettings = false"
    />
</template>
<script lang="ts" setup>
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useRouter } from 'vue-router';
import { drawHolds, drawInformation } from '@/utils/canvas/draw';
import { exportImage } from '@/utils/files';
import { defaultHoldSize, load } from '@/utils/holds';
import ActionMenu from '@/components/viewer/actionsMenu.vue';
import RouteSettings from '@/components/routeSettings.vue';
import type { RouteStore } from '@/stores/RouteStore';

const props = defineProps<{
    store: RouteStore;
}>();

const router = useRouter();

const container = useTemplateRef('container');
const canvas = useTemplateRef('canvas');

const scaleRatio = ref(1);

watch(() => props.store.image, loadImage);
watch(() => props.store.holds, loadImage, { deep: true });
watch(() => props.store.settings, loadImage, { deep: true });

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
    const imgData = props.store.image;

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
    drawHolds(props.store.holds, canvas.value!);
}

function drawDetails() {
    drawInformation(props.store.holds, props.store.settings, canvas.value, defaultHoldSize.value);
}

function action(type: string) {
    switch (type) {
        case 'edit':
            load({
                holds: props.store.holds,
                image: props.store.image!,
                settings: props.store.settings,
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

.menu {
    position: absolute;

    bottom: 0;
    text-align: center;
    width: 100%;
}

.menu :deep(.menu-handle) {
    border-top-left-radius: var(--border-radius);
    border-top-right-radius: var(--border-radius);
}
</style>
