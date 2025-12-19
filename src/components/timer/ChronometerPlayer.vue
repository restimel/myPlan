<template>
    <div
        class="chronometer-player"
        :class="{
            timeout: isTimeout,
        }"
        @click="play"
        ref="chronometerPlayer"
    >
        <video
            class="keep-awake-video"
            src="@/assets/bgTimer.webm"
            muted
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
import { computed, useTemplateRef, watch } from 'vue';
import {
    continueChrono,
    currentPeriod,
    isRunning,
    isTimeout,
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
import { useElementSize } from '@vueuse/core';
import MyIcon from '@/components/myIcon.vue';

const awakeVideo = useTemplateRef('awakeVideo');
const chronometerPlayer = useTemplateRef('chronometerPlayer');
const { width, height } = useElementSize(chronometerPlayer);

const size = computed(() => {
    const fontRatio = 1.4;
    const chronoHeight = 5 * height.value / 6;
    const chronoWidth = chronoHeight * fontRatio;

    if (chronoWidth < width.value) {
        return `${chronoHeight / 2}px`;
    }

    return `${width.value / fontRatio / 2}px`;
});

/* {{{ Awake system */

/* Alternate play of the video to save energy consumption */

const AWAKE_RUN = 500;
const AWAKE_SLEEP = 5000;
let awakeTimer = 0;

function awakePlay() {
    clearTimeout(awakeTimer);
    awakeVideo.value?.play();
    awakeTimer = setTimeout(awakePause, AWAKE_RUN);
}

function awakePause() {
    clearTimeout(awakeTimer);
    awakeVideo.value?.pause();
    awakeTimer = setTimeout(awakePlay, AWAKE_SLEEP);
}

function stopAwake() {
    clearTimeout(awakeTimer);
    awakeVideo.value?.pause();
    awakeTimer = 0;
}

watch(isRunning, (isRunning) => {
    if (isRunning) {
        awakePlay();
    } else {
        stopAwake();
    }
});

/* }}} */

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
    height: 100%;

    background: var(--color-bg-chronometer);
    color: var(--vt-c-white-soft); /* default color */
    /* contrast color */
    color: hsl(from var(--color-bg-chronometer) 0 0 calc(clamp(0, 60 - l, 1) * 95%));

    --size: clamp(5em, 100%);
}
.chronometer-player.timeout {
    --color-bg-chronometer: var(--color-bg-chronometer-timeout);
}
.time-left {
    font-size: v-bind(size);
}
.time-spent {
    font-size: calc(v-bind(size) / 5);
}
.period-name {
    position: absolute;
    top: 0;
    font-size: 0.8em;
    z-index: var(--zIndex-chronometer);
}
.period-actions {
    position: absolute;
    bottom: 0;
    right: 0;
    margin: var(--field-margin);
    z-index: var(--zIndex-chronometer);
}

.keep-awake-video {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 10px;
    height: 10px;
    pointer-events: none;
    opacity: 0.05;
}
</style>
