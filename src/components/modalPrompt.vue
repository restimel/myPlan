<template>
    <DialogConfirm
        :message="title"
        @confirm="close(true)"
        @cancel="close(false)"
    >
        <form
            @submit.prevent.stop="submitForm"
            ref="modalForm"
        >
            <label v-for="item of items"
                :key="item.name"
            >
                {{ item.label }}
                <input v-if="item.type === 'number'"
                    type="number"
                    v-model="internalValue[item.name]"
                    :data-name="item.name"
                >
                <input v-else
                    type="text"
                    v-model="internalValue[item.name]"
                    :data-name="item.name"
                >
            </label>
        </form>
    </DialogConfirm>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import DialogConfirm from '@/components/dialogConfirm.vue';

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