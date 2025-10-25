<template>
    <div
        class="chronometer-player"
        @click="play"
    >
        <video
            class="keep-awake-video"
            src="@/assets/bgTimer.webm"
            loop
            :controls="false"
            ref="awakeVideo"
        />
        <ChronometerDisplay
            class="time-left"
            :value="timerLeftSecond"
            :duration="currentPeriod.duration"
            warn
        />
        <ChronometerDisplay
            class="time-spent"
            :value="timerSpentSecond"
            :duration="currentPeriod.duration"
        />
        <div class="period-name">
            {{ currentPeriod.name }}
        </div>
        <aside class="period-actions">
            <button v-if="isRunning"
                class="btn-transparent btn-small action"
                @click.stop.prevent="stop"
            >
                <MyIcon icon="pause" />
            </button>
            <button v-if="!isRunning"
                class="btn-transparent btn-small action"
                @click.stop.prevent="continueChrono"
            >
                <MyIcon icon="play" />
            </button>
            <button
                class="btn-transparent btn-small action"
                @click.stop.prevent="restartChrono"
            >
                <MyIcon icon="restart" />
            </button>
            <button v-if="periods.length > 1"
                class="btn-transparent btn-small action"
                @click.stop.prevent="changeToNextPeriod"
            >
                <MyIcon icon="next" />
            </button>
        </aside>
    </div>
</template>

<script lang="ts" setup>
import { useTemplateRef, watch } from 'vue';
import {
    continueChrono,
    currentPeriod,
    isRunning,
    nextPeriod,
    periods,
    restartPeriod,
    setPeriod,
    start,
    stop,
    timerLeftSecond,
    timerSpentSecond,
} from '@/stores/ChronometerStore';
import ChronometerDisplay from '@/components/timer/ChronometerDisplay.vue';
import MyIcon from '@/components/myIcon.vue';

const awakeVideo = useTemplateRef('awakeVideo');

watch(isRunning, (isRunning) => {
    if (isRunning) {
        awakeVideo.value?.play();
    } else {
        awakeVideo.value?.pause();
    }
});

function play() {
    if (isRunning.value) {
        stop();
    } else {
        continueChrono();
    }
}

function changeToNextPeriod() {
    const running = isRunning.value;

    stop();
    restartPeriod();
    nextPeriod();

    if (running) {
        start();
    }
}

function restartChrono() {
    setPeriod(0);
    restartPeriod();
}

</script>

<style scoped>
.chronometer-player {
    position: relative;
    width: 100%;

    color: var(--vt-c-white-soft); /* default color */
    /* contrast color */
    color: hsl(from var(--color-bg-chronometer) 0 0 calc(clamp(0, 60 - l, 1) * 95%));
}
.time-left {
    font-size: 5em;
}
.time-spent {
    font-size: 1em;
}
.period-name {
    position: absolute;
    top: 0;
    font-size: 0.8em;
    z-index: 100;
}
.period-actions {
    position: absolute;
    bottom: 0;
    right: 0;
    margin: var(--field-margin);
    z-index: 100;
}

.keep-awake-video {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 10px;
    height: 10px;
    pointer-events: none;
    z-index: 1;
    opacity: 0.05;
}
</style>
