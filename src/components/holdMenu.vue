<template>
<aside
    :style="style"
>
    <div v-if="canMove" class="head">
        <span class="icon">✥</span>
        link
    </div>
    <div class="item">
        <button @click.stop="moveUp" :disabled="!canMoveUp">
            Move up
        </button>
    </div>
    <div class="item">
        <button @click.stop="moveDown" :disabled="!canMoveDown">
            Move down
        </button>
    </div>
    <div v-if="isLink" class="item">
        <button @click.stop="unlink">
            Unlink
        </button>
    </div>
    <div v-if="isDouble" class="item">
        <button @click.stop="double">
            Remove double
        </button>
    </div>
    <div v-if="!isDouble" class="item">
        <button @click.stop="double">
            Double hold
        </button>
    </div>
    <div class="item">
        <label>
            Size: {{ hold.size }}
        </label>
    </div>
    <div class="item">
        <button @click.stop="remove">
            Remove
        </button>
    </div>
</aside>
</template>
<script lang="ts" setup>
import { computed } from 'vue';
import {
    changeValue,
    doubleHold,
    removeHold,
    top,
    unlinkHolds,
} from '@/utils/holds';

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
</script>
<style scoped>
    aside {
        position: absolute;
        left: var(--x);
        top: var(--y);
        background: var(--color-background);
        border: var(--field-border);
    }

    .head {
        text-align: center;
    }

    .item {
        width: 200px;
    }

    .item button {
        width: 100%;
    }

    .item label {
        display: block;
        height: 42px;
    }
</style>
