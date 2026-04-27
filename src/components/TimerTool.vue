<template>
    <main class="chronometer-editor">
        <div class="chronometer-editor__container">
            <RouterLink to="/chronometer">
                <button
                    class="primary-btn"
                >
                    <MyIcon
                        icon="size"
                    />
                    {{ t('chronometer.fullscreenPlayer') }}
                </button>
            </RouterLink>
            <EditPeriod v-for="(period, periodIndex) of periods"
                :class="{ active: period.id === currentPeriod.id }"
                :period-index="periodIndex"
                :alone="periods.length === 1"
                :collapsed="period.id !== currentPeriod.id"
                :key="`edit-period-${period.id}`"
                @active="onPeriodActive(periodIndex)"
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
            <button
                class="default-btn"
                :disabled="isDefaultPeriods"
                @click="clearPeriods"
            >
                <MyIcon
                    icon="delete"
                />
                {{ t('chronometer.clearPeriods') }}
            </button>
        </div>
    </main>
</template>

<script setup lang="ts">
import MyIcon from '@/components/myIcon.vue';
import EditPeriod from '@/components/timer/EditPeriod.vue';
import {
    clearPeriods,
    currentPeriod,
    isDefaultPeriods,
    periods,
    setPeriod,
    updatePeriod,
} from '@/stores/ChronometerStore';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

function addPeriod() {
    const newIndex = updatePeriod(-1);
    setPeriod(newIndex);
}

function onPeriodActive(periodIndex: number) {
    const isCurrentPeriod = periods.value[periodIndex]?.id === currentPeriod.value.id;

    if (isCurrentPeriod && periodIndex < periods.value.length - 1) {
        setPeriod(periodIndex + 1);
    } else {
        setPeriod(periodIndex);
    }
}
</script>

<style scoped>
.chronometer-editor {
    width: 100%;
    height: 100%;
    padding: var(--section-padding);
    overflow: auto;
}

.chronometer-editor__container {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    align-content: center;
    align-items: center;
    justify-content: center;
    gap: var(--field-margin);
}

.active {
    border: 1px solid var(--color-primary);
}
</style>
