import { ref } from 'vue';
import { getDistance } from './geometry';

export const holdList = ref<Hold[]>([]);
export const top = ref<number>(1);
export const defaultHoldSize = ref<number>(25);

function resetValues() {
    let value = 1;

    holdList.value.forEach((hold, index) => {
        if (Array.isArray(hold.value)) {
            hold.value = [value++, value++];
        } else {
            hold.value = value++;
        }

        hold.index = index;
    });

    top.value = value;
}

export function resetHolds() {
    holdList.value = [];
    top.value = 1;
}

export function addHold(x: number, y: number, size: number) {
    holdList.value.push({
        position: [[x, y]],
        value: top.value,
        size: size,
        index: holdList.value.length,
    });

    top.value = top.value + 1;
}

export function removeHold(idx: number = -1) {
    holdList.value.splice(idx, 1);
    resetValues();
}

export function doubleHold(idx: number, double?: boolean) {
    const hold = holdList.value[idx];

    if (!hold) {
        return false;
    }

    double ??= !Array.isArray(hold.value);

    /* XXX: values will be updated later */
    if (double) {
        hold.value = [0, 0];
    } else {
        hold.value = 0;
    }

    resetValues();

    return true;
}

export function linkHolds(idx1: number, idx2: number) {
    const hold1 = holdList.value[idx1];
    const hold2 = holdList.value[idx2];

    if (!hold1 || !hold2 || hold1.index === hold2.index) {
        return false;
    }

    hold2.position.push(...hold1.position);
    holdList.value.splice(idx1, 1);

    resetValues();

    return true;
}

export function unlinkHolds(idx: number) {
    const hold = holdList.value[idx];

    if (!hold) {
        return false;
    }

    const newPosition: Point = hold.position.pop()!;
    const newHold: Hold = {
        position: [newPosition],
        value: 0,
        index: 0,
        size: hold.size,
    };

    holdList.value.splice(idx + 1, 0, newHold);

    resetValues();

    return true;
}

export function changeValue(idx: number, up: boolean) {
    const hold = holdList.value[idx];
    const newIdx = up ? idx + 1 : idx - 1;

    if (!hold || newIdx < 0 || newIdx >= holdList.value.length) {
        return false;
    }

    holdList.value.splice(idx, 1);
    holdList.value.splice(newIdx, 0, hold);

    resetValues();

    return true;
}

export function moveHold(idx: number, from: Point, to: Point) {
    const hold = holdList.value[idx];

    if (!hold) {
        return false;
    }

    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const position = hold.position;

    hold.position = position.map(([x, y]) => [x + dx, y + dy]);

    return true;
}

export function changeHoldSize(idx: number, size: number) {
    const hold = holdList.value[idx];

    if (!hold) {
        return false;
    }

    hold.size = size;
    defaultHoldSize.value = size;

    return true;
}

export function getHold(point: Point): Hold | null {
    const distance = Infinity;
    let selectedHold: Hold | null = null;

    holdList.value.forEach((hold) => {
        hold.position.forEach((position) => {
            const dist = getDistance(point, position);

            if (dist < hold.size && dist < distance) {
                selectedHold = hold;
            }
        });
    });

    return selectedHold;
}
