import { reactive, watch } from 'vue';
import { loadPreferences, savePreferences } from '@/utils/storage';

export const preferencesStore = reactive(loadPreferences());

watch(preferencesStore, (newPrefs) => {
    savePreferences({ ...newPrefs });
});
