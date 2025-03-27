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
        <ErrorMessage v-if="doNotAllowed" />
    </div>
    <footer class="footer-actions">
        <button
            @click="capture"
            title="Capture photo"
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
        <button
            @click="inputFile?.click()"
            title="Use a file"
        >
            <MyIcon icon="file" />
        </button>
    </footer>
</template>
<script lang="ts" setup>
import { ref, onMounted, useTemplateRef, onBeforeUnmount } from 'vue';
import MyIcon from '@/components/myIcon.vue';
import ErrorMessage from '@/components/errorMessage.vue';

const video = useTemplateRef('video');
const canvas = useTemplateRef('canvas');
const inputFile = useTemplateRef('inputFile');

const emit = defineEmits<{
    image: [ImageData];
}>();

const doNotAllowed = ref(false);

onMounted(() => {
    startVideo();
});

onBeforeUnmount(() => {
    stopVideo();
});

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
            console.log('Camera access denied.', err);
            doNotAllowed.value = true;
        } else {
            console.error(`${err.name}: ${err.message}`);
        }

        return null;
    });

    const videoEl = video.value!;

    if (!videoEl || !stream) {
        console.log('missing elements');
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

video {
    width: 100%;
    height: 100%;
    grid-area: content;
    background-color: var(--color-bg-media);
}

</style>
