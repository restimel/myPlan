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
        <div class="panel-row">
            <button
                class="action"
                :class="{ active: warpDefined }"
                :title="t('action.warpStretch')"
                @click="emit('editWarp')"
            >
                <MyIcon icon="warpStretch" />
            </button>
        </div>
    </SidePanel>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import MyIcon from '@/components/myIcon.vue';
import SidePanel from '@/components/SidePanel.vue';

defineProps<{
    warpDefined: boolean;
}>();

const emit = defineEmits<{
    close: [];
    addPhotoAbove: [];
    addPhotoBelow: [];
    editWarp: [];
}>();

const { t } = useI18n();
</script>

<style scoped>
.panel-row {
    position: relative;
}
</style>