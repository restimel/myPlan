import {
    getDistance,
    isInRect,
} from '@/utils/geometry';
import type { StoredRoute } from '@/utils/storage';

/*
 * const holds = ref<Hold[]>([]);
 * export const top = ref<number>(1);
 * export const defaultHoldSize = ref<number>(25);
 * const image = ref<ImageData | null>(null);
 */

// export const routeName = ref('');

export type HoldManager = {
    /* data */
    holds: Hold[];
    top: number;
    defaultHoldSize: number;
    image: ImageData | null;
    routeName: string; // TODO: to use the one in store

    /* methods */
    resetValues: () => void;
    resetHolds: () => void;
    setDefaultSize: (size: number) => void;
    addHold: (x: number, y: number, size: number) => Hold;
    removeHold: (idx?: number) => void;
    doubleHold: (idx: number, double?: boolean) => boolean;
    linkHolds: (idx1: number, idx2: number) => boolean;
    unlinkHolds: (idx: number) => boolean;
    changeValue: (idx: number, up: boolean) => boolean;
    moveHold: (idx: number, from: Point, to: Point) => boolean;
    changeHoldSize: (idx: number, size: number) => boolean;
    getHold: (point: Point) => Hold | null;
    getHoldInArea: (point1: Point, point2: Point) => Hold[];
    load: (newRoute: StoredRoute) => void;
};

export const holdManager: HoldManager = {
    holds: [],
    top: 1,
    defaultHoldSize: 12,
    image: null,
    routeName: '',

    /* {{{ methods */

    resetValues() {
        let value = 1;

        this.holds.forEach((hold, index) => {
            if (Array.isArray(hold.value)) {
                hold.value = [value++, value++];
            } else {
                hold.value = value++;
            }

            hold.index = index;
        });

        this.top = value;
    },

    resetHolds() {
        this.holds = [];
        this.top = 1;
    },

    setDefaultSize(size: number) {
        this.defaultHoldSize = size;
    },

    addHold(x: number, y: number, size: number): Hold {
        const hold: Hold = {
            position: [[x, y]],
            value: this.top,
            size: size,
            index: this.holds.length,
        };

        this.holds.push(hold);

        this.top = this.top + 1;

        return hold;
    },

    removeHold(idx: number = -1) {
        this.holds.splice(idx, 1);
        this.resetValues();
    },

    doubleHold(idx: number, double?: boolean): boolean {
        const hold = this.holds[idx];

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

        this.resetValues();

        return true;
    },

    linkHolds(idx1: number, idx2: number): boolean {
        const holds = this.holds;
        const hold1 = holds[idx1];
        const hold2 = holds[idx2];

        if (!hold1 || !hold2 || hold1.index === hold2.index) {
            return false;
        }

        hold2.position.push(...hold1.position);
        holds.splice(idx1, 1);

        this.resetValues();

        return true;
    },

    unlinkHolds(idx: number): boolean {
        const holds = this.holds;
        const hold = holds[idx];

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

        holds.splice(idx + 1, 0, newHold);

        this.resetValues();

        return true;
    },

    changeValue(idx: number, up: boolean): boolean {
        const holds = this.holds;
        const hold = holds[idx];
        const newIdx = up ? idx + 1 : idx - 1;

        if (!hold || newIdx < 0 || newIdx >= holds.length) {
            return false;
        }

        holds.splice(idx, 1);
        holds.splice(newIdx, 0, hold);

        this.resetValues();

        return true;
    },

    moveHold(idx: number, from: Point, to: Point): boolean {
        const holds = this.holds;
        const hold = holds[idx];

        if (!hold) {
            return false;
        }

        const dx = to[0] - from[0];
        const dy = to[1] - from[1];
        const position = hold.position;

        hold.position = position.map(([x, y]) => [x + dx, y + dy]);

        return true;
    },

    changeHoldSize(idx: number, size: number): boolean {
        const holds = this.holds;
        const hold = holds[idx];

        if (!hold) {
            return false;
        }

        hold.size = size;
        this.defaultHoldSize = size;

        return true;
    },

    getHold(point: Point): Hold | null {
        return getHold(point, this.holds);
    },

    getHoldInArea(point1: Point, point2: Point): Hold[] {
        return getHoldInArea(point1, point2, this.holds);
    },

    load(newRoute: StoredRoute) {
        this.holds = newRoute.holds;
        this.image = newRoute.image;
        this.routeName = newRoute.settings?.routeName ?? '';

        this.resetValues();
    },

    /* }}} */
};

export function getHold(point: Point, holds: Hold[]): Hold | null {
    const distance = Infinity;
    let selectedHold: Hold | null = null;

    holds.forEach((hold) => {
        hold.position.forEach((position) => {
            const dist = getDistance(point, position);

            if (dist < hold.size && dist < distance) {
                selectedHold = hold;
            }
        });
    });

    return selectedHold;
}

export function getHoldInArea(point1: Point, point2: Point, holds: Hold[]): Hold[] {
    const rect: [Point, Point] = [point1, point2];

    const inside = holds.filter((hold) => {
        return hold.position.some((position) => {
            return isInRect(position, rect, hold.size);
        });
    });

    return inside;
}
