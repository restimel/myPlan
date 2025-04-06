<template>
<aside class="modal">
    <h2>{{ title }}</h2>

    <label v-for="item of items"
        :key="item.name"
    >
        {{ item.label }}
        <input
            type="text"
            v-model="internalValue[item.name]"
        >
    </label>

    <footer>
        <button
            class="primary-btn"
            @click="close(true)"
        >
            {{ t('action.confirm') }}
        </button>
        <button
            @click="close(false)"
        >
            {{ t('action.cancel') }}
        </button>
    </footer>
</aside>
</template>

<script lang="ts" setup>
import { defineProps, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

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

type Result = Record<Item['name'], Item['value']>;

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
</script>

<style scoped>
.modal {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;

    background: var(--color-background);
    color: var(--color-text);

    padding: var(--spacing-md);
}
</style>
