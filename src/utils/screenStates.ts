import { ref, type Ref } from 'vue';
import { getHold } from '@/utils/holds';
import { log } from './debug';

/**
 *               start=mousedown/touchstart
 *               move=mousemove/touchmove
 *               end=mouseup/touchend
 *     ┌──────┐
 *     │ None ◄───────────────────────────────────────────┐
 *     └──┬───┘     move (default behavior: scroll)       │
 *        │start ┌───────────────────────────────────────►│
 *  ┌─────┤      │  start   ┌──────┐        end           │
 *  │     │      ├─────────►│ zoom ├─────────────────────►┤
 *  │ ┌───▼────┐ │  end     └──────┘                      │
 *  │ │ active ├─┴────────────────────────► setHold ──────┤
 *  │ └────────┘    start   ┌──────┐        end           │
 *  └─────┐      ┌─────────►│ zoom ├─────────────────────►┤
 *        │      │          └──────┘                      │
 *  ┌─────▼──────┴┐ end ┌────────┐ 200 ms                 │
 *  │   target    ├─────► double ┼────────► setHold ──────┤
 *  └───┬──────┬──┘     └────┬───┘ start                  │
 *      │      │move         └────────────► doubleHold ───┤
 * 500ms│  ┌───▼──┐ end                                   │
 *      │  │ move ├───────────────────────► moveHold ─────┤
 *      │  └──────┘                                       │
 *   ┌──▼────────┐                                        │
 *   │ selection ├────────┐                               │
 *   └──┬─────┬──┘      display             actions       │
 *      │     │end       menu   ─────────────────────────►┤
 *      │  ┌──▼───┐       │                               │
 *  move│  │ menu ├───────┘                               │
 *      │  └──┬───┘                                       │
 *      │     │          start                            │
 *      │     └──────────────────────────────────────────►┤
 *   ┌──▼───┐       end                                   │
 *   │ link ├─────────────────────────────► linkHolds ────┘
 *   └──────┘
 *
 */

type MouseState = 'none' | 'active' | 'target' | 'selection' | 'menu' | 'move' | 'double' | 'link' | 'zoom';

export type ScreenAction = 'doubleHold' | 'linkHolds' | 'moveHold' | 'scroll' | 'setHold' | 'zoom';

type ActionCb = (action: ScreenAction, point: Point) => void;

/** in ms */
const holdMouseDuration = 500;
const doubleMouseDuration = 200;

export function setup(holds: Ref<Hold[]>, onActions: ActionCb) {
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
                const hold = getHold(point, holds.value);

                if (hold) {
                    actionState.value = 'target';
                    holdSelection.value = hold;

                    timerHold = setTimeout(() => {
                        actionState.value = 'selection';
                        log('interaction', `setTimeout: → ${actionState.value}`);
                    }, holdMouseDuration);
                } else {
                    actionState.value = 'active';
                }

                mousePosition.value = point;

                break;
            }
            case 'active':
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
                onActions('moveHold', point);
                resetAction();
                break;
            case 'selection':
                actionState.value = 'menu';
                break;
            case 'link': {
                const hold = getHold(point, holds.value);

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

    function moveInteraction(point: Point) {
        const action = actionState.value;

        switch (action) {
            case 'none': /* quick case */
                return;
            case 'active':
                resetAction();
                break;
            case 'target':
                clearTimeout(timerHold);
                actionState.value = 'move';
                onActions('moveHold', point);
                mousePosition.value = point;
                break;
            case 'move':
                onActions('moveHold', point);
                mousePosition.value = point;
                break;
            case 'link':
                mousePosition.value = point;
                break;
            case 'zoom':
                onActions('zoom', point);
                mousePosition.value = point;
                break;
            case 'selection':
                actionState.value = 'link';
                mousePosition.value = point;
                break;
            case 'menu':
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
