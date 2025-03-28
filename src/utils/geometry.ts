export function getDistance([x1, y1]: Point, [x2, y2]: Point): number {
    const dx = x2 - x1;
    const dy = y2 - y1;

    return Math.sqrt(dx * dx + dy * dy);
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
