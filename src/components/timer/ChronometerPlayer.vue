<template>
    <div
        class="chronometer-player"
        @click="play"
    >
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
}
.period-actions {
    position: absolute;
    bottom: 0;
    right: 0;
    margin: var(--field-margin);
}
</style>
