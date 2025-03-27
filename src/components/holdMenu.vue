<template>
<aside
    :style="style"
>
    <div v-if="canMove" class="head">
        <IconLink />
        <span>
            link
            <span class="icon">✥</span>
        </span>
    </div>
    <div class="item">
        <button @click.stop="moveUp" :disabled="!canMoveUp">
           <IconUp /> Move up
        </button>
    </div>
    <div class="item">
        <button @click.stop="moveDown" :disabled="!canMoveDown">
            <IconDown /> Move down
        </button>
    </div>
    <div v-if="isLink" class="item">
        <button @click.stop="unlink">
            <IconUnlink /> Unlink
        </button>
    </div>
    <div v-if="isDouble" class="item">
        <button @click.stop="double">
            <IconMerge /> Remove double
        </button>
    </div>
    <div v-if="!isDouble" class="item">
        <button @click.stop="double">
           <IconSplit /> Double hold
        </button>
    </div>
    <div class="item">
        <label>
            <span class="label">
                <IconSize />
                Size: {{ Math.round(hold.size) }}
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
            <IconDelete /> Remove
        </button>
    </div>
</aside>
</template>
<script lang="ts" setup>
import { computed } from 'vue';
import {
    changeHoldSize,
    changeValue,
    doubleHold,
    removeHold,
    top,
    unlinkHolds,
} from '@/utils/holds';
import IconDelete from '@/components/icons/IconDelete.vue';
import IconDown from '@/components/icons/IconDown.vue';
import IconLink from '@/components/icons/IconLink.vue';
import IconMerge from '@/components/icons/IconMerge.vue';
import IconSize from '@/components/icons/IconSize.vue';
import IconSplit from '@/components/icons/IconSplit.vue';
import IconUnlink from '@/components/icons/IconUnlink.vue';
import IconUp from '@/components/icons/IconUp.vue';

type Props = {
    hold: Hold;
    canMove: boolean;
    scale: number;
    containerSize: DOMRect;
};

const props = defineProps<Props>();
const emit = defineEmits<{
    close: [];
}>();

const style = computed(() => {
    const nbItems = 7;
    const hold = props.hold;
    const position = hold.position[0];
    const ratio = props.scale;
    /* 5 = margin */
    const holdSize = hold.size * ratio + 5;
    /*
     * 42 = 18 + 2 * (padding = 10) + 2 * (border = 2)
     */
    const height = nbItems * 42;
    const width = 200;
    const maxWidth = props.containerSize.width;
    const maxHeight = props.containerSize.height;

    let x = position[0] * ratio;
    let y = position[1] * ratio;

    if (x + holdSize + width < maxWidth) {
        x = x + holdSize;
    } else if (x - holdSize - width > 0) {
        x = x - holdSize - width;
    }

    if (x === position[0] * ratio) {
        if (y + holdSize + height < maxHeight) {
            y = y + holdSize;
        } else {
            y = y - holdSize - height;
        }

        x = Math.max(5, x - 100);
    } else {
        y = Math.max(5, y - height / 2);
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
