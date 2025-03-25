import { ref, watch } from 'vue';

export const debug = ref(false);
export const debugMessage = ref('');

watch(debugMessage, () => {
    if (debug.value) {
        console.log(performance.now(), debugMessage.value);
    }
});
