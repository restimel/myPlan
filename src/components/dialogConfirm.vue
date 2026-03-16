<template>
    <div class="backdrop" @click.self="emit('cancel')">
        <aside class="modal">
            <p class="message">{{ message }}</p>
            <footer>
                <button class="primary-btn" @click="emit('confirm')">
                    <MyIcon icon="ok" />
                    {{ t('action.confirm') }}
                </button>
                <button @click="emit('cancel')">
                    <MyIcon icon="cancel" />
                    {{ t('action.cancel') }}
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
    box-shadow: var(--shadow-primary);
    max-width: 90vw;
}

.message {
    font-size: var(--font-size-lg);
    margin-bottom: var(--field-margin);
    text-align: center;
}

footer {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    gap: var(--spacing-xs);
}
</style>
