<template>
    <Transition name="pwa-prompt">
        <div v-if="needRefresh"
            class="pwa-prompt"
        >
            <div>{{ t('pwa.updateAvailable') }}</div>
            <small>v{{ oldVersion }}{{ newVersion ? ` → v${newVersion}` : ' to a newer version' }}</small>
            <div class="pwa-prompt-actions">
                <button
                    class="btn-primary btn-small"
                    @click="update"
                >
                    {{ t('pwa.update') }}
                </button>
                <button
                    class="btn-default btn-small"
                    @click="dismiss"
                >
                    {{ t('pwa.dismiss') }}
                </button>
            </div>
        </div>
    </Transition>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const { needRefresh, updateServiceWorker } = useRegisterSW();

const oldVersion = __APP_VERSION__;
const newVersion = ref<string | null>(null);

watch(needRefresh, async (value) => {
    if (!value) {
        return;
    }

    try {
        const response = await fetch('./version.json', { cache: 'no-store' });
        const data = await response.json();

        newVersion.value = data.version;
    } catch {
        /* ignore, newVersion stays null */
    }
}, {immediate: true});

function update() {
    updateServiceWorker(true);
}

function dismiss() {
    needRefresh.value = false;
}
</script>

<style scoped>
.pwa-prompt {
    position: fixed;
    bottom: var(--spacing-md);
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-primary);
    color: var(--color-txt-primary);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-lg);
    z-index: var(--zIndex-modal);
    max-width: min(90vw, 360px);
}

.pwa-prompt-actions {
    display: flex;
    gap: var(--spacing-xs);
}

.pwa-prompt-enter-active,
.pwa-prompt-leave-active {
    transition: transform var(--transition-normal) ease-out, opacity var(--transition-normal) ease-out;
}

.pwa-prompt-enter-from,
.pwa-prompt-leave-to {
    transform: translate(-50%, 120%);
    opacity: 0;
}
</style>
