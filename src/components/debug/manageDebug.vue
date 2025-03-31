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
            <div v-for="(log, index) of (logs.get(see) ?? [])"
                :key="index"
            >
                <span class="timestamp">
                    {{ log.ts }}
                </span>
                <span class="message">
                    {{ log.msg }}
                </span>
            </div>
        </fieldset>
    </section>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { debug, logs, resetDebug, type Category } from '@/utils/debug';

const categories: Category[] = [
    'interaction',
    'time',
    'save',
    'zoom',
];

const see = ref<Category | null>(null);
</script>
<style scoped>
label {
    display: block;
}
button.small {
    padding: 2px;
}
</style>
