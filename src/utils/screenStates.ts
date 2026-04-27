import { ref } from 'vue';
import { getHold } from '@/utils/holds';
import { log } from './debug';

/**
 *               start=mousedown/touchstart
 *               move=mousemove/touchmove
 *               end=mouseup/touchend
 *     ┌──────┐
 *     │ None ◄───────────────────────────────────────────┐
 *     └──┬───┘     move    ┌────────┐  end               │
 *        │      ┌──────────│ scroll ├───────────────────►┤
 *        │start │          └────────┘                    │
 *  ┌─────┤      │  start   ┌──────┐    end               │
 *  │     │      ├─────────►│ zoom ├─────────────────────►┤
 *  │ ┌───▼────┐ │  end     └──────┘                      │
 *  │ │ active ├─┼────────────────────────► setHold ──────┤
 *  │ └────────┘ │  500ms                                 │
 *  │            └────────────────────────► longPress ────┤
 *  │               start   ┌──────┐    end               │
 *  └─────┐      ┌─────────►│ zoom ├──────────────────────┤
 *        │      │          └──────┘                      │
 *  ┌─────▼──────┴┐ end ┌────────┐ 200 ms                 │
 *  │   target    ├─────► double ┼────────► setHold ──────┤
 *  └───┬──────┬──┘     └────┬───┘  start                 │
 *      │      │move         └────────────► doubleHold ───┤
 * 500ms│  ┌───▼──┐ end                                   │
 *      │  │ move ├───────────────────────► moveHold ─────┤
 *      │  └──────┘                                       │
 *   ┌──▼────────┐                                        │
 *   │ selection ├────────┐                               │
 *   └──┬─────┬──┘      display        actions            │
 *      │     │end       menu  ──────────────────────────►┤
 *      │  ┌──▼───┐       │                               │
 *  move│  │ menu ├───────┘                               │
 *      │  └──┬───┘                                       │
 *      │     │     start                                 │
 *      │     └──────────────────────────────────────────►┤
 *   ┌──▼───┐       end                                   │
 *   │ link ├─────────────────────────────► linkHolds ────┘
 *   └──────┘
 *
 */

export type MouseState = 'none' | 'active' | 'target' | 'selection' | 'menu' | 'move' | 'double' | 'link' | 'zoom' | 'scroll';

export type ScreenAction = 'doubleHold' | 'linkHolds' | 'longPress' | 'moveHold' | 'scroll' | 'setHold' | 'zoom';

export type ActionCb = (action: ScreenAction, point: Point, fromPoint?: Point) => void;

/** in ms */
const holdMouseDuration = 500;
const doubleMouseDuration = 200;

export function setup(holds: Hold[], onActions: ActionCb) {
    const actionState = ref<MouseState>('none');
    const holdSelection = ref<Hold | null>(null);
    const holdSelection2 = ref<Hold | null>(null);
    const mousePosition = ref<Point>([0, 0]);
    let timerHold = 0;

    function resetAction() {
        actionState.value = 'none';
        holdSelection.value = null;
        holdSelection2.value = null;
        clearTimeout(timerHold);
    }

    function startInteraction(point: Point) {
        const action = actionState.value;

        switch (action) {
            case 'none': {
                const hold = getHold(point, holds);

                if (hold) {
                    actionState.value = 'target';
                    holdSelection.value = hold;

                    timerHold = setTimeout(() => {
                        actionState.value = 'selection';
                        log('interaction', `setTimeout: → ${actionState.value}`);
                    }, holdMouseDuration);
                } else {
                    actionState.value = 'active';

                    timerHold = setTimeout(() => {
                        onActions('longPress', point);
                        resetAction();
                    }, holdMouseDuration);
                }

                mousePosition.value = point;

                break;
            }
            case 'active':
                clearTimeout(timerHold);
                actionState.value = 'zoom';
                break;
            case 'target':
                clearTimeout(timerHold);
                actionState.value = 'zoom';
                break;
            case 'double':
                clearTimeout(timerHold);
                onActions('doubleHold', point);
                resetAction();
                break;
            case 'scroll':
                actionState.value = 'zoom';
                break;
            case 'selection':
            case 'menu':
            default:
                resetAction();
                break;
        }

        log('interaction', `start: ${action} → ${actionState.value}`);
    }

    function stopInteraction(point: Point) {
        const action = actionState.value;

        switch (action) {
            case 'active':
                clearTimeout(timerHold);
                onActions('setHold', point);
                resetAction();
                break;
            case 'target':
                clearTimeout(timerHold);
                actionState.value = 'double';
                timerHold = setTimeout(() => {
                    onActions('setHold', point);
                    resetAction();
                }, doubleMouseDuration);
                break;
            case 'move':
                onActions('moveHold', point, mousePosition.value);
                resetAction();
                break;
            case 'scroll':
                onActions('scroll', point);
                resetAction();
                break;
            case 'selection':
                actionState.value = 'menu';
                break;
            case 'link': {
                const hold = getHold(point, holds);

                if (hold) {
                    holdSelection2.value = hold;
                    onActions('linkHolds', point);
                }

                resetAction();
                break;
            }
            case 'zoom':
            default:
                resetAction();
                break;
        }

        log('interaction', `end: ${action} → ${actionState.value}`);
    }

    function moveInteraction(point: Point, from: Point, event: Event) {
        const action = actionState.value;

        switch (action) {
            case 'none': /* quick case */
                return;
            case 'active':
                event.preventDefault();
                clearTimeout(timerHold);
                actionState.value = 'scroll';
                onActions('scroll', point, from);
                break;
            case 'target':
                event.preventDefault();
                clearTimeout(timerHold);
                actionState.value = 'move';
                onActions('moveHold', point, from);
                mousePosition.value = point;
                break;
            case 'move':
                event.preventDefault();
                onActions('moveHold', point, from);
                mousePosition.value = point;
                break;
            case 'scroll':
                event.preventDefault();
                onActions('scroll', point, from);
                mousePosition.value = point;
                break;
            case 'link':
                event.preventDefault();
                mousePosition.value = point;
                break;
            case 'zoom':
                event.preventDefault();
                onActions('zoom', point);
                mousePosition.value = point;
                break;
            case 'selection':
                event.preventDefault();
                actionState.value = 'link';
                mousePosition.value = point;
                break;
            case 'menu':
                event.preventDefault();
                break;
            default:
                resetAction();
        }

        log('interaction', `move: ${action} → ${actionState.value} (${point})`);
    }

    return {
        actionState,
        holdSelection,
        holdSelection2,
        mousePosition,

        startInteraction,
        stopInteraction,
        moveInteraction,
        resetAction,
    };
}
