import { ref, watch } from 'vue';

export const debug = ref(false);
export const debugMessage = ref('');

watch(debugMessage, () => {
    if (debug.value) {
        console.debug(performance.now(), debugMessage.value);
    }
});

export function log(category: string, message: string) {
    if (debug.value) {
        if (category !== 'time') {
            console.log(category, message);
            return;
        }

        debugMessage.value += `\n --- \n${category}: ${message}`;
    }
}
