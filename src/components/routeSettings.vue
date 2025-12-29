<template>
    <ModalPrompt v-if="showSettings"
        :title="t('view.settingsTitle')"
        :items="[{
            type: 'text',
            label: t('label.routeName'),
            value: store.settings.routeName,
            name: 'routeName',
        }]"
        @close="closeSettings"
    />
</template>
<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ModalPrompt from '@/components/modalPrompt.vue';
import type { RouteStore } from '@/stores/RouteStore';

type SettingsForm = RouteSettings;

const props = defineProps<{
    show: boolean;
    store: RouteStore;
}>();

const emit = defineEmits<{
    close: [RouteSettings | undefined],
}>();

const { t } = useI18n();

const showSettings = ref(props.show);

watch(() => props.show, () => showSettings.value = props.show);

function closeSettings(result: Record<string, string | number> | undefined) {
    const formResult = result &&
        {
            greyedImage: props.store.settings.greyedImage,
            ...result,
        } as (SettingsForm | undefined);

    if (formResult) {
        props.store.setSettings(formResult);
    }

    showSettings.value = false;
    emit('close', formResult);
}

</script>
<style scoped>

</style>
