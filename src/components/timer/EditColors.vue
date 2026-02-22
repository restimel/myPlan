<template>
    <button
        class="btn-small"
        :popovertarget="dialogId"
    >
        {{ t('label.periodColors') }}
    </button>
    <dialog
        closedby="any"
        :id="dialogId"
        popover
    >
        <header>
            {{ title }}
        </header>
        <label class="background-color">
            {{ t('label.colors.background') }}
            <input
                type="color"
                v-model="background"
            >
            <MyIcon v-if="finalColors.background !== 'default'"
                icon="cancel"
                class="cancel-color"
                tabIndex="0"
                @click.prevent="background = defaultValue.background"
            />
        </label>
        <label class="timeout-color">
            {{ t('label.colors.timeout') }}
            <input
                type="color"
                v-model="timeout"
            >
            <MyIcon v-if="finalColors.timeout !== 'default'"
                icon="cancel"
                class="cancel-color"
                tabIndex="0"
                @click.prevent="timeout = defaultValue.timeout"
            />
        </label>
        <label class="warn-color">
            {{ t('label.colors.warn') }}
            <input
                type="color"
                v-model="txtWarning"
            >
            <MyIcon v-if="finalColors.txtWarning !== 'default'"
                icon="cancel"
                class="cancel-color"
                tabIndex="0"
                @click.prevent="txtWarning = defaultValue.txtWarning"
            />
        </label>

        <footer>
            <button
                class="primary-btn"
                :popovertarget="dialogId"
                popovertargetaction="hide"
            >
                {{ t('action.confirm') }}
            </button>
        </footer>
    </dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { getRandomId } from '@/utils/tools';

import type {
    PeriodColor,
    PeriodColors,
} from '@/stores/ChronometerStore';
import MyIcon from '../myIcon.vue';
const { t } = useI18n();

const props = defineProps<{
    modelValue: PeriodColors;
    title: string;
}>();

const emit = defineEmits<{
    'update:modelValue': [PeriodColors],
}>();

const defaultValue: PeriodColors = {
    background: readCssVariable('--color-bg-chronometer-default'),
    timeout: readCssVariable('--color-bg-chronometer-timeout'),
    txtWarning: readCssVariable('--color-chronometer-warning'),
};

const background = ref<PeriodColor>(defaultValue.background);
const txtWarning = ref<PeriodColor>(defaultValue.txtWarning);
const timeout = ref<PeriodColor>(defaultValue.timeout);

const dialogId: string = `period-dialog-${getRandomId()}`;

function readCssVariable(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const finalColors = computed<PeriodColors>(() => {
    const colors: PeriodColors = {
        background: background.value,
        timeout: timeout.value,
        txtWarning: txtWarning.value,
    };

    if (colors.background === defaultValue.background) {
        colors.background = 'default';
    }

    if (colors.txtWarning === defaultValue.txtWarning) {
        colors.txtWarning = 'default';
    }

    if (colors.timeout === defaultValue.timeout) {
        colors.timeout = 'default';
    }

    return colors;
});

const isChanged = computed<boolean>(() => {
    const colors = finalColors.value;
    const original = props.modelValue;

    return colors.background !== original.background ||
        colors.timeout !== original.timeout ||
        colors.txtWarning !== original.txtWarning;
});

function readValue(color: PeriodColor, defaultValue: string): string {
    if (color === 'default') {
        return defaultValue;
    }

    return color;
}

watch(props.modelValue, () => {
    const colors = props.modelValue;

    background.value = readValue(colors.background, defaultValue.background);
    timeout.value = readValue(colors.timeout, defaultValue.timeout);
    txtWarning.value = readValue(colors.txtWarning, defaultValue.txtWarning);
}, { immediate: true });

watch(finalColors, () => {
    if (!isChanged.value) {
        /* avoid reactive loop */
        return;
    }

    emit('update:modelValue', finalColors.value);
});

</script>

<style scoped>
button {
    display: inline-block;
}

dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;

    padding: var(--section-padding);
}

::backdrop {
    opacity: 0.75;
    background-color: var(--color-backdrop);
}

label {
    display: block;
    white-space: nowrap;
}

header {
    text-align: center;
    font-size: 1.5em;
}
footer {
    margin-top: var(--section-padding);
    text-align: center;
    --spacing-sm: var(--spacing-xs);
}

.cancel-color {
    margin-inline-start: var(--spacing-xs);
    cursor: pointer;
}
</style>
