import { ref, watch } from 'vue';

export type Category =
    | 'interaction'
    | 'time'
    | 'save'
    | 'zoom'
;

type Logs = Record<Category, boolean>;
type Log = {
    ts: number;
    msg: string;
}

type Debug = null | {
    featureNext: boolean;
    logs: Logs;
};

export const debug = ref<Debug>(null);
export const debugMessage = ref('');

export const logs = ref<Map<Category, Log[]>>(new Map());

watch(debugMessage, () => {
    if (debug.value) {
        console.debug(performance.now(), debugMessage.value);
    }
});

export function enableDebug() {
    debug.value = {
        featureNext: true,
        logs: {} as Logs,
    };
}

export function resetDebug() {
    logs.value = new Map();
    debugMessage.value = '';
}

let lastTime = 0;
export function log(category: Category, message: string) {
    const dbg = debug.value;

    if (dbg) {
        const time = Math.round(performance.now());
        const duration = time - lastTime;
        const text = `[${duration}]: ${message}`;

        const logsValue = logs.value;
        const logMessages = logsValue.get(category) ?? [];
        logMessages.push({
            msg: text,
            ts: time,
        });

        logsValue.set(category, logMessages);

        if (dbg.logs[category]) {
            debugMessage.value += `\n --- \n${text}`;
        }

        lastTime = time;
    }
}
