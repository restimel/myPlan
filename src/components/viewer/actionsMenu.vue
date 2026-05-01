<template>
    <button
        class="action menu-handle"
        v-show="!open"
        @click="toggleMenu"
    >
        <MyIcon icon="menu" />
    </button>

    <Transition name="slide-up">
        <aside v-if="open"
            class="menu"
        >
            <button
                class="inner-menu-handle action"
                @click="toggleMenu"
            >
                <MyIcon icon="menu" />
            </button>

            <section
                class="actions"
            >
                <button v-for="actionItem of actions"
                    class="action"
                    :class="{
                        active: !!actionItem.active,
                    }"
                    :key="actionItem.type"
                    :title="actionItem.title"
                    :disabled="actionItem.disabled"
                    @click="action(actionItem.type)"
                >
                    <MyIcon :icon="actionItem.icon" />
                </button>
            </section>
        </aside>
    </Transition>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import MyIcon, { type Icons } from '@/components/myIcon.vue';

export type Action = {
    type: string;
    icon: Icons;
    title?: string;
    disabled?: boolean;
    active?: boolean;
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
<style scoped>
.menu {
    position: absolute;
    z-index: var(--zIndex-menu);
    bottom: 0;
    left: 50%;
    transform: translate(-50%, 0);
}

.actions {
    position: relative;
    z-index: 2; /* to be over the handle */
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-evenly;
    gap: var(--spacing-sm);
    padding: var(--spacing-xs);

    border-top-left-radius: var(--border-radius);
    border-top-right-radius: var(--border-radius);
    border: 1px solid var(--glass-border);
    border-bottom: none;

    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
}

.inner-menu-handle {
    position: absolute;
    z-index: 1;
    top: 2px;
    left: 50%;
    transform: translate(-50%, -100%);
    display: flex;
    justify-content: center;
    align-items: center;
    border-top-left-radius: var(--border-radius);
    border-top-right-radius: var(--border-radius);
    border: 1px solid var(--glass-border);
    border-bottom: none;
    padding: var(--spacing-xs);
    cursor: pointer;

    color: var(--vt-c-white);
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
}

.inner-menu-handle:active:not([disabled]) {
    /* The global rule sets transform: scale(0.96), which would override the
     * translate and shift the button away from its position, causing mouseup
     * to fire outside the element and the menu to never close. */
    transform: translate(-50%, -100%) scale(0.96);
}

.slide-up-enter-active,
.slide-up-leave-active {
    transition: transform var(--transition-normal), opacity var(--transition-normal);
}

.slide-up-enter-from,
.slide-up-leave-to {
    transform: translate(-50%, 100%);
    opacity: 0;
}

</style>
