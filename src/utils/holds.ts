import { ref } from 'vue';

export type Hold = {
    x: number;
    y: number;
    value: number;
};

export const holdList = ref<Hold[]>([]);


export function addHold(x: number, y: number) {
    holdList.value.push({
        x,
        y,
        value: holdList.value.length + 1,
    });
}

export function removeHold(idx: number = -1) {
    holdList.value.splice(idx, 1);
}
