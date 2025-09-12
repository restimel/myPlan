<template>
    <div class="container">
        <VideoPlan v-if="mode === 'video'"
            @image="getImage"
        />
        <CanvasHold v-if="mode === 'canvas'"
            :image="image"
            @back="mode = 'video'"
            @view="toView"
        />
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { image } from '@/utils/holds';
import VideoPlan from '@/components/videoPlan.vue';
import CanvasHold from '@/components/canvasHold.vue';
import routeStore from '@/stores/RouteStore';

const router = useRouter();

const mode = ref<'video' | 'canvas'>(image.value ? 'canvas' : 'video');

function getImage(data: ImageData | null) {
    if (!data) {
        return;
    }

    image.value = data;
    mode.value = 'canvas';
}

function toView() {
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
