<template>
    <aside
        :class="{
            menu: true,
            open: open,
        }"
    >
        <div
            class="handle"
            @click="toggleMenu"
        >
            <MyIcon icon="menu" />
        </div>

        <section v-if="open"
            class="actions"
        >
            <button v-for="actionItem of actions"
                class="action"
                :key="actionItem.type"
                :title="actionItem.title"
                :disabled="actionItem.disabled"
                @click="action(actionItem.type)"
            >
                <MyIcon :icon="actionItem.icon" />
            </button>
        </section>
    </aside>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import MyIcon, { type Icons } from '@/components/myIcon.vue';

type Action = {
    type: string;
    icon: Icons;
    title?: string;
    disabled?: boolean;
};

type Props = {
    actions: Action[];
};

defineProps<Props>();

const emit = defineEmits<{
    action: [string],
    open: [boolean],
}>();

const open = ref(false);

function toggleMenu() {
    open.value = !open.value;
    emit('open', open.value);
}

function action(type: string) {
    emit('action', type);
}

</script>
<style scope>
.menu {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translate(-50%, 0);

    box-shadow: var(--shadow-primary);
}

.actions {
    display: flex;
    flex-direction: row;
    gap: var(--spacing-sm);
    padding: var(--spacing-xs);

    border-top-left-radius: var(--border-radius);
    border-top-right-radius: var(--border-radius);

    background: var(--color-background);
    color: var(--color-text);
}

.handle {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translate(-50%, -100%);
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--color-background);
    color: var(--color-text);
    border-top-left-radius: var(--border-radius);
    border-top-right-radius: var(--border-radius);
    padding: var(--spacing-xs);
    cursor: pointer;

    box-shadow: var(--shadow-primary);
}

.open .handle {
    box-shadow: none;
}
</style>
