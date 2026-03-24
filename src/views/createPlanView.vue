<template>
    <div class="container editor-page">
        <VideoPlan v-if="mode === 'video'"
            :adjacentImage="adjacentImageForVideo"
            @image="getImage"
            @cancel="onCancelCapture"
        />
        <CanvasHold v-if="mode === 'canvas'"
            :image="routeStore.image"
            :store="routeStore"
            @back="mode = 'video'"
            @view="toView"
            @addPhoto="onAddPhoto"
        />
        <ImageStitch v-if="mode === 'stitch' && imageTopForStitch && imageBottomForStitch"
            :imageTop="imageTopForStitch"
            :imageBottom="imageBottomForStitch"
            :movableImage="adjacentSide === 'top' ? 'top' : 'bottom'"
            @merged="onMerged"
            @cancel="onStitchCancel"
        />
        <DialogConfirm v-if="showConfirm"
            :message="t('build.confirmLeave')"
            @confirm="onConfirmLeave"
            @cancel="onCancelLeave"
        />
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, onBeforeRouteLeave, type RouteLocationRaw } from 'vue-router';
import { useI18n } from 'vue-i18n';
import VideoPlan from '@/components/videoPlan.vue';
import CanvasHold from '@/components/canvasHold.vue';
import ImageStitch from '@/components/imageStitch.vue';
import DialogConfirm from '@/components/dialogConfirm.vue';
import routeStore from '@/stores/RouteStore';

const router = useRouter();
const { t } = useI18n();

const mode = ref<'video' | 'stitch' | 'canvas'>(routeStore.image ? 'canvas' : 'video');
const intentionalLeave = ref(false);
const showConfirm = ref(false);
const pendingRoute = ref<RouteLocationRaw | null>(null);

const isAddingPhoto = ref(false);
const adjacentSide = ref<'top' | 'bottom'>('bottom');
const newCapturedImage = ref<ImageData | null>(null);

const adjacentImageForVideo = computed(() => {
    if (!isAddingPhoto.value || !routeStore.image) {
        return undefined;
    }

    return { image: routeStore.image, side: adjacentSide.value };
});

const imageTopForStitch = computed(() =>
    adjacentSide.value === 'bottom' ? routeStore.image : newCapturedImage.value
);
const imageBottomForStitch = computed(() =>
    adjacentSide.value === 'bottom' ? newCapturedImage.value : routeStore.image
);

const shouldWarnBeforeLeave = computed(() =>
    !intentionalLeave.value && routeStore.image !== null && routeStore.holds.length > 0
);

function handleBeforeUnload(evt: BeforeUnloadEvent) {
    if (shouldWarnBeforeLeave.value) {
        evt.preventDefault();
    }
}

onMounted(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
});

onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
});

onBeforeRouteLeave((to) => {
    if (shouldWarnBeforeLeave.value) {
        pendingRoute.value = to;
        showConfirm.value = true;
        return false;
    }
});

function onConfirmLeave() {
    showConfirm.value = false;
    intentionalLeave.value = true;
    router.push(pendingRoute.value ?? '/');
}

function onCancelLeave() {
    showConfirm.value = false;
    pendingRoute.value = null;
}

function getImage(data: ImageData | null) {
    if (!data) {
        return;
    }

    if (isAddingPhoto.value) {
        newCapturedImage.value = data;
        mode.value = 'stitch';
        return;
    }

    routeStore.resetHolds();
    routeStore.image = data;
    mode.value = 'canvas';
}

function onAddPhoto(side: 'top' | 'bottom') {
    adjacentSide.value = side;
    isAddingPhoto.value = true;
    mode.value = 'video';
}

function onCancelCapture() {
    isAddingPhoto.value = false;
    mode.value = 'canvas';
}

function onMerged(data: ImageData) {
    routeStore.image = data;
    newCapturedImage.value = null;
    isAddingPhoto.value = false;
    mode.value = 'canvas';
}

function onStitchCancel() {
    newCapturedImage.value = null;
    isAddingPhoto.value = false;
    mode.value = 'canvas';
}

function toView() {
    intentionalLeave.value = true;
    routeStore.needAction('openSettings');
    router.push('/view');
}
</script>

<style scoped>
.container {
    display: grid;
    grid-template-rows: 1fr max-content;
    grid-template-areas: "content" "actions";
    position: relative;
}

</style>
<style>
footer.footer-actions {
    grid-area: actions;
    background: var(--color-secondary);
    color: var(--color-txt-secondary);
    display: flex;
    flex-direction: row;
    justify-content: center;
    gap: var(--spacing-sm);
}

.footer-actions button {
    padding: var(--spacing-xs) var(--spacing-xs);
    font-size: var(--font-size-sm);
}
</style>
