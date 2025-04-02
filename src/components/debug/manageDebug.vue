<template>
    <section v-if="debug">
        <label>
            <input
                v-model="debug.featureNext"
                type="checkbox"
            >
            Next feature
        </label>
        <label v-for="category of categories"
            :key="category"
        >
            <input
                v-model="debug.logs[category]"
                type="checkbox"
            >
            {{ category }}
            <button
                class="small"
                @click="see=category"
            >
                See
            </button>
        </label>
        <button @click="resetDebug">
            Reset
        </button>
        <fieldset v-if="see">
            <legend>Logs: {{ see }}</legend>
            <div v-for="(log, idx) of seeLogs"
                :key="`${log.ts} ${idx}`"
                class="logList"
            >
                <span class="timestamp">
                    {{ log.ts }}
                </span>
                <span class="duration">
                    [{{ log.duration }}]
                </span>
                <span class="message">
                    {{ log.msg }}
                </span>
            </div>
        </fieldset>
    </section>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { debug, logs, resetDebug, type Category } from '@/utils/debug';

const categories: Category[] = [
    'interaction',
    'time',
    'save',
    'zoom',
];

const see = ref<Category | null>(null);

const seeLogs = computed(() => {
    const seeValue = see.value;

    if (!seeValue) {
        return [];
    }

    const list = logs.value.get(seeValue) ?? [];

    return list.map((log, idx) => {
        const previousTs = list[idx - 1]?.ts ?? 0;

        return {
            msg: log.msg,
            ts: log.ts,
            duration: log.ts - previousTs,
        };
    });
});
</script>
<style scoped>
label {
    display: block;
}
button.small {
    padding: 2px;
}

.logList {
    display: grid;
    grid-template-columns: min-content min-content 1fr;
    gap: var(--spacing-xs);
}
</style>
