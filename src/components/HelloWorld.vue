<template>
  <div class="container">
      <video ref="video" id="video" controls></video>
      <hr>
      <canvas ref="canvas" id="canvas"></canvas>
      <button @click="takePhoto">Capture photo</button>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, useTemplateRef } from 'vue';

const video = useTemplateRef('video');
const canvas = useTemplateRef('canvas');

onMounted(async () => {
    // Demander l'accès à la caméra
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
        });

        const videoEl = video.value!;
        const canvasEl = canvas.value!;

        if (!videoEl || !canvasEl) {
            console.log('missing elements');
            return;
        }

        // Assigner le flux vidéo au vídeo element
        videoEl.srcObject = stream;

        // Afficher l'image dans le canvas
        drawVideo();

        function drawVideo() {
            if (videoEl.readyState === 4) { // Chargé
                const context = canvasEl.getContext('2d');

                if (!context) {
                    console.error('no context');
                    return;
                }

                requestAnimationFrame(function() {
                    context.drawImage(videoEl, 0, 0,
                        canvasEl.width, canvasEl.height);

                    setTimeout(drawVideo, 100); // Rendu en continu
                });
            }
        }

        // S'abonner aux changements de dimension de la fenêtre
        window.addEventListener('resize', () => {
            canvasEl.width = window.innerWidth;
            canvasEl.height = window.innerHeight;
        });

    } catch (err) {
        console.error('Impossible d\'accéder à la caméra:', err);
    }
});

// Prendre une photo
const takePhoto = async () => {
    const videoEl = video.value!;
    const canvasEl = canvas.value!;
    const context = canvasEl.getContext('2d')!;
    // const videoRect = videoEl.getBoundingClientRect();

    // Créer une copie de l'image actuelle
    const imgData = await new Promise<ImageData>((resolve) => {
        context.drawImage(videoEl, 0, 0,
            canvasEl.width, canvasEl.height);
        resolve(context.getImageData(
            0,
            0,
            canvasEl.width,
            canvasEl.height
        ));
    });

    // Mettre à jour le canvas avec l'image capturée
    const img = new Image(imgData.width, imgData.height);
    img.src = URL.createObjectURL(new Blob([imgData.data], { type: 'image/png' }));

    img.onload = () => {
        context.drawImage(img, 0, 0,
            canvasEl.width, canvasEl.height);
    };
};
</script>

<style>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

video {
  border: 1px solid black;
  margin: 20px;
}

canvas {
  border: 1px solid black;
  background-color: white;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}
</style>
