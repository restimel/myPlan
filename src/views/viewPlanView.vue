<template>
    <div class="container">
        <CanvasHold
            :image="image"
        />
    </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { loadRoute } from '@/utils/storage';
import CanvasHold from '@/components/canvasHold.vue';

const router = useRouter();

const image = ref<ImageData | null>(null);
const holds = ref<Hold[]>([]);

onMounted(() => {
    const data = loadRoute();

    if (!data) {
        image.value = null;
        router.push('/build');
        return;
    }

    image.value = data.image;
    holds.value = data.holds;
});
</script>

<style scoped>
.container {
    display: grid;
    grid-template-rows: 1fr max-content;
    grid-template-areas: "content" "actions";
}

</style>
