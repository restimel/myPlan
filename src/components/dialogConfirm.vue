<template>
    <div class="backdrop" @click.self="emit('cancel')">
        <aside class="modal">
            <p class="message">{{ message }}</p>
            <slot />
            <footer>
                <button class="btn-outline" @click="emit('cancel')">
                    <MyIcon icon="cancel" />
                    {{ t('action.cancel') }}
                </button>
                <button class="primary-btn" @click="emit('confirm')">
                    <MyIcon icon="ok" />
                    {{ t('action.confirm') }}
                </button>
            </footer>
        </aside>
    </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import MyIcon from '@/components/myIcon.vue';

defineProps<{
    message: string;
}>();

const emit = defineEmits<{
    confirm: [];
    cancel: [];
}>();

const { t } = useI18n();
</script>

<style scoped>
.backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: var(--zIndex-modal);
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal {
    background: var(--color-background);
    color: var(--color-text);
    padding: var(--spacing-md);
    box-shadow: var(--shadow-lg);
    border-radius: var(--border-radius);
    max-width: min(90vw, 400px);
    max-height: 85vh;
    overflow-y: auto;
}

.message {
    font-size: var(--font-size-lg);
    text-align: center;
}

footer {
    margin-top: var(--field-margin);
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    gap: var(--spacing-sm);
}
</style>
