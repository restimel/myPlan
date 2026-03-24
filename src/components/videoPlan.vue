<template>
    <div class="main">
        <video
            ref="video"
            @click="capture"
        ></video>
        <canvas
            ref="canvas"
            class="hidden"
        ></canvas>
        <canvas v-if="adjacentImage"
            ref="overlayCanvas"
            class="overlay"
            :class="adjacentImage.side === 'bottom' ? 'overlay-top' : 'overlay-bottom'"
        ></canvas>
        <GuideMessage :message="guideMessage" />
        <ErrorMessage v-if="doNotAllowed" />
    </div>
    <footer class="footer-actions">
        <button v-if="adjacentImage"
            class="action"
            @click="emit('cancel')"
            :title="t('action.cancel')"
        >
            <MyIcon icon="cancel" />
        </button>
        <button
            class="action"
            @click="capture"
            :title="t('action.photo')"
        >
            <MyIcon icon="photo" />
        </button>
        <input
            class="hidden"
            type="file"
            id="fileInput"
            accept="image/*"
            ref="inputFile"
            @change="loadFile"
        />
        <button v-if="!adjacentImage"
            class="action"
            @click="inputFile?.click()"
            :title="t('action.file')"
        >
            <MyIcon icon="file" />
        </button>
    </footer>
</template>
<script lang="ts" setup>
import { ref, computed, onMounted, watch, useTemplateRef, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { log } from '@/utils/debug';
import MyIcon from '@/components/myIcon.vue';
import ErrorMessage from '@/components/errorMessage.vue';
import GuideMessage from '@/components/guideMessage.vue';

const props = defineProps<{
    adjacentImage?: { image: ImageData; side: 'top' | 'bottom' };
}>();

const { t } = useI18n();

const video = useTemplateRef('video');
const canvas = useTemplateRef('canvas');
const overlayCanvas = useTemplateRef<HTMLCanvasElement>('overlayCanvas');
const inputFile = useTemplateRef('inputFile');

const emit = defineEmits<{
    image: [ImageData];
    cancel: [];
}>();

const doNotAllowed = ref(false);

const guideMessage = computed(() => {
    if (!props.adjacentImage) {
        return t('build.captureVideo');
    }

    return props.adjacentImage.side === 'bottom'
        ? t('build.captureBelow')
        : t('build.captureAbove');
});

onMounted(() => {
    startVideo();
});

onBeforeUnmount(() => {
    stopVideo();
});

/* Draw the adjacent-image overlay once the canvas element is in the DOM (v-if) */
watch(overlayCanvas, (el) => {
    if (el) {
        drawOverlay();
    }
});

function drawOverlay() {
    const overlayEl = overlayCanvas.value;
    const adj = props.adjacentImage;

    if (!overlayEl || !adj) {
        return;
    }

    const videoEl = video.value!;
    const rect = videoEl.getBoundingClientRect();
    const displayWidth = rect.width || 300;
    const displayHeight = rect.height || 400;
    const overlayHeight = Math.round(displayHeight * 0.3);

    overlayEl.width = displayWidth;
    overlayEl.height = overlayHeight;

    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = adj.image.width;
    tmpCanvas.height = adj.image.height;
    tmpCanvas.getContext('2d')!.putImageData(adj.image, 0, 0);

    const ctx = overlayEl.getContext('2d')!;
    const srcY = adj.side === 'bottom' ? adj.image.height * 0.7 : 0;
    const srcHeight = adj.image.height * 0.3;

    ctx.globalAlpha = 0.45;
    ctx.drawImage(tmpCanvas, 0, srcY, adj.image.width, srcHeight, 0, 0, displayWidth, overlayHeight);
    ctx.globalAlpha = 1;
}

async function startVideo() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: 'environment',
        },
        audio: false,
    }).then((stream) => {
        doNotAllowed.value = false;

        return stream;
    }).catch((err) => {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            log('error', `Camera access denied. (error: ${err})`);
            doNotAllowed.value = true;
        } else {
            log('error', `${err.name}: ${err.message}`);
        }

        return null;
    });

    const videoEl = video.value!;

    if (!videoEl || !stream) {
        log('error', 'missing elements');
        return;
    }

    videoEl.srcObject = stream;
    videoEl.onloadedmetadata = () => {
        videoEl.play();
    };
}

function stopVideo() {
    const videoEl = video.value;
    const stream = videoEl?.srcObject as MediaStream | undefined ;

    if (!stream || !videoEl) {
        return;
    }

    videoEl.pause();
    stream.getTracks().forEach((track) => track.stop());
}

function capture() {
    if (doNotAllowed.value) {
        return;
    }

    const videoEl = video.value!;
    const canvasEl = canvas.value!;

    const rect = videoEl.getBoundingClientRect();
    const { width, height } = rect;

    canvasEl.width = width;
    canvasEl.height = height;

    const context = canvasEl.getContext('2d')!;

    /* copy current image */
    context.drawImage(
        videoEl,
        0,
        0,
        width,
        height
    );
    getImage(canvasEl, context);
}

function loadFile(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files![0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function(evt) {
            const data = evt.target!.result as string;
            const img = new Image();

            img.onload = function() {
                const canvasEl = canvas.value!;

                canvasEl.width = img.width;
                canvasEl.height = img.height;

                const context = canvasEl.getContext('2d')!;

                context.drawImage(img, 0, 0);

                getImage(canvasEl, context);
            };
            img.src = data;
        };

        reader.readAsDataURL(file);
    }
}

function getImage(canvasEl: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    const { width, height } = canvasEl;

    const imgData = context.getImageData(
        0,
        0,
        width,
        height
    );

    if (imgData) {
        emit('image', imgData);
    }
}

</script>
<style scoped>
.hidden {
    display: none;
}

.main {
    height: 100%;
    width: 100%;
    overflow: hidden;
}

video {
    width: 100%;
    height: 100%;
    grid-area: content;
    background-color: var(--color-bg-media);
}

.overlay {
    position: absolute;
    left: 0;
    width: 100%;
    pointer-events: none;
}

.overlay-top {
    top: 0;
}

.overlay-bottom {
    bottom: 0;
}

</style>
