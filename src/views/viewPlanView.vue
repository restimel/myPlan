<template>
    <div class="container">
        <RouteViewer
            :image="image"
            :holds="holds"
            :settings="settings"
            @settings="changeSettings"
        />
    </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { loadRoute, saveRoute } from '@/utils/storage';
import RouteViewer from '@/components/routeViewer.vue';

const router = useRouter();

const image = ref<ImageData | null>(null);
const holds = ref<Hold[]>([]);
const settings = ref<RouteSettings>({
    routeName: '',
});

onMounted(() => {
    const data = loadRoute();

    if (!data) {
        image.value = null;
        router.push('/build');
        return;
    }

    image.value = data.image;
    holds.value = data.holds;
    settings.value = data.settings;
});

function changeSettings(value: RouteSettings) {
    settings.value = value;

    if (image.value) {
        saveRoute(image.value, holds.value, settings.value);
    }
}

</script>
<style scoped>

.container {
    display: grid;
    grid-template-rows: 1fr max-content;
    grid-template-areas: "content" "actions";
}

</style>
