export function getDistance([x1, y1]: Point, [x2, y2]: Point): number {
    const dx = x2 - x1;
    const dy = y2 - y1;

    return Math.sqrt(dx * dx + dy * dy);
}

export function getMiddle([x1, y1]: Point, [x2, y2]: Point): Point {
    return [
        (x1 + x2) / 2,
        (y1 + y2) / 2,
    ] as Point;
}

export function isInRect([x, y]: Point, [[x1, y1], [x2, y2]]: [Point, Point], margin = 0): boolean {
    const xmin = Math.min(x1, x2) - margin;
    const xmax = Math.max(x1, x2) + margin;
    const ymin = Math.min(y1, y2) - margin;
    const ymax = Math.max(y1, y2) + margin;

    return (
        x >= xmin && x <= xmax &&
        y >= ymin && y <= ymax
    );
}

/** return angle [0, 2π] */
export function getAngle(fromPoint: Point, toPoint: Point): number {
    const [x1, y1] = fromPoint;
    const [x2, y2] = toPoint;
    const dx = x2 - x1;
    const dy = y2 - y1;

    const PI2 = 2 * Math.PI;

    const angle = Math.atan(dy / dx) + PI2;

    if (dx < 0) {
        return (Math.PI + angle) % PI2;
    }

    return angle % PI2;
}
