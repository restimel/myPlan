import { ref, watch } from 'vue';

export const debug = ref(false);
export const debugMessage = ref('');

watch(debugMessage, () => {
    if (debug.value) {
        console.debug(performance.now(), debugMessage.value);
    }
});

let lastTime = 0;
export function log(category: string, message: string) {
    if (debug.value) {
        if (category === 'save') {
            debugMessage.value = `${category}: ${message}`;
        } else
            if (category !== 'time') {
                console.log(category, message);
                return;
            }

        const time = Math.round(performance.now());
        const duration = time - lastTime;
        lastTime = time;

        debugMessage.value += `\n --- \n${category} [${duration}]: ${message}`;
    }
}
