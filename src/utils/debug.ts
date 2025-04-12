import { ref } from 'vue';

export type Category =
    | 'information'
    | 'interaction'
    | 'error'
    | 'warning'
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
            msg: message,
            ts: time,
        });

        logsValue.set(category, logMessages);
        if (category === 'error') {
            /* eslint-disable-next-line no-console */
            console.error(category, logMessages.at(-1)!.msg);
        } else if (category === 'warning') {
            /* eslint-disable-next-line no-console */
            console.warn(category, logMessages.at(-1)!.msg);
        } else {
            /* eslint-disable-next-line no-console */
            console.log(category, logMessages.at(-1)!.msg);
        }

        if (dbg.logs[category]) {
            debugMessage.value += `\n --- \n${text}`;
        }

        lastTime = time;
    }
}
