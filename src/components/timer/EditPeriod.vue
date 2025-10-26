<template>
    <div class="edit-timer" @click.self="emit('active')">
        <label class="period-name">
            {{ t('label.periodName') }}
            <input
                type="text"
                v-model="localPeriod.name"
            >
        </label>
        <label class="period-duration">
            {{ t('label.periodDuration') }}
            <DurationEditor
                v-model="localPeriod.duration"
            />
        </label>
        <label class="period-action">
            {{ t('label.periodAction') }}
            <select
                v-model="localPeriod.endEffect"
            >
                <option value="stop">{{ t('chronometer.actionStop') }}</option>
                <option value="startNext">{{ t('chronometer.actionStartNext') }}</option>
                <option value="restart">{{ t('chronometer.actionRepeat') }}</option>
                <option value="continue">{{ t('chronometer.actionContinue') }}</option>
            </select>
        </label>
        <fieldset class="period-options">
            <legend>
                {{ t('chronometer.warningTitle') }}
            </legend>

            <label :disabled="!isVibrateSupported">
                <input
                    type="checkbox"
                    v-model="localPeriod.activateVibration"
                    :disabled="!localPeriod.activateVibration && !canUseVibration"
                >
                {{ t('chronometer.activateVibration') }}
            </label>
            <label>
                <input
                    type="checkbox"
                    v-model="localPeriod.activateSound"
                >
                {{ t('chronometer.activateSound') }}
            </label>
            <label
                :class="{
                    disabled: !localPeriod.activateSound,
                }"
            >
                <input
                    type="checkbox"
                    v-model="localPeriod.soundWarning"
                >
                {{ t('chronometer.activateBeepWarning') }}
            </label>
        </fieldset>
        <ConfirmButton
            class="period-delete btn-small"
            :disabled="alone"
            :message="t('chronometer.deletePeriodConfirm')"
            position="left"
            @click="deletePeriod(periodIndex)"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
    defaultPeriod,
    deletePeriod,
    isVibrateSupported,
    periods,
    updatePeriod,
    type Period,
} from '@/stores/ChronometerStore';
import { getRandomId } from '@/utils/tools';
import ConfirmButton from '@/components/ConfirmButton.vue';
import DurationEditor from '@/components/timer/DurationEditor.vue';

const { t } = useI18n();

const props = defineProps<{
    periodIndex: number;
    alone: boolean;
}>();

const emit = defineEmits<{
    active: [],
}>();

const localPeriod = ref<Period>({
    ...defaultPeriod,
});

const canUseVibration = computed<boolean>(() => {
    return true;
});

watch(() => props.periodIndex,
    () => {
        const index= props.periodIndex;
        const value = periods.value[index];

        if (value) {
            localPeriod.value = { ...value };
            return;
        }

        localPeriod.value = {
            ...defaultPeriod,
            name: `period ${index + 1}`,
            id: getRandomId(),
        };
    },
    { immediate: true }
);

watch(() => localPeriod.value.soundWarning, (value) => {
    if (value) {
        localPeriod.value.activateSound = true;
    }
});

watch(
    localPeriod,
    (newValue) => {
        updatePeriod(props.periodIndex, newValue);
    },
    { deep: true }
);

</script>

<style scoped>
.edit-timer {
    position: relative;
    display: grid;
    grid-template: "name options delete" "duration options delete" "action options delete" / 1fr max-content max-content;
    align-items: center;
    gap: var(--field-padding);
    width: 100%;
    padding: var(--field-padding);
}

@media (max-width: 600px) {
    .edit-timer {
        grid-template: "name delete" "duration  delete" "action delete" "options delete" / 1fr max-content;
    }
}

.edit-timer:nth-child(odd) {
    background-color: var(--color-background-light);
}
.edit-timer:nth-child(even) {
    background-color: var(--color-background-soft);
}

.period-name {
    grid-area: name;
}

.period-duration {
    grid-area: duration;
}

.period-action {
    grid-area: action;
}

.period-options {
    grid-area: options;
}

.period-delete {
    grid-area: delete;
}

.period-options {
    display: flex;
    flex-direction: column;
}

.disabled {
    opacity: 0.5;
}
</style>
