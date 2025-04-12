import { getAngle, getDistance } from './geometry';

export function hysterisPoint(point: Point) {
    let lastPoint = point;
    let lastDistance = 0;
    let lastAngle = 0;

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

        if (distance < oldDistance * threshold) {
            return [0, 0];
        }

        lastPoint = newPoint;
        lastDistance = distance;
        lastAngle = angle;

        return [deltaX, deltaY];
    };

    movePoint.reset = (point: Point) => {
        lastPoint = point;
        lastDistance = 0;
        lastAngle = 0;
    };

    return movePoint;
}
