<template>
    <div class="container">
        <video
            ref="video"
            id="video"
            @click="takePhoto"
            :class="mode"
        ></video>
        <div
            class="canvas-container"
            :class="mode"
        >
            <canvas
                ref="canvas"
                id="canvas"
            ></canvas>
            <canvas
                ref="canvasLayer"
                id="canvasLayer"
                @click="setHold"
            ></canvas>
        </div>
        <footer>
            <button v-if="mode === 'video'"
                @click="takePhoto"
            >
                Capture photo
            </button>
            <button v-if="mode === 'canvas'"
                @click="startVideo"
            >
                Take another photo
            </button>
            <button v-if="mode === 'canvas' && holdList.length > 0"
                @click="removeHold()"
            >
                Remove last hold
            </button>
        </footer>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, useTemplateRef, watch } from 'vue';
import {
    addHold,
    type Hold,
    holdList,
    removeHold,
} from '@/utils/holds';

const video = useTemplateRef('video');
const canvas = useTemplateRef('canvas');
const canvasLayer = useTemplateRef('canvasLayer');
const mode = ref<'video' | 'canvas'>('video');
const image = ref<ImageData | null>(null);
const threshold = ref(10);
const selectHold = ref<Hold | null>(null);

watch(holdList, drawHolds, { deep: true });

onMounted(async () => {
    startVideo();
});

const startVideo = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: 'landscape',
        },
        audio: false,
    }).catch((err) => {
        console.error(`${err.name}: ${err.message}`);
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

    mode.value = 'video';
};

const stopVideo = async () => {
    const videoEl = video.value;
    const stream = videoEl?.srcObject as MediaStream | undefined ;

    if (!stream || !videoEl) {
        return;
    }

    videoEl.pause();
    stream.getTracks().forEach((track) => track.stop());
};

const takePhoto = async () => {
    const videoEl = video.value!;
    const canvasEl = canvas.value!;
    const canvasLayerEl = canvasLayer.value!;

    const rect = videoEl.getBoundingClientRect();
    canvasEl.width = rect.width;
    canvasEl.height = rect.height;
    canvasLayerEl.width = rect.width;
    canvasLayerEl.height = rect.height;

    const context = canvasEl.getContext('2d')!;

    /* copy current image */
    const imgData = await new Promise<ImageData>((resolve) => {
        context.drawImage(
            videoEl,
            0,
            0,
            canvasEl.width,
            canvasEl.height
        );

        resolve(context.getImageData(
            0,
            0,
            canvasEl.width,
            canvasEl.height
        ));

        mode.value = 'canvas';
        selectHold.value = null;
    });

    image.value = imgData;

    /* Update camera with the captured image */
    const img = new Image(imgData.width, imgData.height);
    img.src = URL.createObjectURL(new Blob([imgData.data], { type: 'image/png' }));

    img.onload = () => {
        context.drawImage(
            img,
            0,
            0,
            canvasEl.width,
            canvasEl.height
        );
    };

    stopVideo();
};

function setHold(event: MouseEvent) {
    const canvasLayerEl = canvasLayer.value!;
    const rect = canvasLayerEl.getBoundingClientRect();

    /* position in the context of the canvas */
    const mouseX = Math.round(event.clientX - rect.left);
    const mouseY = Math.round(event.clientY - rect.top);

    addHold(mouseX, mouseY);

    // drawHolds();
}

function drawHolds() {
    const canvasLayerEl = canvasLayer.value!;
    const context = canvasLayerEl.getContext('2d')!;

    if (!context) {
        return;
    }

    context.clearRect(0, 0, canvasLayerEl.width, canvasLayerEl.height);

    context.fillStyle = '#ffffff33';
    context.strokeStyle = '#000000ff';
    context.lineWidth = 1;
    context.textBaseline = 'middle';
    context.textAlign = 'center';

    holdList.value.forEach((hold) => {
        const {x, y} = hold;
        const radius = 20;

        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
        context.stroke();

        context.strokeText(hold.value.toString(10), x, y);
    });
}

type Color = [number, number, number];

function draw(event: MouseEvent) {
    const canvasLayerEl = canvasLayer.value!;
    const context = canvasLayerEl.getContext('2d')!;
    const rect = canvasLayerEl.getBoundingClientRect();
    const data = image.value?.data;
    const thresholdValue = threshold.value;

    if (!context || !data) {
        return;
    }

    /* position in the context of the canvas */
    const mouseX = Math.round(event.clientX - rect.left);
    const mouseY = Math.round(event.clientY - rect.top);

    const maxX = image.value!.width;
    const maxY = image.value!.height;
    function getColor(x: number, y: number): Color | null {
        if (x < 0 || y < 0 || x >= maxX || y >= maxY) {
            return null;
        }

        const idx = (x + y * maxX) * 4;

        return [
            data?.[idx] ?? 0,
            data?.[idx + 1] ?? 0,
            data?.[idx + 2] ?? 0,
        ];
    }

    function distance([r1, g1, b1]: Color, [r2, g2, b2]: Color): boolean {
        return (
            Math.abs(r1 - r2) < thresholdValue &&
            Math.abs(g1 - g2) < thresholdValue &&
            Math.abs(b1 - b2) < thresholdValue
        );
    }

    function toLinear(x: number, y: number): number {
        return x + y * maxX;
    }

    const done = new Set<number>();
    const todo:  Array<[number, number]> = [];
    function *points(): Generator<[number, number]> {
        while (todo.length) {
            const point = todo.pop()!;
            done.add(toLinear(point[0], point[1]));

            if (!done.has(toLinear(point[0] + 1, point[1]))) {
                yield [point[0] + 1, point[1]];
            }

            if (!done.has(toLinear(point[0] - 1, point[1]))) {
                yield [point[0] - 1, point[1]];
            }

            if (!done.has(toLinear(point[0], point[1] + 1))) {
                yield [point[0], point[1] + 1];
            }

            if (!done.has(toLinear(point[0], point[1] - 1))) {
                yield [point[0], point[1] - 1];
            }
        }
    }

    function draw(x: number, y: number) {
        context.beginPath();
        context.moveTo(x, y);
        context.arc(x, y, 1, 0, Math.PI * 2);
        context.fill();
    }

    context.clearRect(0, 0, maxX, maxY);

    const refColor = getColor(mouseX, mouseY)!;
    const finalPoints: Array<[number, number]> = [];

    finalPoints.push([mouseX, mouseY]);
    todo.push([mouseX, mouseY]);

    for (const point of points()) {
        const color = getColor(point[0], point[1]);

        if (color && distance(refColor, color)) {
            finalPoints.push(point);
            todo.push(point);
        }
    }

    console.log(finalPoints.length);

    finalPoints.forEach(([x, y]) => {
        draw(x, y);
    });

    console.log(mouseX, mouseY, refColor, image.value);
}
</script>

<style>
.container {
    display: grid;
    grid-template-rows: 1fr max-content;
    grid-template-areas: "content" "actions";
}

#video {
    border: 1px solid black;
    width: 100%;
    height: 100%;
    grid-area: content;
    background-color: var(--vt-c-black);
    display: none;
}

#canvasLayer,
#canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 1px solid black;
    background-color: white;
    grid-area: content;
}

#canvasLayer {
    background-color: transparent;
}

.canvas-container {
    position: relative;
    display: none;
    width: 100%;
    height: 100%;
}

#video.video,
.canvas-container.canvas {
    display: block;
}

footer {
    grid-area: actions;
    background: var(--color-secondary);
    color: var(--color-txt-secondary);
    display: flex;
    flex-direction: row;
    justify-content: center;
    gap: var(--spacing-sm);
}
button {
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
}
</style>
