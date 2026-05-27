<template>
    <div class="container editor-page">
        <h1>
            {{ t('chronometer.settingsTitle') }}
        </h1>
        <ChronometerPlayer />
        <TimerTool />
        <DialogConfirm
            v-if="pendingImport !== null"
            :message="pendingImportMessage"
            @confirm="confirmImport"
            @cancel="pendingImport = null"
        >
            <p v-if="pendingImportAlreadyExists" class="import-already-exists">
                {{ t('chronometer.templateAlreadyExists') }}
            </p>
            <label class="import-name-label">
                {{ t('chronometer.templateNamePrompt') }}
                <input
                    v-model="pendingImportName"
                    type="text"
                    class="import-name-input"
                >
            </label>
        </DialogConfirm>
    </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import ChronometerPlayer from '@/components/timer/ChronometerPlayer.vue';
import DialogConfirm from '@/components/dialogConfirm.vue';
import TimerTool from '@/components/TimerTool.vue';
import {
    computeTemplateId,
    importTemplates,
    isDefaultPeriods,
    loadTemplate,
    saveAsTemplate,
    templates,
    type ChronometerTemplate,
    type Period,
} from '@/stores/ChronometerStore';
import { decodeTemplateFromUrl } from '@/utils/templateUrl';
import { getRandomId } from '@/utils/tools';

const { t } = useI18n();
const route = useRoute();

const pendingImport = ref<Period[] | null>(null);
const pendingImportName = ref('');

const pendingImportAlreadyExists = computed(() => {
    if (!pendingImport.value) {
        return false;
    }

    const importId = computeTemplateId(pendingImport.value);

    return templates.value.some((tpl) => tpl.id === importId);
});

const pendingImportMessage = computed(() => t('chronometer.loadTemplateConfirm'));

onMounted(async () => {
    const payload = route.query.template as string | undefined;

    if (!payload) {
        return;
    }

    const decoded = await decodeTemplateFromUrl(payload);

    if (!decoded) {
        return;
    }

    pendingImport.value = decoded.periods;
    pendingImportName.value = decoded.name;
});

function confirmImport() {
    if (pendingImport.value && pendingImportName.value.trim()) {
        if (!isDefaultPeriods.value) {
            saveAsTemplate(t('chronometer.templateAutoSaveName', { date: new Date().toLocaleString() }));
        }

        const newTemplate: ChronometerTemplate = {
            uid: getRandomId(),
            id: computeTemplateId(pendingImport.value),
            name: pendingImportName.value.trim(),
            periods: pendingImport.value,
            createdAt: Date.now(),
        };

        importTemplates([newTemplate]);
        loadTemplate(newTemplate.uid);
    }

    pendingImport.value = null;
}
</script>
<style scoped>
.import-already-exists {
    color: var(--color-warning, orange);
    font-size: var(--font-size-sm);
    margin: 0 0 var(--field-margin);
}

.import-name-label {
    display: flex;
    flex-direction: column;
    gap: var(--field-padding-sm);
}

.import-name-input {
    width: 100%;
}

.container {
    display: grid;
    grid-template-rows: max-content 10em 1fr;
    grid-template-areas: "title" "chronometer" "content";
    align-items: center;
    justify-items: center;
    max-height: 100%;
    overflow: auto;
}

</style>
