<template>
<aside
    :class="{ hidden: measuredHeight === 0 }"
    :style="style"
>
    <div v-if="canMove" class="head">
        <MyIcon icon="link" />
        <span>
            {{ t('action.link') }}
            <span class="text-icon">✥</span>
        </span>
    </div>
    <div class="item">
        <button @click.stop="moveUp" :disabled="!canMoveUp">
           <MyIcon icon="up" /> {{ t('action.moveUp') }}
        </button>
    </div>
    <div class="item">
        <button @click.stop="moveDown" :disabled="!canMoveDown">
            <MyIcon icon="down" /> {{ t('action.moveDown') }}
        </button>
    </div>
    <div v-if="isLink" class="item">
        <button @click.stop="unlink">
            <MyIcon icon="unlink" /> {{ t('action.unlink') }}
        </button>
    </div>
    <div v-if="isDouble" class="item">
        <button @click.stop="double">
            <MyIcon icon="merge" /> {{ t('action.removeDouble') }}
        </button>
    </div>
    <div v-if="!isDouble" class="item">
        <button @click.stop="double">
           <MyIcon icon="split" /> {{ t('action.double') }}
        </button>
    </div>
    <div class="item">
        <label>
            <MyIcon icon="size" />
            <span class="label">
                {{ t('label.size') }} {{ Math.round(hold.size) }}
            </span>
            <button
                class="small-btn"
                :disabled="hold.size < 3"
                @click.stop="changeSizeDown"
            >
                -
            </button>
            <button
                class="small-btn"
                @click.stop="changeSizeUp"
            >
                +
            </button>
        </label>
    </div>
    <div class="item">
        <button @click.stop="remove">
            <MyIcon icon="delete" /> {{ t('action.remove') }}
        </button>
    </div>
</aside>
</template>
<script lang="ts" setup>
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import MyIcon from '@/components/myIcon.vue';
import type { RouteStore } from '@/stores/RouteStore';
import { clamp, def } from '@/utils/tools';

type Props = {
    hold: Hold;
    canMove: boolean;
    scale: number;
    containerSize: DOMRect;
    offsetX: number;
    offsetY: number;
    store: RouteStore;
};

const props = defineProps<Props>();
const emit = defineEmits<{
    close: [];
}>();

const { t } = useI18n();

const instance = getCurrentInstance();
const measuredHeight = ref(0);

function measureHeight() {
    const el = instance?.proxy?.$el as HTMLElement | undefined;
    if (el) {
        measuredHeight.value = el.offsetHeight;
    }
}

onMounted(measureHeight);

const style = computed(() => {
    const hold = props.hold;
    const ratio = props.scale;
    const margin = 5;
    const holdRadius = hold.size * ratio + margin;
    const menuHeight = measuredHeight.value;
    const menuWidth = 200;
    const minX = 0;
    const maxX = props.containerSize.width;
    const minY = 0;
    const maxY = props.containerSize.height;

    /*
     * Compute the bounding box of the entire group (anchor + linked holds).
     * Candidates placed outside this box cannot overlap any hold by construction.
     */
    /* Convert hold positions from image space to screen space:
     * multiply by scale (canvas transform) then subtract scroll offset
     * (canvas-overlay is not scrolled, so menu coordinates must be viewport-relative) */
    const positions = hold.position.map((pos) => ({
        x: def(pos[0]) * ratio - props.offsetX,
        y: def(pos[1]) * ratio - props.offsetY,
    }));

    let pMinX = Infinity, pMaxX = -Infinity, pMinY = Infinity, pMaxY = -Infinity, sumX = 0, sumY = 0;
    for (const p of positions) {
        if (p.x < pMinX) {
            pMinX = p.x;
        }
        if (p.x > pMaxX) {
            pMaxX = p.x;
        }
        if (p.y < pMinY) {
            pMinY = p.y;
        }
        if (p.y > pMaxY) {
            pMaxY = p.y;
        }

        sumX += p.x;
        sumY += p.y;
    }

    const groupMinX = pMinX - holdRadius;
    const groupMaxX = pMaxX + holdRadius;
    const groupMinY = pMinY - holdRadius;
    const groupMaxY = pMaxY + holdRadius;
    const centerX = sumX / positions.length;
    const centerY = sumY / positions.length;

    /*
     * For each direction, primary axis is fixed at the group boundary (no overlap),
     * perpendicular axis is clamped to stay on screen.
     * A candidate is valid only if its primary axis fits on screen without clamping.
     * Priority order: right → left → below → above
     */
    const clampedY = clamp(centerY - menuHeight / 2, minY + margin, maxY - menuHeight - margin);
    const clampedX = clamp(centerX - menuWidth / 2, minX + margin, maxX - menuWidth - margin);

    const candidates = [
        { x: groupMaxX, y: clampedY, valid: groupMaxX + menuWidth <= maxX },
        { x: groupMinX - menuWidth, y: clampedY, valid: groupMinX - menuWidth >= minX },
        { x: clampedX, y: groupMaxY, valid: groupMaxY + menuHeight <= maxY },
        { x: clampedX, y: groupMinY - menuHeight, valid: groupMinY - menuHeight >= minY },
    ];

    const best = candidates.find((c) => c.valid) ?? candidates[0]!;

    return `
        --x: ${best.x}px;
        --y: ${best.y}px;
    `;
});

const isLink = computed(() => {
    return props.hold.position.length > 1;
});

const isDouble = computed(() => {
    return Array.isArray(props.hold.value);
});

watch(() => [props.canMove, isLink.value, isDouble.value], measureHeight, { flush: 'post' });

const canMoveDown = computed(() => {
    const holdValue = props.hold.value;
    const value = Array.isArray(holdValue) ? holdValue[1] : holdValue;

    return value > 1;
});

const canMoveUp = computed(() => {
    const holdValue = props.hold.value;
    const value = Array.isArray(holdValue) ? holdValue[1] : holdValue;

    return value < props.store.top - 1;
});

function remove() {
    props.store.removeHold(props.hold.index);
    emit('close');
}

function unlink() {
    props.store.unlinkHolds(props.hold.index);
    emit('close');
}

function double() {
    props.store.doubleHold(props.hold.index);
    emit('close');
}

function moveUp() {
    props.store.changeValue(props.hold.index, true);
}

function moveDown() {
    props.store.changeValue(props.hold.index, false);
}

function changeSizeUp() {
    props.store.changeHoldSize(props.hold.index, props.hold.size + 1);
}

function changeSizeDown() {
    const value = props.hold.size - 1;

    if (value < 2) {
        return;
    }

    props.store.changeHoldSize(props.hold.index, value);
}
</script>
<style scoped>
    aside.hidden {
        visibility: hidden;
    }

    aside {
        position: absolute;
        z-index: var(--zIndex-menu);
        left: var(--x);
        top: var(--y);
        background: var(--color-background);
        border: var(--field-border);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-md);
        pointer-events: auto;
        --menu-width: 200px;
        animation: menu-appear var(--transition-normal) ease;
    }

    @keyframes menu-appear {
        from {
            opacity: 0;
            transform: scale(0.9);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    .head {
        display: grid;
        grid-template-columns: 25px 1fr;
        text-align: center;
        padding: 0 var(--spacing-sm);
    }

    .item {
        width: var(--menu-width);
    }

    .item button {
        width: 100%;
        display: grid;
        grid-template-columns: 25px 1fr;
        transition: background-color var(--transition-fast);
    }

    .item button:not([disabled]):hover {
        background-color: var(--color-background-mute);
    }

    .item label {
        display: flex;
        flex-direction: row;
        align-items: center;
        height: 42px;
        padding: 0 var(--spacing-sm);
        gap: var(--spacing-xs);
    }

    label > .label {
        flex: 1;
        text-align: end;
    }
    label button.small-btn {
        display: inline-block;
        padding: initial;
        border-radius: var(--border-radius-round);
        width: 2em;
        height: 2em;
    }
</style>
