<template>
    <SidePanel @close="emit('close')">
        <div class="panel-row">
            <button
                class="action"
                :title="t('action.addPhotoAbove')"
                @click="emit('addPhotoAbove')"
            >
                <MyIcon icon="captureAbove" />
            </button>
        </div>
        <div class="panel-row">
            <button
                class="action"
                :title="t('action.addPhotoBelow')"
                @click="emit('addPhotoBelow')"
            >
                <MyIcon icon="captureBelow" />
            </button>
        </div>
    </SidePanel>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import MyIcon from '@/components/myIcon.vue';
import SidePanel from '@/components/SidePanel.vue';

const emit = defineEmits<{
    close: [];
    addPhotoAbove: [];
    addPhotoBelow: [];
}>();

const { t } = useI18n();
</script>

<style scoped>
.panel-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--spacing-xs);
}
</style>