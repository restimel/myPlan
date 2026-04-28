import { computed, type Ref } from 'vue';
import { getDistance, getMiddle } from '@/utils/geometry';
import { log } from '@/utils/debug';

type LastPositions = Map<number, Point>;

type ZoomDirection = -1 | 0 | 1;

type ScreenEventOption = {
    rect: Ref<DOMRect>;
    scale: Ref<number>;
    onStart: (newPoints: Point[], event: Event) => void;
    onEnd: (lastPoint: Point, currentPoints: Point[], event: Event) => void;
    onMove: (to: Point, from: Point, distance: number, event: Event) => void;
    onZoom: (ratio: number, offsetDx: number, offsetDy: number, event: Event) => void;
};

function getClientPoint(event: MouseEvent | Touch): Point {
    /* Raw clientX/clientY — independent of rect changes. */
    return [event.clientX, event.clientY];
}

function toImagePoint(clientPoint: Point, rect: DOMRect, ratio: number): Point {
    /*
     * Convert raw client coords to image coords using the CURRENT rect.
     * Both lastPos and newPos must be converted with the same rect, so any
     * rect change between events (e.g. caused by scroll) cancels out in the delta.
     */
    return [
        (clientPoint[0] - rect.left) / ratio,
        (clientPoint[1] - rect.top) / ratio,
    ];
}

function rescaleAll(points: LastPositions, rect: DOMRect, ratio: number): Point[] {
    return Array.from(points.values(), (point) => toImagePoint(point, rect, ratio));
}

export function screenListener(options: ScreenEventOption) {
    const lastPosition: LastPositions = new Map();
    const minMove = computed(() => {
        const rect = options.rect.value;

        return Math.min(rect.width, rect.height) / 100;
    });
    let timer = 0;
    let isMoving = false;
    let zoomDirection: ZoomDirection = 0;

    function stopMove() {
        clearTimeout(timer);
        isMoving = false;
        zoomDirection = 0;
    }

    function startMove() {
        clearTimeout(timer);
        isMoving = true;
        timer = setTimeout(stopMove, 100);
    }

    function isUnderMinDistance(distance: number, touch: Touch, resizeArea = 1): boolean {
        const minDistance = Math.max(
            touch.radiusX,
            touch.radiusY
        );

        return distance <= minDistance * resizeArea;
    }

    function touchZoom(touches: TouchList, event: TouchEvent) {
        /* prevent mobile native zoom & scroll */
        event.preventDefault();
        event.stopPropagation();

        const [finger1, finger2] = touches;

        if (!finger1 || !finger2 || touches.length !== 2) {
            return;
        }

        const rect = options.rect.value;
        const lastP1 = lastPosition.get(finger1.identifier) ?? [0, 0];
        const lastP2 = lastPosition.get(finger2.identifier) ?? [0, 0];
        const newP1 = getClientPoint(finger1);
        const newP2 = getClientPoint(finger2);

        const oldDist = getDistance(lastP1, lastP2);
        const newDist = getDistance(newP1, newP2);
        const ratio = newDist / oldDist;
        const newDirection = newDist > oldDist ? 1 : -1;

        const dist1 = getDistance(lastP1, newP1);
        const dist2 = getDistance(lastP2, newP2);

        let resize = 1;

        if (newDirection !== zoomDirection) {
            resize = 2;
        } else if (isMoving) {
            resize = 0.1;
        }

        if (
            isUnderMinDistance(dist1, finger1, resize) &&
            isUnderMinDistance(dist2, finger2, resize)
        ) {
            log('zoom', 'drop--' +  [newDirection, zoomDirection, '--', dist1, dist2].join(','));
            /* Minimal variation not reached */
            return;
        }

        startMove();

        log('zoom', [newDirection, zoomDirection, '--', dist1, dist2].join(','));

        const oldScale = options.scale.value;
        const newRatio = oldScale * ratio;

        const center = getMiddle(newP1, newP2);
        const centerRelX = center[0] - rect.left;
        const centerRelY = center[1] - rect.top;
        const offsetDx = centerRelX * (newRatio - oldScale) / oldScale;
        const offsetDy = centerRelY * (newRatio - oldScale) / oldScale;

        /* save state for future event */
        lastPosition.set(finger1.identifier, newP1);
        lastPosition.set(finger2.identifier, newP2);
        zoomDirection = newDirection;

        options.onZoom(newRatio, offsetDx, offsetDy, event);
    }

    function touchStart(event: TouchEvent) {
        const list = event.touches; // should it be changedTouches ?
        const rectValue = options.rect.value;
        const ratio = options.scale.value;

        stopMove();

        for ( const touch of list) {
            lastPosition.set(touch.identifier, getClientPoint(touch));
        }

        options.onStart(rescaleAll(lastPosition, rectValue, ratio), event);

        if (list.length > 1) {
            event.preventDefault();
        }
    }

    function touchEnd(event: TouchEvent) {
        const list = event.changedTouches;
        const rectValue = options.rect.value;
        const ratio = options.scale.value;
        let clientPoint: Point = [0, 0];

        for (const touch of list) {
            clientPoint = getClientPoint(touch);

            lastPosition.delete(touch.identifier);
        }

        options.onEnd(
            toImagePoint(clientPoint, rectValue, ratio),
            rescaleAll(lastPosition, rectValue, ratio),
            event
        );
        stopMove();

        /* To avoid triggering mouse click */
        event.preventDefault();
    }

    function touchMove(event: TouchEvent) {
        const list = event.touches;

        if (list.length > 1) {
            return touchZoom(list, event);
        }

        const touch = list[0]!;
        const identifier = touch.identifier;
        const newPos = getClientPoint(touch);
        const lastPos = lastPosition.get(identifier);

        if (!lastPos) {
            lastPosition.set(identifier, newPos);
            return;
        }

        const distance = getDistance(lastPos, newPos);

        if (isUnderMinDistance(distance, touch)) {
            /* avoid default behavior for small movements */
            event.preventDefault();
            return;
        }

        startMove();
        lastPosition.set(identifier, newPos);

        const rect = options.rect.value;
        const ratio = options.scale.value;

        options.onMove(
            toImagePoint(newPos, rect, ratio),
            toImagePoint(lastPos, rect, ratio),
            distance / ratio,
            event
        );
    }

    function mouseDown(event: MouseEvent) {
        /* TODO: maybe if lastPosition.size then drop event */
        lastPosition.set(-1, getClientPoint(event));
        stopMove();

        options.onStart(
            rescaleAll(lastPosition, options.rect.value, options.scale.value),
            event
        );
    }

    function mouseUp(event: MouseEvent) {
        lastPosition.delete(-1);
        stopMove();

        const rect = options.rect.value;
        const ratio = options.scale.value;

        options.onEnd(
            toImagePoint(getClientPoint(event), rect, ratio),
            rescaleAll(lastPosition, rect, ratio),
            event
        );
    }

    function wheelZoom(event: WheelEvent) {
        event.preventDefault();

        const rect = options.rect.value;
        const clientPoint = getClientPoint(event);
        const posX = clientPoint[0] - rect.left;
        const posY = clientPoint[1] - rect.top;
        const oldScale = options.scale.value;
        const zoomFactor = event.deltaY > 0 ? 1 / 1.1 : 1.1;
        const newRatio = oldScale * zoomFactor;
        const offsetDx = posX * (newRatio - oldScale) / oldScale;
        const offsetDy = posY * (newRatio - oldScale) / oldScale;

        options.onZoom(newRatio, offsetDx, offsetDy, event);
    }

    function mouseMove(event: MouseEvent) {
        const lastPos = lastPosition.get(-1);

        if (!lastPos) {
            /* do not manage events when mouse is not active */
            return;
        }

        const newPos = getClientPoint(event);
        const distance = getDistance(lastPos, newPos);
        /* XXX: 1e-6 is used to avoid triggering on movement 0 */
        const minDistance = isMoving ? 1e-6 : minMove.value;

        if (distance < minDistance) {
            return;
        }

        startMove();
        lastPosition.set(-1, newPos);

        const rect = options.rect.value;
        const ratio = options.scale.value;

        options.onMove(
            toImagePoint(newPos, rect, ratio),
            toImagePoint(lastPos, rect, ratio),
            distance / ratio,
            event
        );
    }

    function screenEvent(event: TouchEvent | MouseEvent | WheelEvent) {
        switch(event.type) {
            case 'touchstart':
                return touchStart(event as TouchEvent);
            case 'touchmove':
                return touchMove(event as TouchEvent);
            case 'touchend':
                return touchEnd(event as TouchEvent);
            case 'mousedown':
                return mouseDown(event as MouseEvent);
            case 'mousemove':
                return mouseMove(event as MouseEvent);
            case 'mouseup':
                return mouseUp(event as MouseEvent);
            case 'wheel':
                return wheelZoom(event as WheelEvent);
        }
    }

    return screenEvent;
}
