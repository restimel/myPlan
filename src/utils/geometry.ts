export function getDistance([x1, y1]: Point, [x2, y2]: Point): number {
    const dx = x2 - x1;
    const dy = y2 - y1;

    return Math.sqrt(dx * dx + dy * dy);
}
