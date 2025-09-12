<template>
<aside class="modal">
    <header>
        {{ title }}
    </header>

    <form
        @submit.prevent.stop="submitForm"
        ref="modalForm"
    >
        <label v-for="item of items"
            :key="item.name"
        >
            {{ item.label }}
            <input
                type="text"
                v-model="internalValue[item.name]"
                :data-name="item.name"
            >
        </label>
    </form>

    <footer>
        <button
            class="primary-btn"
            @click="close(true)"
        >
            <MyIcon icon="ok" />
            {{ t('action.confirm') }}
        </button>
        <button
            @click="close(false)"
        >
            <MyIcon icon="cancel" />
            {{ t('action.cancel') }}
        </button>
    </footer>
</aside>
</template>

<script lang="ts" setup>
import { defineProps, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import MyIcon from '@/components/myIcon.vue';

type ItemText = {
    label: string;
    name: string;
    type: 'text';
    value: string;
};

type ItemNumber = {
    label: string;
    name: string;
    type: 'number';
    value: number;
};

type Item = ItemText | ItemNumber;
type Items = Item[];

type Result = Record<string, string | number>;

type HTMLFocusableElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | undefined;

type Props = {
    title: string;
    items: Items;
};

const props = defineProps<Props>();
const emit = defineEmits<{
    close: [Result | undefined];
}>();
const { t } = useI18n();

const internalValue = ref<Result>({});
const modalForm = ref<HTMLFormElement>();

const focusIndex = ref(0);

watch(() => props.items, () => {
    const val: Result = {};

    props.items.forEach((item) => {
        val[item.name] = item.value;
    });

    internalValue.value = val;
}, { immediate: true });

function close(submit = false) {
    if (submit) {
        emit('close', internalValue.value);
    } else {
        emit('close', undefined);
    }
}

function submitForm() {
    const element = document.activeElement as HTMLElement;

    if (!element) {
        return;
    }

    element?.blur?.();
    const name = element.dataset.name;
    const items = props.items;
    const index = items.findIndex((item) => item.name === name);

    if (index === -1) {
        return;
    }

    if (index === items.length - 1) {
        close(true);
        return;
    }

    focusIndex.value = index + 1;
    setFocus();
}

function setFocus() {
    const formEl = modalForm.value;

    if (!formEl) {
        return;
    }

    const index = focusIndex.value;
    const inputEl = (formEl.querySelectorAll('input,select,textarea') ?? [])[index] as HTMLFocusableElement;

    if (!inputEl) {
        return;
    }

    inputEl.focus();
}

onMounted(() => {
    setFocus();
});

</script>

<style scoped>
.modal {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;
    box-shadow: var(--shadow-primary);

    background: var(--color-background);
    color: var(--color-text);

    padding: var(--spacing-md);
}

header {
    font-size: var(--font-size-xl);
    margin-bottom: var(--field-margin);
    text-align: center;
}
footer {
    margin-top: var(--field-margin);
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    gap: var(--spacing-xs);
}
</style>
