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
            <ConfirmButton
                class="default-btn"
                :disabled="isDefaultPeriods"
                :message="t('chronometer.clearPeriodsConfirm')"
                @click="clearPeriods"
            >
                {{ t('chronometer.clearPeriods') }}
            </ConfirmButton>
            <TemplatesSection />
            <fieldset class="action-feedback">
                <legend>{{ t('chronometer.actionFeedbackTitle') }}</legend>
                <label :class="{ disabled: !isVibrateSupported }">
                    <input
                        v-model="settings.actionVibration"
                        type="checkbox"
                        :disabled="!isVibrateSupported"
                    >
                    {{ t('chronometer.activateVibration') }}
                    <MyIcon v-if="isVibrateSupported"
                        icon="play"
                        :size="10"
                        class="demo-effect"
                        @click.stop.prevent="vibrateAction()"
                    />
                </label>
                <label>
                    <input
                        v-model="settings.actionSound"
                        type="checkbox"
                    >
                    {{ t('chronometer.activateSound') }}
                    <MyIcon
                        icon="play"
                        :size="10"
                        class="demo-effect"
                        @click.stop.prevent="beepAction()"
                    />
                </label>
            </fieldset>
        </div>
    </main>
</template>

<script setup lang="ts">
import MyIcon from '@/components/myIcon.vue';
import ConfirmButton from '@/components/ConfirmButton.vue';
import EditPeriod from '@/components/timer/EditPeriod.vue';
import TemplatesSection from '@/components/timer/TemplatesSection.vue';
import {
    clearPeriods,
    currentPeriod,
    isDefaultPeriods,
    isVibrateSupported,
    periods,
    setPeriod,
    settings,
    updatePeriod,
    vibrateAction,
} from '@/stores/ChronometerStore';
import { beepAction } from '@/utils/sound';
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

.action-feedback {
    display: flex;
    flex-direction: column;
    width: 100%;
}

.action-feedback label {
    display: flex;
    flex-direction: row;
    gap: 5px;
    align-items: center;
}

.action-feedback .demo-effect {
    cursor: pointer;
    margin-inline-start: auto;
}

.disabled {
    opacity: var(--disabled-opacity);
}
</style>
