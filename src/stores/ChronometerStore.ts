import { getRandomId } from '@/utils/tools';
import { computed, reactive, ref, watch } from 'vue';
import { useVibrate, useWakeLock } from '@vueuse/core';
import { beepTime, beepTimeout } from '@/utils/sound';
import { loadTimer, saveTimer } from '@/utils/storage';

export type Period = {
    id: number;
    name: string;
    /** In seconds */
    duration: number;
    endEffect: 'stop' | 'startNext' | 'restart' | 'continue';
    activateVibration: boolean;
    activateSound: boolean;
    soundWarning: boolean;
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
    soundWarning: true,
};

export const periods = ref<Period[]>([]);
updatePeriod(-1);

export const isDefaultPeriods = computed<boolean>(() => {
    const periodsValue = periods.value;

    if (periodsValue.length > 1) {
        return false;
    }

    const period = periodsValue[0];

    if (!/^period \d+$/.test(period.name)) {
        return false;
    }

    if (
        period.duration !== defaultPeriod.duration ||
        period.endEffect !== defaultPeriod.endEffect ||
        period.activateSound !== defaultPeriod.activateSound ||
        period.activateVibration !== defaultPeriod.activateVibration ||
        period.soundWarning !== defaultPeriod.soundWarning
    ) {
        return false;
    }

    return true;
});

function cleanPeriod(period: Period, index = periods.value.length): Period {
    if (!period) {
        period = {...defaultPeriod};
    }

    if (!period.id) {
        period.id = getRandomId();
    }

    if (!period.name || period.name === defaultPeriodName) {
        period.name = `period ${index + 1}`;
    }

    if (typeof period.duration !== 'number' || period.duration <= 0) {
        period.duration = defaultPeriod.duration;
    }

    if (!period.endEffect) {
        period.endEffect = defaultPeriod.endEffect;
    }

    if (typeof period.activateSound !== 'boolean') {
        period.activateSound = defaultPeriod.activateSound;
    }

    if (typeof period.activateVibration !== 'boolean') {
        period.activateVibration = defaultPeriod.activateVibration;
    }

    if (typeof period.soundWarning !== 'boolean') {
        period.soundWarning = defaultPeriod.soundWarning;
    }

    return period;
}

function initPeriods() {
    const storedPeriods = loadTimer();

    if (storedPeriods) {
        periods.value = storedPeriods.map(cleanPeriod);
    }

    watch(periods, (value) => {
        saveTimer(value);
    }, { deep: true });
}
initPeriods();

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

export function clearPeriods() {
    periods.value = [];
    updatePeriod(-1);
}

/* }}} */
/* {{{ chronometer */

export const periodSelected = ref<number>(0);
export const currentPeriod = computed<Period>(() => periods.value[periodSelected.value]);
export const isRunning = computed(() => chronometerTimer.value !== 0);

const timerSpent = ref<number>(0);
export const timerSpentSecond = computed<number>(() => {
    return Math.floor(timerSpent.value / 1000);
});

const chronometerTimer = ref(0);
let timeReference: number = performance.now();

const timerLeft = computed<number>(() => {
    const time = timerSpent.value;
    const periodRef = currentPeriod.value.duration * 1000;

    return periodRef - time;
});
export const timerLeftSecond = computed<number>(() => {
    const time = timerSpentSecond.value;
    const periodRef = currentPeriod.value.duration;

    return periodRef - time;
});

export const isTimeout = computed<boolean>(() => {
    const period = currentPeriod.value.duration * 1000;
    const time = timerSpent.value;

    return time >= period;
});

const nextWarningTime = computed<number>(() => {
    const timeLeft = timerLeft.value;

    return getNextWarning(timeLeft);
});

function getNextWarning(value: number): number {
    if (value > 60_000) {
        return 60;
    }

    if (value > 10_000) {
        return 10;
    }

    if (value > 0) {
        return Math.floor(value / 1000);
    }

    return 0;
}

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
    if (isTimeout.value && isRunning.value) {
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

watch(nextWarningTime, (nextTime) => {
    const period = currentPeriod.value;
    const soundWarning = period.soundWarning && period.activateSound;
    const maxWarningValue = getNextWarning(period.duration * 1_000);

    if (soundWarning && isRunning.value && nextTime !== maxWarningValue) {
        beepTime();
    }
});

export function nextPeriod() {
    const periodList = periods.value;
    const periodIndex = periodList.indexOf(currentPeriod.value);

    setPeriod(periodIndex + 1);
}

function warning(period: Period) {
    if (period.activateSound) {
        beepTimeout();
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

export function restartPeriod() {
    timerSpent.value = 0;
}

export function continueChrono() {
    timeReference = performance.now();
    clearInterval(chronometerTimer.value);
    wakeLock.request('screen');
    chronometerTimer.value = setInterval(updateTick, REFRESH_PERIOD);
}

export function start() {
    restartPeriod();
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
