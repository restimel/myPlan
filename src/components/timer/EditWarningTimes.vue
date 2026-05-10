<template>
    <button
        class="warning-settings-btn"
        @click.stop="openDialog"
    >
        <MyIcon icon="settings" :size="10" />
    </button>
    <DialogConfirm v-if="isOpen"
        class="large"
        :message="t('chronometer.warningTimesTitle')"
        @confirm="onConfirm"
        @cancel="onCancel"
    >
        <label class="warning-enable">
            <input type="checkbox" v-model="localEnabled" />
            {{ t('chronometer.activateBeepWarning') }}
            <MyIcon
                icon="play"
                :size="10"
                class="demo-effect"
                @click.stop.prevent="beepTime()"
            />
        </label>

        <section class="warning-chips">
            <span v-for="time in sortedDisplayTimes"
                :key="time"
                class="chip"
            >
                {{ formatDuration(time) }}
                <MyIcon
                    icon="cancel"
                    :size="10"
                    class="chip-remove"
                    @click="removeTime(time)"
                />
            </span>
            <span v-if="sortedDisplayTimes.length === 0"
                class="no-times"
            >
                {{ t('chronometer.noWarningTimes') }}
            </span>
        </section>

        <button v-if="sortedDisplayTimes.length > 0"
            class="btn-small clear-btn"
            @click="clearTimes"
        >
            {{ t('chronometer.clearWarningTimes') }}
        </button>

        <section class="warning-add">
            <div class="add-single">
                <input
                    type="number"
                    v-model.number="newTimeInput"
                    min="1"
                    class="time-input"
                    @keydown.enter.prevent="addSingleTime"
                />
                <span>s</span>
                <button class="btn-small" @click.prevent="addSingleTime">
                    <MyIcon icon="add" :size="12" />
                </button>
            </div>
            <details class="add-range">
                <summary>{{ t('chronometer.addRange') }}</summary>
                <div class="range-form">
                    <div class="range-inputs-row">
                        <label>
                            {{ t('chronometer.rangeFrom') }}
                            <input type="number" v-model.number="rangeFrom" min="1" class="time-input" />
                            s
                        </label>
                        <label>
                            {{ t('chronometer.rangeTo') }}
                            <input type="number" v-model.number="rangeTo" min="1" class="time-input" />
                            s
                        </label>
                        <label>
                            {{ t('chronometer.rangeEvery') }}
                            <input type="number" v-model.number="rangeEvery" min="1" class="time-input" />
                            s
                        </label>
                    </div>
                    <p v-if="rangePreview.length > 0" class="range-preview">
                        → {{ rangePreview.slice(0, PREVIEW_MAX).map(formatDuration).join(', ') }}<template v-if="rangePreview.length > PREVIEW_MAX">… (+{{ rangePreview.length - PREVIEW_MAX }})</template>
                    </p>
                    <button class="btn-small" @click.prevent="addRange">
                        {{ t('chronometer.addRangeBtn') }}
                    </button>
                </div>
            </details>
        </section>
    </DialogConfirm>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { DEFAULT_WARNING_TIMES } from '@/stores/ChronometerStore';
import { beepTime } from '@/utils/sound';
import { formatDuration } from '@/utils/tools';
import DialogConfirm from '@/components/dialogConfirm.vue';
import MyIcon from '../myIcon.vue';

const { t } = useI18n();

const PREVIEW_MAX = 15;

const props = defineProps<{
    soundWarning: boolean;
    warningTimes: number[] | undefined;
}>();

const emit = defineEmits<{
    'update:soundWarning': [boolean];
    'update:warningTimes': [number[]];
}>();

const isOpen = ref(false);

const localEnabled = ref(props.soundWarning);
const localTimes = ref<number[]>([...(props.warningTimes ?? DEFAULT_WARNING_TIMES)]);

const newTimeInput = ref<number | null>(null);
const rangeFrom = ref<number>(10);
const rangeTo = ref<number>(1);
const rangeEvery = ref<number>(1);

const sortedDisplayTimes = computed(() => {
    return [...new Set(localTimes.value)].sort((a, b) => b - a);
});

const rangePreview = computed<number[]>(() => {
    const from = rangeFrom.value;
    const to = rangeTo.value;
    const every = rangeEvery.value;

    if (!from || !to || !every || from <= 0 || to <= 0 || every <= 0) {
        return [];
    }

    const start = Math.max(from, to);
    const end = Math.min(from, to);
    const times: number[] = [];

    for (let val = start; val >= end; val -= every) {
        times.push(val * 1_000);
    }

    return times;
});


function removeTime(ms: number) {
    localTimes.value = localTimes.value.filter((time) => time !== ms);
}

function clearTimes() {
    localTimes.value = [];
}

function addSingleTime() {
    const seconds = newTimeInput.value;

    if (!seconds || seconds <= 0) {
        return;
    }

    const ms = seconds * 1_000;

    if (!localTimes.value.includes(ms)) {
        localTimes.value = [...localTimes.value, ms];
    }

    newTimeInput.value = null;
}

function addRange() {
    const from = rangeFrom.value;
    const to = rangeTo.value;
    const every = rangeEvery.value;

    if (!from || !to || !every || from <= 0 || to <= 0 || every <= 0) {
        return;
    }

    const newTimes = [...localTimes.value];

    for (const ms of rangePreview.value) {
        if (!newTimes.includes(ms)) {
            newTimes.push(ms);
        }
    }

    localTimes.value = newTimes;
}

function openDialog() {
    localEnabled.value = props.soundWarning;
    localTimes.value = [...(props.warningTimes ?? DEFAULT_WARNING_TIMES)];
    isOpen.value = true;
}

function onCancel() {
    isOpen.value = false;
}

function onConfirm() {
    emit('update:soundWarning', localEnabled.value);
    emit('update:warningTimes', sortedDisplayTimes.value);
    isOpen.value = false;
}
</script>

<style scoped>
button.warning-settings-btn {
    display: inline-flex;
    align-items: center;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: inherit;
}

label {
    margin-bottom: var(--field-margin);
}

.warning-enable {
    display: flex;
    flex-direction: row;
    gap: 5px;
    align-items: center;
}

.demo-effect {
    cursor: pointer;
    margin-inline-start: auto;
}

.warning-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    min-height: 2em;
    user-select: none;
}

.chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    border-radius: 12px;
    background-color: var(--color-background-soft);
    border: 1px solid var(--color-border);
    font-size: 0.9em;
}

.chip-remove {
    cursor: pointer;
    opacity: 0.6;
}

.chip-remove:hover {
    opacity: 1;
}

.no-times {
    opacity: 0.6;
    font-style: italic;
    font-size: 0.9em;
}

.clear-btn {
    align-self: flex-start;
}

.warning-add {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    margin-top: var(--field-margin);
}

.add-single {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--spacing-xs);
}

.time-input {
    width: 5em;
}

.add-range summary {
    cursor: pointer;
    font-size: 0.9em;
    opacity: 0.8;
    user-select: none;
}

.range-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding-top: var(--spacing-xs);
}

.range-inputs-row {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    align-items: center;
}

.range-inputs-row label {
    display: flex;
    align-items: center;
    gap: 4px;
}

.range-preview {
    font-size: 0.85em;
    opacity: 0.8;
    word-break: break-word;
}
</style>
