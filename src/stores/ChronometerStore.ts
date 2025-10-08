import { getRandomId } from '@/utils/tools';
import { computed, reactive, ref, watch } from 'vue';
import { useVibrate, useWakeLock } from '@vueuse/core';

type Warning = 'none' | 'sound' | 'vibration';
export type Period = {
    id: number;
    name: string;
    /** In seconds */
    duration: number;
    endEffect: 'stop' | 'startNext' | 'restart' | 'continue';
    activateVibration: boolean;
    activateSound: boolean;
};

const REFRESH_PERIOD = 200;

/* {{{ manage Periods */

const defaultPeriodName = 'default period';

export const defaultPeriod: Period = {
    id: 0,
    name: defaultPeriodName,
    duration: 360,
    endEffect: 'stop',
    activateSound: true,
    activateVibration: true,
};

export const periods = ref<Period[]>([]);
updatePeriod(-1);

export function updatePeriod(index: number, period: Period = defaultPeriod) {
    const periodsValue = periods.value;
    const copyPeriod = { ...period };

    if (index >= 0 && index < periodsValue.length) {
        periodsValue[index] = copyPeriod;
        periods.value = periodsValue;

        return index;
    }

    copyPeriod.id = getRandomId();
    if (copyPeriod.name === defaultPeriodName) {
        copyPeriod.name = `period ${periodsValue.length + 1}`;
    }
    periodsValue.push(copyPeriod);
    periods.value = periodsValue;

    return periodsValue.length - 1;
}

export function deletePeriod(index: number) {
    const periodsValue = periods.value;

    if (index >= 0 && index < periodsValue.length) {
        periodsValue.splice(index, 1);
        periods.value = periodsValue;

        return true;
    }

    return false;
}

/* }}} */
/* {{{ chronometer */

export const periodSelected = ref<number>(0);
export const currentPeriod = computed<Period>(() => periods.value[periodSelected.value]);
export const isRunning = computed(() => chronometerTimer.value !== 0);

export const timerSpent = ref<number>(0);

const chronometerTimer = ref(0);
let timeReference: number = performance.now();

export const timerLeft = computed<number>(() => {
    const time = timerSpent.value;
    const periodRef = currentPeriod.value.duration * 1000;

    return periodRef - time;
});

export const isTimeout = computed<boolean>(() => {
    const period = currentPeriod.value.duration * 1000;
    const time = timerSpent.value;

    return time >= period;
});

export function setPeriod(index: number) {
    const periodList = periods.value;
    const periodsLength = periodList.length;

    if (!periodsLength) {
        return;
    }

    const periodIndex = index % periodsLength;

    if (index < 0) {
        periodSelected.value = 0;
    } else {
        periodSelected.value = periodIndex;
    }
}

watch(isTimeout, () => {
    if (isTimeout.value) {
        const period = currentPeriod.value;
        const effect = period.endEffect;

        switch (effect) {
            case 'continue':
                break;
            case 'restart':
                start();
                break;
            case 'stop':
                stop();
                break;
            case 'startNext': {
                nextPeriod();
                start();
                break;
            }
        }

        warning(period);
    }
});

export function nextPeriod() {
    const periodList = periods.value;
    const periodIndex = periodList.indexOf(currentPeriod.value);

    setPeriod(periodIndex + 1);
}

function warning(period: Period) {
    if (period.activateSound) {
        console.log('todo sound');
    }

    if (period.activateVibration) {
        vibrate();
    }
}

function updateTick() {
    if (!isRunning.value) {
        return;
    }

    const now = performance.now();
    const spent = now - timeReference;

    timeReference = now;
    timerSpent.value += spent;

    const remainingTime = timerLeft.value;

    if (remainingTime < REFRESH_PERIOD && remainingTime >= 0) {
        setTimeout(updateTick, remainingTime);
    }
}

export function restartChrono() {
    timerSpent.value = 0;
}

export function continueChrono() {
    timeReference = performance.now();
    clearInterval(chronometerTimer.value);
    wakeLock.request('screen');
    chronometerTimer.value = setInterval(updateTick, REFRESH_PERIOD);
}

export function start() {
    restartChrono();
    continueChrono();
}

export function stop() {
    clearInterval(chronometerTimer.value);
    chronometerTimer.value = 0;
    updateTick();
    wakeLock.release();
}

/* }}} */
/* {{{ actions */

export const { vibrate, stop: stopVibrate, isSupported: isVibrateSupported } = useVibrate({ pattern: [300, 100, 300, 100, 300] });

const wakeLock = reactive(useWakeLock());

/* }}} */
