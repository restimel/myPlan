import { onBeforeUnmount, onMounted, watch } from 'vue';
import { isRunning, settings } from '@/stores/ChronometerStore';
import { releaseKeepAwake, requestKeepAwake } from '@/utils/keepScreenAwake';

export function useChronoPageWakelock() {
    onMounted(() => {
        if (settings.value.keepAwakeOnPage) {
            requestKeepAwake();
        }
    });

    onBeforeUnmount(() => {
        if (!isRunning.value) {
            releaseKeepAwake();
        }
    });

    watch(isRunning, (running) => {
        if (!running && settings.value.keepAwakeOnPage) {
            requestKeepAwake();
        }
    });

    watch(() => settings.value.keepAwakeOnPage, (on) => {
        if (on) {
            requestKeepAwake();
        } else if (!isRunning.value) {
            releaseKeepAwake();
        }
    });
}
