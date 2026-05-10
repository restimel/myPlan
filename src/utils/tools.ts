export function getRandomId(): string {
    return crypto?.randomUUID?.() ?? String(Math.round(Math.random() * 2**50));
}

export function hasExactlyOne<T>(arr: T[]): arr is [T] {
    return arr.length === 1;
}

export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function formatDuration(ms: number): string {
    const totalSeconds = ms / 1_000;

    if (totalSeconds >= 3_600) {
        const hours = Math.floor(totalSeconds / 3_600);
        const remainingMinutes = Math.floor((totalSeconds % 3_600) / 60);

        if (remainingMinutes === 0) {
            return `${hours}h`;
        }

        return `${hours}h ${remainingMinutes}min`;
    }

    if (totalSeconds >= 60) {
        const minutes = Math.floor(totalSeconds / 60);
        const remainingSeconds = totalSeconds % 60;

        if (remainingSeconds === 0) {
            return `${minutes}min`;
        }

        return `${minutes}min ${remainingSeconds}s`;
    }

    return `${totalSeconds}s`;
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
