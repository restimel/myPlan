export function getRandomId(): string {
    return crypto?.randomUUID?.() ?? String(Math.round(Math.random() * 2**50));
}

export function hasExactlyOne<T>(arr: T[]): arr is [T] {
    return arr.length === 1;
}

export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function def<T>(value: T | undefined | null): T {
    if (value === undefined) {
        throw new Error('Unexpected undefined');
    }

    if (value === null) {
        throw new Error('Unexpected null');
    }

    return value;
}
