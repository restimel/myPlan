<template>
    <div
        class="chronometer-player"
        :class="{
            timeout: isTimeout,
            horizontal: props.horizontal,
        }"
        :style="customStyle"
        @click="play"
        ref="chronometerPlayer"
    >
        <ChronometerDisplay
            class="time-left"
            :value="timerLeftSecond"
            :duration="currentPeriod.duration"
            :colors="currentPeriod.colors"
            warn
        />
        <ChronometerDisplay
            class="time-spent"
            :value="timerSpentSecond"
            :duration="currentPeriod.duration"
            :colors="currentPeriod.colors"
        />
        <div class="period-name">
            {{ currentPeriod.name }}
        </div>
        <CurrentTime v-if="showClock" class="clock-overlay" />
        <aside class="period-actions">
            <button v-if="isRunning"
                class="btn-transparent btn-small action"
                @click.stop.prevent="handleStop"
            >
                <MyIcon icon="pause" />
            </button>
            <button v-if="!isRunning"
                class="btn-transparent btn-small action"
                @click.stop.prevent="handlePlay"
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
        <aside @click.stop>
            <RouterLink v-if="showClose"
                to="/chronometerSettings"
                class="back-btn"
                :title="t('chronometer.leaveFullscreen')"
            >
                <MyIcon icon="cancel" />
            </RouterLink>
        </aside>
    </div>
</template>

<script lang="ts" setup>
import { computed, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import {
    continueChrono,
    currentPeriod,
    isRunning,
    isTimeout,
    nextPeriod,
    periods,
    restartPeriod,
    setPeriod,
    settings,
    start,
    stop,
    timerLeftSecond,
    timerSpentSecond,
    vibrateAction,
} from '@/stores/ChronometerStore';
import { beepAction } from '@/utils/sound';
import ChronometerDisplay from '@/components/timer/ChronometerDisplay.vue';
import CurrentTime from '@/components/timer/CurrentTime.vue';
import { useElementSize } from '@vueuse/core';
import MyIcon from '@/components/myIcon.vue';

const { t } = useI18n();

const props = defineProps<{
    showClock?: boolean;
    showClose?: boolean;
    horizontal?: boolean;
}>();

const chronometerPlayer = useTemplateRef('chronometerPlayer');
const { width, height } = useElementSize(chronometerPlayer);

const size = computed(() => {
    const fontRatio = 1.4;
    const heightFraction = props.horizontal ? (7 / 8) : (5 / 6);
    const chronoHeight = heightFraction * height.value;
    const chronoWidth = chronoHeight * fontRatio;

    if (chronoWidth < width.value) {
        return `${chronoHeight / 2}px`;
    }

    return `${width.value / fontRatio / 2}px`;
});

const customStyle = computed(() => {
    const colors = currentPeriod.value.colors;
    const styles: Record<string, string> = {};

    if (!colors) {
        return styles;
    }

    if (colors.background && colors.background !== 'default') {
        styles['--color-bg-chronometer-default'] = colors.background;
    }

    if (colors.txtWarning && colors.txtWarning !== 'default') {
        styles['--color-chronometer-warning'] = colors.txtWarning;
    }

    if (colors.timeout && colors.timeout !== 'default') {
        styles['--color-bg-chronometer-timeout'] = colors.timeout;
    }

    return styles;
});

function actionFeedback() {
    if (settings.value.actionSound) {
        beepAction();
    }

    if (settings.value.actionVibration) {
        vibrateAction();
    }
}

function handlePlay() {
    actionFeedback();
    continueChrono();
}

function handleStop() {
    actionFeedback();
    stop();
}

function play() {
    actionFeedback();

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
    if (currentPeriod.value.resetToPeriod1) {
        setPeriod(0);
    }
    restartPeriod();
}

</script>

<style scoped>
.chronometer-player {
    position: relative;
    width: 100%;
    height: 100%;

    --color-bg-chronometer: var(--color-bg-chronometer-default);
    background: var(--color-bg-chronometer);

    --color-chronometer-text: var(--vt-c-white-soft);
    color: var(--color-chronometer-text);

    --size: clamp(5em, 100%);
}
@supports (color: hsl(from red 0 0 0%)) {
    .chronometer-player {
        --color-chronometer-text: hsl(from var(--color-bg-chronometer) 0 0 calc(clamp(0, 60 - l, 1) * 95%));
    }
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
.clock-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: var(--zIndex-chronometer);
}
.period-actions {
    position: absolute;
    bottom: 0;
    right: 0;
    margin: var(--field-margin);
    z-index: var(--zIndex-chronometer);
}

.back-btn {
    position: absolute;
    top: 0;
    right: 0;
    z-index: var(--zIndex-chronometer);
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--button-size);
    height: var(--button-size);
    border-radius: 50%;
    color: var(--color-chronometer-text);
    text-decoration: none;
    opacity: 0.6;
}

.back-btn:hover {
    opacity: 1;
}

.horizontal .period-name {
    font-size: 0.6em;
}

.horizontal .period-actions {
    flex-direction: column;
}
</style>
