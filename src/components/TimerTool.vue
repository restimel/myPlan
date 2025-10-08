<template>
    <main class="chronometer-editor">
        <EditPeriod v-for="(period, periodIndex) of periods"
            :class="{ active: period.id === currentPeriod.id }"
            :period-index="periodIndex"
            :alone="periods.length === 1"
            :key="`edit-period-${period.id}`"
            @active="setPeriod(periodIndex)"
        />
        <button
            class="primary-btn"
            @click="addPeriod"
        >
            <MyIcon
                icon="add"
            />
            {{ t('chronometer.addPeriod') }}
        </button>
    </main>
</template>

<script setup lang="ts">
import MyIcon from '@/components/myIcon.vue';
import EditPeriod from '@/components/timer/EditPeriod.vue';
import {
    currentPeriod,
    periods,
    setPeriod,
    updatePeriod,
} from '@/stores/ChronometerStore';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

function addPeriod() {
    updatePeriod(-1);
}
</script>

<style scoped>
.chronometer-editor {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    align-content: center;
    align-items: center;
    justify-content: center;
    gap: var(--field-margin);
    width: 100%;
    padding: var(--section-padding);
}

.active {
    border: 1px solid var(--color-primary);
}
</style>
