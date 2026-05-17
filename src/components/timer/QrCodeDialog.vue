<template>
    <DialogConfirm
        class="large"
        :message="title"
        @confirm="emit('close')"
        @cancel="emit('close')"
    >
        <canvas ref="qrCanvas" class="qr-canvas" />
        <button v-if="!showUrl"
            class="btn-transparent qr-url"
            @click="showUrl = true"
        >
            {{ t('action.showUrl') }}
        </button>
        <p v-else class="qr-url">
            <a :href="url">
                {{ url }}
            </a>
        </p>
    </DialogConfirm>
</template>

<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue';
import QRCode from 'qrcode';
import DialogConfirm from '@/components/dialogConfirm.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
    url: string;
    title: string;
}>();

const emit = defineEmits<{
    close: [];
}>();

const qrCanvas = useTemplateRef('qrCanvas');
const showUrl = ref(false);

onMounted(async () => {
    if (qrCanvas.value) {
        await QRCode.toCanvas(qrCanvas.value, props.url, { width: 256 });
    }
});
</script>

<style scoped>
.qr-canvas {
    display: block;
    margin: 0 auto;
    max-width: 100%;
    height: auto;
}

.qr-url {
    display: inline-block;
    width: 100%;
    padding: 0;
    font-size: var(--font-size-sm);
    word-break: break-all;
    text-align: center;
    margin-top: var(--field-margin);
    color: var(--color-text-details);
}
</style>
