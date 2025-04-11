<template>
<aside
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
            <span> </span>
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
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
    changeHoldSize,
    changeValue,
    doubleHold,
    removeHold,
    top,
    unlinkHolds,
} from '@/utils/holds';
import MyIcon from '@/components/myIcon.vue';

type Props = {
    hold: Hold;
    canMove: boolean;
    scale: number;
    containerSize: DOMRect;
    offsetX: number;
    offsetY: number;
};

const props = defineProps<Props>();
const emit = defineEmits<{
    close: [];
}>();

const { t } = useI18n();

const style = computed(() => {
    const nbItems = 7;
    const hold = props.hold;
    const position = hold.position[0];
    const ratio = props.scale;
    const margin = 5;
    const holdSize = hold.size * ratio + margin;
    /*
     * 42 = 18 (font-size) + 2 * (padding = 10) + 2 * (border = 2)
     */
    const height = nbItems * 42;
    const width = 200;
    const minWidth = props.offsetX;
    const maxWidth = minWidth + props.containerSize.width;
    const minHeight = props.offsetY;
    const maxHeight = minHeight + props.containerSize.height;

    const X = position[0] * ratio;
    const Y = position[1] * ratio;
    let x = X;
    let y = Y;

    if (x + holdSize + width < maxWidth) {
        x = x + holdSize;
    } else if (x - holdSize - width > minWidth) {
        x = x - holdSize - width;
    }

    if (x === X) {
        if (y + holdSize + height < maxHeight) {
            y = y + holdSize;
        } else {
            y = y - holdSize - height;
        }

        x = Math.max(margin, X - width / 2);
    } else {
        y = Math.max(margin, Y - height / 2);
    }

    /* Ensure the menu is inside the element */
    if (y < minHeight - margin) {
        y = minHeight - margin;
    }
    if (y + height > maxHeight - margin) {
        y = maxHeight - height - margin;
    }

    return `
        --x: ${x}px;
        --y: ${y}px;
    `;
});

const isLink = computed(() => {
    return props.hold.position.length > 1;
});

const isDouble = computed(() => {
    return Array.isArray(props.hold.value);
});

const canMoveDown = computed(() => {
    const holdValue = props.hold.value;
    const value = Array.isArray(holdValue) ? holdValue[1] : holdValue;

    return value > 1;
});

const canMoveUp = computed(() => {
    const holdValue = props.hold.value;
    const value = Array.isArray(holdValue) ? holdValue[1] : holdValue;

    return value < top.value - 1;
});

function remove() {
    removeHold(props.hold.index);
    emit('close');
}

function unlink() {
    unlinkHolds(props.hold.index);
    emit('close');
}

function double() {
    doubleHold(props.hold.index);
    emit('close');
}

function moveUp() {
    changeValue(props.hold.index, true);
}

function moveDown() {
    changeValue(props.hold.index, false);
}

function changeSizeUp() {
    changeHoldSize(props.hold.index, props.hold.size + 1);
}

function changeSizeDown() {
    const value = props.hold.size - 1;

    if (value < 2) {
        return;
    }

    changeHoldSize(props.hold.index, value);
}
</script>
<style scoped>
    aside {
        position: absolute;
        left: var(--x);
        top: var(--y);
        background: var(--color-background);
        border: var(--field-border);
        box-shadow: var(--shadow-md);
    }

    .head {
        display: grid;
        grid-template-columns: 25px 1fr;
        text-align: center;
        padding: 0 var(--spacing-sm);
    }

    .item {
        width: 200px;
    }

    .item button {
        width: 100%;
        display: grid;
        grid-template-columns: 25px 1fr;
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
    }
    label button.small-btn {
        display: inline-block;
        padding: initial;
        border-radius: var(--border-radius-round);
        width: 2em;
        height: 2em;
    }
</style>
