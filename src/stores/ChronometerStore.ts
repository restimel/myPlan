import { getRandomId } from '@/utils/tools';
import { computed, ref, watch } from 'vue';
import { beepTime, beepTimeout } from '@/utils/sound';
import {
    loadTemplates,
    loadTimer,
    loadTimerSettings,
    saveTemplates,
    saveTimer,
    saveTimerSettings,
} from '@/utils/storage';
import { requestKeepAwake, releaseKeepAwake } from '@/utils/keepScreenAwake';
import { log } from '@/utils/debug';

export type ChronometerTemplate = {
    /** Stable unique identifier per list entry (independent of content). */
    uid: string;
    /** Deterministic hash of serialized periods content (without period ids). */
    id: string;
    name: string;
    periods: Period[];
    createdAt: number;
};

export type PeriodColor = 'default' | string;
export type PeriodColors = {
    background: PeriodColor;
    txtWarning: PeriodColor;
    timeout: PeriodColor;
};

export type ChronometerSettings = {
    actionSound: boolean;
    actionVibration: boolean;
    keepAwakeOnPage: boolean;
};

export type Period = {
    id: string;
    name: string;
    /** In seconds */
    duration: number;
    endEffect: 'stop' | 'startNext' | 'restart' | 'continue';
    activateVibration: boolean;
    activateSound: boolean;
    soundWarning: boolean;
    /** Time before end (in ms) at which intermediate beeps trigger. Uses DEFAULT_WARNING_TIMES if absent. */
    warningTimes?: number[];
    colors: PeriodColors;
    /** If true, pressing reset also jumps back to period 1 */
    resetToPeriod1?: boolean;
};

const REFRESH_PERIOD = 200; /* ms */

export const DEFAULT_WARNING_TIMES: number[] = [60_000, 5_000, 4_000, 3_000, 2_000, 1_000];
export const INFORMATION_LAST_SECONDS = 10;

/* {{{ settings */

export const defaultSettings: ChronometerSettings = {
    actionSound: false,
    actionVibration: false,
    keepAwakeOnPage: false,
};

export const settings = ref<ChronometerSettings>({ ...defaultSettings });

function initSettings() {
    const stored = loadTimerSettings();

    if (stored) {
        settings.value = { ...defaultSettings, ...stored };
    }

    watch(settings, (value) => {
        saveTimerSettings(value);
    }, { deep: true });
}

initSettings();

/* }}} */
/* {{{ templates */

export function computeTemplateId(periods: Period[]): string {
    const normalized = periods.map((period) =>
        Object.fromEntries(Object.entries(period).filter(([key]) => key !== 'id'))
    );
    const json = JSON.stringify(normalized);
    /* djb2 hash: initial value 5381 is a well-known prime seed for this algorithm. */
    let hash = 5381;

    for (let index = 0; index < json.length; index++) {
        hash = ((hash << 5) + hash) ^ json.charCodeAt(index);
    }

    /* >>> 0 reinterprets the signed 32-bit result as unsigned, avoiding a negative string. */
    return (hash >>> 0).toString(36);
}

/* }}} */
/* {{{ manage Periods */

const defaultPeriodName = 'default period';

export const defaultPeriod: Period = {
    id: '0',
    name: defaultPeriodName,
    duration: 360,
    endEffect: 'stop',
    activateSound: true,
    activateVibration: true,
    soundWarning: true,
    colors: {
        background: 'default',
        txtWarning: 'default',
        timeout: 'default',
    },
};

export const periods = ref<Period[]>([]);
updatePeriod(-1);

export const isDefaultPeriods = computed<boolean>(() => {
    const periodsValue = periods.value;

    if (periodsValue.length > 1) {
        return false;
    }

    const period = periodsValue[0];

    if (!period || !/^period \d+$/.test(period.name)) {
        return false;
    }

    if (
        period.duration !== defaultPeriod.duration ||
        period.endEffect !== defaultPeriod.endEffect ||
        period.activateSound !== defaultPeriod.activateSound ||
        period.activateVibration !== defaultPeriod.activateVibration ||
        period.soundWarning !== defaultPeriod.soundWarning ||
        period.colors.background !== defaultPeriod.colors.background ||
        period.colors.txtWarning !== defaultPeriod.colors.txtWarning ||
        period.colors.timeout !== defaultPeriod.colors.timeout
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

    if (typeof period.colors !== 'object') {
        period.colors = {...defaultPeriod.colors};
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

        if (periodSelected.value >= periodsValue.length) {
            periodSelected.value = Math.max(0, periodsValue.length - 1);
        }

        return true;
    }

    return false;
}

export function clearPeriods() {
    periods.value = [];
    updatePeriod(-1);
}

/* }}} */
/* {{{ template state */

export const templates = ref<ChronometerTemplate[]>([]);
export const activeTemplate = ref<ChronometerTemplate | null>(null);

function initTemplates() {
    const stored = loadTemplates();

    if (stored) {
        // Migrate templates created before uid was introduced
        templates.value = stored.map((tpl) => (tpl.uid ? tpl : { ...tpl, uid: getRandomId() }));
    }

    watch(templates, (value) => saveTemplates(value), { deep: true });
}

initTemplates();

// force=true skips content dedup — use for explicit user copies; leave false for auto-saves
export function saveAsTemplate(name: string, force = false): ChronometerTemplate {
    const newTemplate: ChronometerTemplate = {
        uid: getRandomId(),
        id: computeTemplateId(periods.value),
        name,
        periods: periods.value.map((period) => ({ ...period })),
        createdAt: Date.now(),
    };

    if (force || !templates.value.find((template) => template.id === newTemplate.id)) {
        templates.value = [...templates.value, newTemplate];
    }

    activeTemplate.value = newTemplate;

    return newTemplate;
}

export function replaceTemplate(uid: string, name: string): ChronometerTemplate {
    const newTemplate: ChronometerTemplate = {
        uid,
        id: computeTemplateId(periods.value),
        name,
        periods: periods.value.map((period) => ({ ...period })),
        createdAt: Date.now(),
    };

    templates.value = templates.value.map((tpl) => (tpl.uid === uid ? newTemplate : tpl));
    activeTemplate.value = newTemplate;

    return newTemplate;
}

export function renameTemplate(uid: string, newName: string): void {
    templates.value = templates.value.map((tpl) => (tpl.uid === uid ? { ...tpl, name: newName } : tpl));

    if (activeTemplate.value?.uid === uid) {
        activeTemplate.value = { ...activeTemplate.value, name: newName };
    }
}

export function deleteTemplate(uid: string): void {
    templates.value = templates.value.filter((template) => template.uid !== uid);

    if (activeTemplate.value?.uid === uid) {
        activeTemplate.value = null;
    }
}

export function loadTemplate(uid: string): boolean {
    const template = templates.value.find((tpl) => tpl.uid === uid);

    if (!template) {
        return false;
    }

    periods.value = template.periods.map((period, index) => {
        const cleaned = cleanPeriod({ ...period }, index);

        cleaned.id = getRandomId();

        return cleaned;
    });
    setPeriod(0);
    activeTemplate.value = template;

    return true;
}

export function importTemplates(incoming: ChronometerTemplate[]): void {
    for (const template of incoming) {
        if (!templates.value.find((existing) => existing.id === template.id)) {
            // Ensure imported templates have a uid (may be absent in older exports)
            templates.value = [...templates.value, { ...template, uid: template.uid ?? getRandomId() }];
        }
    }
}

/* }}} */
/* {{{ chronometer */

export const periodSelected = ref<number>(0);
export const currentPeriod = computed<Period>(() => periods.value[periodSelected.value] ?? defaultPeriod);
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

const sortedWarningTimes = computed<number[]>(() => {
    const warningTimes = currentPeriod.value.warningTimes ?? DEFAULT_WARNING_TIMES;

    return [...warningTimes].sort((time1, time2) => time2 - time1);
});

const nextWarningTime = computed<number>(() => {
    return getNextWarning(timerLeft.value, sortedWarningTimes.value);
});

function getNextWarning(timeLeftMs: number, warningTimes: number[]): number {
    for (const wt of warningTimes) {
        if (wt <= timeLeftMs) {
            return wt;
        }
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

watch(periodSelected, () => {
    restartPeriod();
});

watch(() => currentPeriod.value.duration, () => {
    restartPeriod();
});

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

watch(nextWarningTime, (_newTime, oldTime) => {
    const period = currentPeriod.value;
    const soundWarning = period.soundWarning && period.activateSound;
    const durationMs = period.duration * 1_000;

    if (soundWarning && isRunning.value && oldTime !== durationMs && oldTime > 0) {
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
    const nextPeriodTimeLeft = remainingTime - nextWarningTime.value;

    if (nextPeriodTimeLeft < REFRESH_PERIOD && remainingTime >= 0) {
        setTimeout(updateTick, nextPeriodTimeLeft);
    }
}

export function restartPeriod() {
    timerSpent.value = 0;
}

export function continueChrono() {
    timeReference = performance.now();
    clearInterval(chronometerTimer.value);
    requestKeepAwake();
    chronometerTimer.value = window.setInterval(updateTick, REFRESH_PERIOD);
}

export function start() {
    restartPeriod();
    continueChrono();
}

export function stop() {
    clearInterval(chronometerTimer.value);
    chronometerTimer.value = 0;
    updateTick();
    releaseKeepAwake();
}

/* }}} */
/* {{{ actions */

const VIBRATE_PATTERN = [300, 100, 300, 100, 300];
const ACTION_VIBRATE_PATTERN = [80];

export const isVibrateSupported = 'vibrate' in navigator;
const likelyHasVibrationHardware = navigator.maxTouchPoints > 0;

export function stopVibrate() {
    navigator.vibrate(0);
}

export function vibrate() {
    if (!isVibrateSupported) {
        log('warning', '[vibrate] navigator.vibrate not available');
        return;
    }

    if (!likelyHasVibrationHardware) {
        log('warning', '[vibrate] API present but device likely has no vibration hardware');
    }

    const result = navigator.vibrate(VIBRATE_PATTERN);

    log('information', `[vibrate] result: ${result}`);
}

export function vibrateAction() {
    if (!isVibrateSupported || !likelyHasVibrationHardware) {
        return;
    }

    navigator.vibrate(ACTION_VIBRATE_PATTERN);
}

/* }}} */
