import { getHoldInArea } from '@/utils/holds';
import { log } from '@/utils/debug';
import { crossRect } from '@/utils/geometry';

const bgHoldColor = '#ffffff33';
const borderHoldColor = '#000000ff';
const bgHoldHoverColor = '#fefe0022';
const borderHoldHoverColor = '#786238ff';

type Options = {
    refresh?: boolean;
    /** [from, to] */
    line?: [Point, Point];
    selectedHold?: Hold | null;
};

export function drawHolds(holds: Hold[], canvasEl: HTMLCanvasElement, options: Options = {}) {
    const context = canvasEl.getContext('2d')!;

    if (!context) {
        return;
    }

    if (options. refresh) {
        context.clearRect(0, 0, canvasEl.width, canvasEl.height);
    }

    const lineWidth = Math.max(1, canvasEl.height / 1000);

    context.fillStyle = bgHoldColor;
    context.strokeStyle = borderHoldColor;
    context.lineWidth = lineWidth;
    context.textBaseline = 'middle';
    context.textAlign = 'center';

    /* draw future link */
    if (options.line) {
        const from = options.line[0];
        const to = options.line[1];

        context.save();
        context.strokeStyle = bgHoldColor;
        context.beginPath();
        context.moveTo(...from);
        context.lineTo(...to);
        context.stroke();
        context.restore();
    }

    holds.forEach((hold) => {
        const isSelected = hold.index === options.selectedHold?.index;
        const positions = hold.position;
        const radius = isSelected ? hold.size * 1.05 : hold.size;
        const maxTextWidth = 2 * (radius - 2 * lineWidth);
        context.save();
        context.font = `${radius}px serif`;

        /* draw line between holds */
        if (positions.length > 1) {
            context.save();
            context.strokeStyle = isSelected ? bgHoldHoverColor : bgHoldColor;
            context.lineWidth = lineWidth * 5;
            context.beginPath();
            positions.forEach(([x, y], idx) => {
                if (idx) {
                    context.lineTo(x, y);
                } else {
                    context.moveTo(x, y);
                }
            });
            context.stroke();
            context.restore();
        }

        if (isSelected) {
            context.fillStyle = bgHoldHoverColor;
            context.strokeStyle = borderHoldHoverColor;
        }

        /* draw holds */
        positions.forEach(([x, y]) => {
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
            context.stroke();

            /* {{{ Draw hold value */

            context.save();
            context.fillStyle = context.strokeStyle;

            const text = Array.isArray(hold.value) ?
                hold.value.map((value) => value.toString(10)).join(', ') :
                hold.value.toString(10);

            context.fillText(text, x, y, maxTextWidth);
            context.restore();

            /* }}} */
        });

        context.restore();
    });
}

type Preferences = {
    position?: 'top' | 'bottom';
    area?: Box;
};

function getBoxPosition(boxWidth: number, boxHeight: number, holds: Hold[], canvasEl: HTMLCanvasElement, preferences: Preferences = {}): [number, number, boolean] {
    const margin = 5;
    const maxWidth = canvasEl.width;
    const maxHeight = canvasEl.height;
    const w = boxWidth;
    const h = boxHeight;
    let x = margin;
    let y = margin;
    let isOk = true;

    const checkBottom = preferences.position === 'bottom';

    function haveSpace(x: number, y: number): boolean {
        const holdInArea = getHoldInArea([x, y], [x + w, y + h], holds);

        const hasOtherBox = preferences.area ? crossRect(
            [
                [x, y],
                [x + boxWidth, y + boxHeight],
            ],
            [
                [preferences.area[0], preferences.area[1]], [preferences.area[0] + preferences.area[2], preferences.area[1] + preferences.area[3]],
            ]
        ) : false;

        return !holdInArea.length && !hasOtherBox;
    }

    if (checkBottom && haveSpace(maxWidth / 2 - w / 2, maxHeight - margin - h)) {
        /* Bottom center */
        x = maxWidth / 2 - w / 2;
        y = maxHeight - margin - h;
    } else if (checkBottom && haveSpace(margin, maxHeight - margin - h)) {
        /* Bottom left */
        x = margin;
        y = maxHeight - margin - h;
    } else if (checkBottom && haveSpace(maxWidth - margin - w, maxHeight - margin - h)) {
        /* Bottom right */
        x = maxWidth - margin - w;
        y = maxHeight - margin - h;
    } else if (haveSpace(margin, margin)) {
        /* Top left */
        x = margin;
        y = margin;
    } else if (haveSpace(maxWidth - margin - w, margin)) {
        /* Top right */
        x = maxWidth - margin - w;
        y = margin;
    } else if (haveSpace(maxWidth / 2 - w / 2, margin)) {
        /* Top middle */
        x = maxWidth / 2 - w / 2;
        y = margin;
    } else if (haveSpace(margin, maxHeight /2 - h / 2)) {
        /* middle left */
        x = margin;
        y = maxHeight /2 - h / 2;
    } else if (haveSpace(maxWidth - margin - w, maxHeight /2 - h / 2)) {
        /* middle right */
        x = maxWidth - margin - w;
        y = maxHeight /2 - h / 2;
    } else {
        log('information', 'box position is default :/');
        isOk = false;

        if (checkBottom) {
            x = maxWidth / 2 - w / 2;
            y = maxHeight - margin - h;
        } else {
            x = margin;
            y = margin;
        }
    }

    return [x, y, isOk];
}

function drawBoxText(text: string, isOk: boolean, box: Box, size: number, context: CanvasRenderingContext2D) {
    const [x, y, w, h] = box;

    context.save();

    context.fillStyle = bgHoldColor;
    context.strokeStyle = borderHoldColor;
    context.font = `${size - 2}px serif`;

    if (!isOk) {
        context.globalAlpha = 0.5;
    }

    context.rect(x, y, w, h);

    context.fill();
    context.stroke();

    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillStyle = borderHoldColor;

    context.fillText(text, x + w / 2, y + h / 2, w);
    context.restore();
}

export function drawInformation(holds: Hold[], settings: RouteSettings, canvasEl: HTMLCanvasElement | null, defaultHoldSize: number) {
    const context = canvasEl?.getContext('2d');

    if (!context || !canvasEl) {
        return;
    }

    const lastValue = holds[holds.length - 1].value;
    const top = (Array.isArray(lastValue) ? lastValue[lastValue.length - 1] : lastValue) + 1;

    const size = defaultHoldSize * 1.5;
    const topText = `TOP = ${top}`; /* TODO i18n */
    const topWidth = topText.length * 0.6 * size;
    const topHeight = size;

    const [xTop, yTop, isOkTop] = getBoxPosition(topWidth, topHeight, holds, canvasEl);

    drawBoxText(topText, isOkTop, [xTop, yTop, topWidth, topHeight], size, context);

    const nameText = settings.routeName;
    const nameWidth = nameText.length * 0.6 * size;
    const nameHeight = size;

    const [xName, yName, isOkName] = getBoxPosition(nameWidth, nameHeight, holds, canvasEl, {
        position: 'bottom',
        area: [xTop, yTop, topWidth, topHeight],
    });

    drawBoxText(nameText, isOkName, [xName, yName, nameWidth, nameHeight], size, context);
}
