<template>
    <div class="templates-section">
        <button class="btn-transparent templates-toggle" @click="collapsed = !collapsed">
            <MyIcon :icon="collapsed ? 'right' : 'down'" />
            {{ t('chronometer.templatesTitle') }}
        </button>
        <fieldset v-if="!collapsed" class="templates-content">
            <legend>
                {{ t('chronometer.templatesTitle') }}
            </legend>
            <div class="save-row">
                <button class="primary-btn save-main" @click="openSavePrompt">
                    <MyIcon icon="add" />
                    {{ t('chronometer.saveAsTemplate') }}
                </button>
                <button v-if="canQuickUpdate"
                    class="primary-btn save-update"
                    @click="quickUpdate"
                >
                    <MyIcon icon="save" />
                    {{ t('chronometer.updateTemplate', { name: activeTemplate?.name }) }}
                </button>
            </div>
            <div v-if="templates.length > 0"
                class="template-list"
            >
                <div v-for="tpl of templates"
                    :key="tpl.uid"
                    class="template-row"
                    :class="{ active: tpl.id === currentTemplateId }"
                >
                    <span class="template-name">
                        {{ tpl.name }}
                    </span>
                    <button
                        class="btn-outline btn-small"
                        :disabled="tpl.id === currentTemplateId"
                        @click="safeLoadTemplate(tpl.uid)"
                    >
                        {{ t('chronometer.loadTemplate') }}
                    </button>
                    <button
                        class="btn-outline btn-small"
                        @click="showQrCode(tpl)"
                    >
                        QR
                    </button>
                    <button
                        class="btn-outline btn-small"
                        @click="exportTemplate(tpl)"
                    >
                        <MyIcon icon="save" />
                    </button>
                    <ConfirmButton
                        class="default-btn btn-small"
                        :message="t('chronometer.templateDeleteConfirm')"
                        @click="deleteTemplate(tpl.uid)"
                    />
                </div>
            </div>
            <div class="templates-footer">
                <label class="btn-outline">
                    <MyIcon icon="file" />
                    {{ t('chronometer.importTemplate') }}
                    <input
                        type="file"
                        accept=".json"
                        class="hidden-input"
                        @change="onImportFile"
                    >
                </label>
                <button v-if="templates.length > 0"
                    class="btn-outline"
                    @click="exportAllTemplates"
                >
                    <MyIcon icon="save" />
                    {{ t('chronometer.exportAllTemplates') }}
                </button>
            </div>
        </fieldset>
    </div>
    <QrCodeDialog v-if="qrTemplateId !== null"
        :url="qrUrl"
        :title="qrTitle"
        @close="qrTemplateId = null"
    />
    <ModalPrompt v-if="showSavePrompt"
        :title="t('chronometer.saveAsTemplate')"
        :items="[{ label: t('chronometer.templateNamePrompt'), name: 'name', type: 'text', value: '' }]"
        @close="onSavePromptClose"
    />
    <DialogConfirm v-if="pendingLoadId !== null"
        :message="t('chronometer.loadTemplateConfirm')"
        @confirm="confirmLoad"
        @cancel="cancelLoad"
    />
    <DialogConfirm v-if="pendingReplaceId !== null"
        :message="t('chronometer.templateNameConflict')"
        @confirm="confirmReplace"
        @cancel="cancelReplace"
    />
    <DialogConfirm v-if="pendingDuplicateUid !== null"
        :message="t('chronometer.templateSameContent', { name: pendingDuplicateExistingName, newName: pendingDuplicateName })"
        @confirm="confirmDuplicateRename"
        @cancel="confirmDuplicateCopy"
    />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ConfirmButton from '@/components/ConfirmButton.vue';
import DialogConfirm from '@/components/dialogConfirm.vue';
import ModalPrompt from '@/components/modalPrompt.vue';
import MyIcon from '@/components/myIcon.vue';
import QrCodeDialog from '@/components/timer/QrCodeDialog.vue';
import {
    activeTemplate,
    computeTemplateId,
    deleteTemplate,
    importTemplates,
    isDefaultPeriods,
    loadTemplate,
    periods,
    renameTemplate,
    replaceTemplate,
    saveAsTemplate,
    templates,
    type ChronometerTemplate,
} from '@/stores/ChronometerStore';
import { encodeTemplateToUrl } from '@/utils/templateUrl';

const { t } = useI18n();

const collapsed = ref(true);
const showSavePrompt = ref(false);
const pendingLoadId = ref<string | null>(null);
const pendingReplaceId = ref<string | null>(null);
const pendingReplaceName = ref('');
const pendingDuplicateUid = ref<string | null>(null);
const pendingDuplicateName = ref('');
const pendingDuplicateExistingName = ref('');
const qrTemplateId = ref<string | null>(null);

const currentTemplateId = computed(() => computeTemplateId(periods.value));
const canQuickUpdate = computed(() => activeTemplate.value !== null && currentTemplateId.value !== activeTemplate.value.id);

const qrTemplate = computed(() => templates.value.find((tpl) => tpl.uid === qrTemplateId.value) ?? null);
const qrUrl = ref('');
const qrTitle = computed(() => qrTemplate.value?.name ?? '');

async function showQrCode(tpl: ChronometerTemplate) {
    const payload = await encodeTemplateToUrl(tpl.name, tpl.periods);

    qrUrl.value = `${window.location.origin}${window.location.pathname}#/chronometerSettings?template=${payload}`;
    qrTemplateId.value = tpl.uid;
}

function openSavePrompt() {
    showSavePrompt.value = true;
}

function onSavePromptClose(result: Record<string, string | number> | undefined) {
    showSavePrompt.value = false;

    const name = result?.name;

    if (typeof name !== 'string' || !name.trim()) {
        return;
    }

    const trimmedName = name.trim();
    const contentHash = currentTemplateId.value;
    const sameName = templates.value.find((tpl) => tpl.name === trimmedName);
    const sameContent = templates.value.find((tpl) => tpl.id === contentHash);

    if (sameName) {
        if (sameName.id === contentHash) {
            // Same name + same content → already saved, no-op
            return;
        }

        // Same name + different content → ask to replace
        pendingReplaceId.value = sameName.uid;
        pendingReplaceName.value = trimmedName;
        return;
    }

    if (sameContent) {
        // Different name + same content → ask to rename or copy
        pendingDuplicateUid.value = sameContent.uid;
        pendingDuplicateName.value = trimmedName;
        pendingDuplicateExistingName.value = sameContent.name;
        return;
    }

    saveAsTemplate(trimmedName);
}

function confirmReplace() {
    if (pendingReplaceId.value !== null) {
        replaceTemplate(pendingReplaceId.value, pendingReplaceName.value);
    }

    pendingReplaceId.value = null;
    pendingReplaceName.value = '';
}

function cancelReplace() {
    pendingReplaceId.value = null;
    pendingReplaceName.value = '';
}

function confirmDuplicateRename() {
    if (pendingDuplicateUid.value !== null) {
        renameTemplate(pendingDuplicateUid.value, pendingDuplicateName.value);
    }

    pendingDuplicateUid.value = null;
    pendingDuplicateName.value = '';
    pendingDuplicateExistingName.value = '';
}

function confirmDuplicateCopy() {
    if (pendingDuplicateName.value) {
        saveAsTemplate(pendingDuplicateName.value, true);
    }

    pendingDuplicateUid.value = null;
    pendingDuplicateName.value = '';
    pendingDuplicateExistingName.value = '';
}

function quickUpdate() {
    if (activeTemplate.value !== null) {
        replaceTemplate(activeTemplate.value.uid, activeTemplate.value.name);
    }
}

function safeLoadTemplate(templateId: string) {
    pendingLoadId.value = templateId;
}

function confirmLoad() {
    if (pendingLoadId.value !== null) {
        if (!isDefaultPeriods.value) {
            saveAsTemplate(t('chronometer.templateAutoSaveName', { date: new Date().toLocaleString() }));
        }

        loadTemplate(pendingLoadId.value);
        pendingLoadId.value = null;
    }
}

function cancelLoad() {
    pendingLoadId.value = null;
}

function exportTemplate(tpl: ChronometerTemplate) {
    const json = JSON.stringify(tpl, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `${tpl.name}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
}

function exportAllTemplates() {
    const json = JSON.stringify(templates.value, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = 'chronometer-templates.json';
    anchor.click();
    URL.revokeObjectURL(url);
}

function onImportFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
        return;
    }

    const reader = new FileReader();

    reader.onload = (loadEvent) => {
        try {
            const parsed = JSON.parse(loadEvent.target?.result as string);
            const incoming: ChronometerTemplate[] = Array.isArray(parsed) ? parsed : [parsed];
            importTemplates(incoming);
        } catch {
            /* ignore malformed files */
        }
    };

    reader.readAsText(file);
    input.value = '';
}
</script>

<style scoped>
.templates-section {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--field-margin);
}

.templates-toggle {
    width: 100%;
    justify-content: flex-start;
    gap: var(--spacing-letter);
}

.templates-content {
    display: flex;
    flex-direction: column;
    gap: var(--field-margin);
}

.template-list {
    display: flex;
    flex-direction: column;
    gap: var(--field-margin);
}

.template-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--field-padding-sm);
    padding: var(--field-padding-sm) var(--field-padding);
    border-radius: var(--border-radius-sm);
}

.template-row:nth-child(even) {
    background: var(--color-background-mute);
}

.template-row.active .template-name {
    color: var(--color-primary);
    font-weight: 600;
}

.template-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.save-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--field-margin);
}

.save-main {
    flex: 2;
}

.save-update {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.templates-footer {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--field-margin);
    align-items: center;
}

.templates-footer label {
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-letter);
    padding: var(--spacing-sm) var(--spacing-sm);
    cursor: pointer;
    transition: var(--transition-normal);
}

.hidden-input {
    display: none;
}
</style>
