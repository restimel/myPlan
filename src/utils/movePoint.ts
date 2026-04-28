import { getAngle, getDistance } from './geometry';

export type HysterisDebug = {
    distance: number;
    oldDistance: number;
    diffAngle: number;
    threshold: number;
    dropped: boolean;
    drops: number;
    passes: number;
};

export function hysterisPoint(point: Point) {
    let lastPoint = point;
    let lastDistance = 0;
    let lastAngle = 0;
    const debugState: HysterisDebug = {
        distance: 0,
        oldDistance: 0,
        diffAngle: 0,
        threshold: 0,
        dropped: false,
        drops: 0,
        passes: 0,
    };

    function movePoint(point: Point) {
        const [x1, y1] = lastPoint;
        const [x2, y2] = point;
        const newPoint: Point = point;

        const deltaX = x1 - x2;
        const deltaY = y1 - y2;
        const distance = getDistance(lastPoint, newPoint);
        const oldDistance = lastDistance;
        const angle = getAngle(lastPoint, newPoint);
        const diffAngle = Math.abs(angle - lastAngle);

        const maxThreshold = 3;
        const coeff = maxThreshold / Math.PI;
        const threshold = diffAngle > Math.PI ?
            maxThreshold - (Math.PI - diffAngle) * coeff :
            diffAngle * coeff;

        debugState.distance = distance;
        debugState.oldDistance = oldDistance;
        debugState.diffAngle = diffAngle;
        debugState.threshold = threshold;

        if (distance < oldDistance * threshold) {
            debugState.dropped = true;
            debugState.drops++;
            return [0, 0];
        }

        debugState.dropped = false;
        debugState.passes++;
        lastPoint = newPoint;
        lastDistance = distance;
        lastAngle = angle;

        return [deltaX, deltaY];
    };

    movePoint.reset = (point: Point) => {
        lastPoint = point;
        lastDistance = 0;
        lastAngle = 0;
        debugState.drops = 0;
        debugState.passes = 0;
    };

    movePoint.debug = debugState;

    return movePoint;
}
