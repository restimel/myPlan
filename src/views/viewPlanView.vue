<template>
    <div class="container view-page">
        <RouteViewer
            :store="routeStore"
        />
    </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { loadRoute, saveRoute } from '@/utils/storage';
import RouteViewer from '@/components/routeViewer.vue';
import routeStore from '@/stores/RouteStore';

const router = useRouter();

const mounted = ref(false);

watch(routeStore.settings, () => {
    if (mounted.value && routeStore.image) {
        saveRoute(routeStore.image, routeStore.holds, routeStore.settings);
    }
}, { deep: true });

onMounted(() => {
    const data = loadRoute();

    routeStore.initialize(data);

    if (!data) {
        router.push('/build');
        return;
    }

    mounted.value = true;
});

</script>
<style scoped>

.container {
    display: grid;
    grid-template-rows: 1fr max-content;
    grid-template-areas: "content" "actions";
}

</style>
