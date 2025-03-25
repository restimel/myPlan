<template>
<aside
    :style="style"
>
    <div v-if="canMove" class="head">
        <span class="icon">✥</span>
        link
    </div>
    <div v-if="canMoveUp" class="item">
        <button @click.stop="moveUp">
            Move up
        </button>
    </div>
    <div v-if="canMoveDown" class="item">
        <button @click.stop="moveDown">
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
};

const props = defineProps<Props>();
const emit = defineEmits<{
    close: [];
}>();

const style = computed(() => {
    const hold = props.hold;
    const position = hold.position[0];
    const ratio = props.scale;

    return `
        --x: ${(position[0] + hold.size) * ratio}px;
        --y: ${(position[1] - hold.size) * ratio}px;
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
</style>
