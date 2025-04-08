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
    onMove: (to: Point, distance: number, event: Event) => void;
    onZoom: (ratio: number, offsetDx: number, offsetDy: number, event: Event) => void;
};

function getPosition(event: MouseEvent | Touch, rect: DOMRect): Point {
    /* DOM position relative to the canvas element */
    const cursorX = Math.round(event.clientX - rect.left);
    const cursorY = Math.round(event.clientY - rect.top);

    return [cursorX, cursorY];
}

function rescalePoint(point: Point, ratio: number): Point {
    return [
        point[0] / ratio,
        point[1] / ratio,
    ];
}

function rescale(points: LastPositions, ratio: number): Point[] {
    return Array.from(points.values(), (point) => rescalePoint(point, ratio));
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
        /* prevent mobile native zoom */
        try {
            event.preventDefault();
            event.stopPropagation();
        } catch(err) {
            log('error', (err as Error).message);
        }

        if (touches.length !== 2) {
            return;
        }

        const rect = options.rect.value;
        const lastP1 = lastPosition.get(touches[0].identifier) ?? [0, 0];
        const lastP2 = lastPosition.get(touches[1].identifier) ?? [0, 0];
        const newP1 = getPosition(touches[0], rect);
        const newP2 = getPosition(touches[1], rect);

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
            isUnderMinDistance(dist1, touches[0], resize) &&
            isUnderMinDistance(dist2, touches[1], resize)
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
        const offsetDx = center[0] * (newRatio - oldScale) / oldScale;
        const offsetDy = center[1] * (newRatio - oldScale) / oldScale;

        /* save state for future event */
        lastPosition.set(touches[0].identifier, newP1);
        lastPosition.set(touches[1].identifier, newP2);
        zoomDirection = newDirection;

        options.onZoom(newRatio, offsetDx, offsetDy, event);
    }

    function touchStart(event: TouchEvent) {
        const list = event.touches; // should it be changedTouches ?
        const rectValue = options.rect.value;
        const ratio = options.scale.value;

        stopMove();

        for ( const touch of list) {
            const position = getPosition(touch, rectValue);

            lastPosition.set(touch.identifier, position);
        }

        options.onStart(rescale(lastPosition, ratio), event);

        if (list.length > 1) {
            event.preventDefault();
        }
    }

    function touchEnd(event: TouchEvent) {
        const list = event.changedTouches;
        const rectValue = options.rect.value;
        const ratio = options.scale.value;
        let point: Point  = [0, 0];

        for (const touch of list) {
            point = getPosition(touch, rectValue);

            lastPosition.delete(touch.identifier);
        }

        options.onEnd(rescalePoint(point, ratio), rescale(lastPosition, ratio), event);
        stopMove();

        /* To avoid triggering mouse click */
        event.preventDefault();
    }

    function touchMove(event: TouchEvent) {
        const list = event.touches;

        if (list.length > 1) {
            return touchZoom(list, event);
        }

        const touch = list[0];
        const identifier = touch.identifier;
        const newPos = getPosition(touch, options.rect.value);
        const lastPos = lastPosition.get(identifier);

        if (!lastPos) {
            lastPosition.set(identifier, newPos);
            return;
        }

        const distance = getDistance(lastPos, newPos);

        if (isUnderMinDistance(distance, touch)) {
            return;
        }

        startMove();
        lastPosition.set(identifier, newPos);

        const ratio = options.scale.value;

        options.onMove(rescalePoint(newPos, ratio), distance / ratio, event);
    }

    function mouseDown(event: MouseEvent) {
        /* TODO: maybe if lastPosition.size then drop event */
        lastPosition.set(-1, getPosition(event, options.rect.value));
        stopMove();

        options.onStart(rescale(lastPosition, options.scale.value), event);
    }

    function mouseUp(event: MouseEvent) {
        lastPosition.delete(-1);
        stopMove();

        options.onEnd(
            rescalePoint(getPosition(event, options.rect.value), options.scale.value),
            rescale(lastPosition, options.scale.value),
            event
        );
    }

    function mouseMove(event: MouseEvent) {
        const lastPos = lastPosition.get(-1);

        if (!lastPos) {
            /* do not manage events when mouse is not active */
            return;
        }

        const newPos = getPosition(event, options.rect.value);
        const distance = getDistance(lastPos, newPos);
        /* XXX: 1e-6 is used to avoid triggering on movement 0 */
        const minDistance = isMoving ? 1e-6 : minMove.value;

        if (distance < minDistance) {
            return;
        }

        startMove();
        lastPosition.set(-1, newPos);

        const ratio = options.scale.value;

        options.onMove(rescalePoint(newPos, ratio), distance / ratio, event);
    }

    function screenEvent(event: TouchEvent | MouseEvent) {
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
        }
    }

    return screenEvent;
}
