import { getHoldInArea } from '@/utils/holds';

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

export function drawInformation(holds: Hold[], canvasEl: HTMLCanvasElement | null, defaultHoldSize: number) {
    const context = canvasEl?.getContext('2d');

    if (!context || !canvasEl) {
        return;
    }

    const lastValue = holds[holds.length - 1].value;
    const top = (Array.isArray(lastValue) ? lastValue[lastValue.length - 1] : lastValue) + 1;

    const size = defaultHoldSize * 1.5;
    const margin = 5;
    const maxWidth = canvasEl.width;
    const maxHeight = canvasEl.height;
    let x = margin;
    let y = margin;
    const w = 5 * size;
    const h = size;

    context.save();

    console.log(getHoldInArea([margin, margin], [margin + w, margin + h], holds));
    console.log(getHoldInArea([margin, margin], [margin + w, margin + h], holds).length);
    console.log(!getHoldInArea([margin, margin], [margin + w, margin + h], holds).length);

    if (!getHoldInArea([margin, margin], [margin + w, margin + h], holds).length) {
        /* Top left */
        x = margin;
        y = margin;
    } else if (!getHoldInArea([maxWidth - margin - w, margin], [maxWidth - margin, margin + h], holds).length) {
        /* Top right */
        x = maxWidth - margin - w;
        y = margin;
    } else if (!getHoldInArea([maxWidth / 2 - w / 2, margin], [maxWidth / 2 + w / 2, margin + h], holds).length) {
        /* Top middle */
        x = maxWidth / 2 - w / 2;
        y = margin;
    } else if (!getHoldInArea([margin, maxHeight /2 - h / 2], [margin + w, maxHeight /2 + h / 2], holds).length) {
        /* middle left */
        x = margin;
        y = maxHeight /2 - h / 2;
    } else if (!getHoldInArea([maxWidth - margin - w, maxHeight /2 - h / 2], [maxWidth - margin, maxHeight /2 + h / 2], holds).length) {
        /* middle right */
        x = maxWidth - margin - w;
        y = maxHeight /2 - h / 2;
    } else {
        console.log('by default :/');
        x = margin;
        y = margin;
        context.globalAlpha = 0.5;
    }

    context.fillStyle = bgHoldColor;
    context.strokeStyle = borderHoldColor;
    context.font = `${size}px serif`;

    context.rect(x, y, w, h);

    context.fill();
    context.stroke();

    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillStyle = borderHoldColor;
    /* TODO i18n */
    context.fillText(`TOP = ${top}`, x + w / 2, y + 2 + h / 2, w);
    context.restore();
}
