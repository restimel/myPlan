<template>
    <CanvasDisplay
        ref="canvasDisplayRef"
        :image="store.image"
        details
        :store="store"
        :onAction="onAction"
        message=""
        @canvas="(list) => canvasList = list"
    />
    <ZoomResetButton
        :scaleRatio="scaleRatioValue"
        :minScale="minScaleValue"
        @reset="canvasDisplayRef?.resetZoom()"
    />
    <div class="menu">
        <ActionMenu
            @action="action"
            :actions="[{
                type: 'edit',
                icon: 'edit',
            }, {
                type: 'exportFile',
                icon: 'save',
            }, {
                type: 'settings',
                icon: 'settings',
            }]"
        />
    </div>
    <RouteSettings
        :store="store"
        :show="showSettings"
        @close="showSettings = false"
    />
</template>
<script lang="ts" setup>
import { computed, ref, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';
import { exportImage } from '@/utils/files';
import ActionMenu from '@/components/viewer/actionsMenu.vue';
import RouteSettings from '@/components/routeSettings.vue';
import type { RouteStore } from '@/stores/RouteStore';
import CanvasDisplay from '@/components/canvasDisplay.vue';
import ZoomResetButton from '@/components/ZoomResetButton.vue';
import { log } from '@/utils/debug';
import type { ScreenAction } from '@/utils/screenStates';
import { aggregateCanvas } from '@/utils/image';

const props = defineProps<{
    store: RouteStore;
}>();

const router = useRouter();

const canvasDisplayRef = useTemplateRef<InstanceType<typeof CanvasDisplay>>('canvasDisplayRef');
const canvasList = ref<Set<HTMLCanvasElement>>();

const scaleRatioValue = computed(() => canvasDisplayRef.value?.scaleRatio ?? 1);
const minScaleValue = computed(() => canvasDisplayRef.value?.minScale ?? 1);

function action(type: string) {
    switch (type) {
        case 'edit':
            props.store.load({
                holds: props.store.holds,
                image: props.store.image!,
                settings: props.store.settings,
            });

            router.push('/build');

            break;
        case 'exportFile': {
            const canvasEl = aggregateCanvas(canvasList.value!);
            const routeName = props.store.settings.routeName;
            const fileName = routeName ? `route - ${routeName}.png` : 'finalRoute.png';

            exportImage(canvasEl, fileName);
            break;
        }
        case 'settings':
            showSettings.value = true;
            break;
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onAction(action: ScreenAction, _point: Point, _fromPoint?: Point) {
    switch (action) {
        case 'setHold':
        case 'doubleHold':
        case 'linkHolds':
        case 'moveHold':
            /* do nothing */
            break;
        case 'scroll':
            log('error', 'Scroll: should be managed by another route');
            break;
        case 'zoom':
            log('error', 'Zoom: should be managed by another route');
            break;
        default:
            log('error', `TODO: Manage ${action}`);
    }
}

/* {{{ menu settings */

const showSettings = ref(props.store.actionNeeded.openSettings);
props.store.needAction('openSettings', false);

/* }}} */

</script>
<style scoped>
.menu {
    position: absolute;
    z-index: var(--zIndex-menu);

    bottom: 0;
    text-align: center;
    width: 100%;
}

.menu :deep(.menu-handle) {
    border-top-left-radius: var(--border-radius);
    border-top-right-radius: var(--border-radius);
}
</style>
