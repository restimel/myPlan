
export function aggregateCanvas(list: Set<HTMLCanvasElement>): HTMLCanvasElement {
    const elements = Array.from(list);

    if (elements.length === 1) {
        return elements[0];
    }

    const aggregateEl = document.createElement('canvas');
    const aggregateContext = aggregateEl.getContext('2d')!;

    elements.forEach((canvas) => {
        const contextCanvas = canvas.getContext('2d');

        if (!contextCanvas) {
            return;
        }

        const { width, height } = canvas;
        const imgData = contextCanvas.getImageData(
            0,
            0,
            width,
            height
        );

        aggregateContext.putImageData(imgData, 0, 0);
    });

    return aggregateEl;
}

export function convertToImageData(data: number[], width: number, height: number): ImageData {
    const buffer = new ArrayBuffer(data.length);
    const clampedArray = new Uint8ClampedArray(buffer);

    clampedArray.set(data);

    const imgData = new ImageData(
        clampedArray,
        width,
        height
    );

    return imgData;
}

export function table1Dto2D(imageData: ImageData): ColorRGB[][]  {
    const image: ColorRGB[][] = new Array(imageData.width);
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;

    for (let x = 0; x < width; x++) {
        const col: ColorRGB[] = new Array(height);

        for (let y = 0; y < height; y++) {
            const index = (y * width + x) * 4;
            col[y] = [
                data[index] ?? 0,
                data[index + 1] ?? 0,
                data[index + 2] ?? 0,
            ];
        }

        image[x] = col;
    }

    return image;
}

export function table2Dto1D(image: ColorRGB[][]): ImageData {
    const width = image.length;
    const height = image[0]?.length ?? 0;
    const length = width * height * 4;
    const data: number[] = new Array(length);

    for (let x = 0; x < width; x++) {
        const col = image[x];

        for (let y = 0; y < height; y++) {
            const index = (y * width + x) * 4;

            data[index] = col[y][0];
            data[index + 1] = col[y][1];
            data[index + 2] = col[y][2];
            data[index + 3] = 255;
        }
    }

    return convertToImageData(
        data,
        width,
        height
    );
}

/* Bilinear reduction */
export function reduceSize(image: ColorRGB[][], reduceRatio: number): ColorRGB[][] {
    if (reduceRatio < 1) {
        throw new Error('reduceRatio must be greater than 1');
    }

    if (reduceRatio === 1) {
        return image;
    }

    const width: number = image.length;
    const height: number = image[0]?.length || 0;

    if (width === 0 || height === 0) {
        return [];
    }

    const newWidth: number = Math.max(1, Math.floor(width / reduceRatio));
    const newHeight: number = Math.max(1, Math.floor(height / reduceRatio));

    const newImage: ColorRGB[][] = Array.from({ length: newWidth }, () =>
        Array.from({ length: newHeight }, () => [0, 0, 0])
    );

    const interpolate = (c0: number, c1: number, factor: number): number => {
        return c0 * (1 - factor) + c1 * factor;
    };

    for (let x = 0; x < newWidth; x++) {
        const srcX: number = x * reduceRatio;
        const x1: number = Math.floor(srcX);
        const x2: number = Math.min(x1 + 1, width - 1);

        const dx: number = srcX - x1;

        for (let y = 0; y < newHeight; y++) {
            const srcY: number = y * reduceRatio;

            const y1: number = Math.floor(srcY);
            const y2: number = Math.min(y1 + 1, height - 1);

            const dy: number = srcY - y1;

            const c00: ColorRGB = image[x1][y1];
            const c10: ColorRGB = image[x2][y1];
            const c01: ColorRGB = image[x1][y2];
            const c11: ColorRGB = image[x2][y2];

            const r: number = interpolate(
                interpolate(c00[0], c10[0], dx),
                interpolate(c01[0], c11[0], dx),
                dy
            );

            const g: number = interpolate(
                interpolate(c00[1], c10[1], dx),
                interpolate(c01[1], c11[1], dx),
                dy
            );

            const b: number = interpolate(
                interpolate(c00[2], c10[2], dx),
                interpolate(c01[2], c11[2], dx),
                dy
            );

            newImage[x][y] = [Math.round(r), Math.round(g), Math.round(b)];
        }
    }

    return newImage;
}

function isAround(value1: number, value2: number, margin = 40, circleMax?: number): boolean {
    const boundMin = value2 - margin;
    const boundMax = value2 + margin;

    if (circleMax) {
        if (boundMin < 0 && value1 > boundMax) {
            return value1 > boundMin + circleMax;
        }

        if (boundMax > circleMax && value1 < boundMin) {
            return value1 < boundMax - circleMax;
        }
    }

    return (value1 > boundMin) && (value1 < boundMax);
}

function clampValue(value: number): number {
    return Math.max(
        0,
        Math.min(
            value,
            255
        )
    );
}

const RED = 0;
const GREEN = 1;
const BLUE = 2;

const HUE = 0;
/*
 * const SATURATE = 1;
 * const LIGHTNESS = 2;
 */

function rgbToHsl(color: ColorRGB): ColorHSL {
    const [r, g, b] = color;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    /* [0, 255] */
    const l = (max + min) / 2;
    /* [0, 255] */
    const s = delta / (255 - Math.abs(2 * l - 255));

    /* [0, 360] */
    let h = 0;

    if (max === r) {
        h = ((g - b) / delta) * 60;
    } else if (max === g) {
        h = ((b - r) / delta) * 60 + 120;
    } else {
        h = ((r - g) / delta) * 60 + 240;
    }

    h = (h + 360) % 360;

    return [h, s, l];
}

function meanColorValue(color?: ColorRGB): number {
    if (color) {
        return Math.round((color[RED] + color[GREEN] + color[BLUE]) / 3);
    }

    return 127;
}

function isSameHue(pixel: ColorRGB, hueReference: number): boolean {
    const [h] = rgbToHsl(pixel);

    return isAround(h, hueReference, 15, 360);
}

type HoldBox = {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    center: [number, number];
    size: number;
};

const MARGIN_SIZE = 5;
function isUnderHold([x, y]: [number, number], holds: HoldBox[]): boolean {
    return holds.some((box) => {
        if (x < box.xMin || x > box.xMax || y < box.yMin || y > box.yMax) {
            return false;
        }

        const radius = box.size ** 2;
        const [cx, cy] = box.center;
        const dist = (x - cx) ** 2 + (y - cy) ** 2;

        return dist < radius;
    });
}

function buildBoxes(holds: Hold[]): HoldBox[] {
    const boxes = holds.map(({position, size}) => {
        const radius = size + MARGIN_SIZE;

        return position.map(([cx, cy]) => {
            return {
                xMin: cx - radius,
                xMax: cx + radius,
                yMin: cy - radius,
                yMax: cy + radius,
                center: [cx, cy],
                size: radius,
            } as HoldBox;
        });
    });

    return boxes.flat();
}

function getXY(index: number, width: number): [number, number] {
    const baseIndex = Math.trunc(index / 4);
    const x = baseIndex % width;
    const y = (baseIndex - x) / width;

    return [x, y];
}

export function unsetGreyHold(currentImage: ImageData, originImage: ImageData, hold: Hold): ImageData {
    const data = Array.from(currentImage.data);

    unsetGreyHoldOnImage(data, originImage, hold);

    const buffer = new ArrayBuffer(data.length);
    const clampedArray = new Uint8ClampedArray(buffer);

    clampedArray.set(data);

    const image = new ImageData(
        clampedArray,
        currentImage.width,
        currentImage.height
    );

    return image;
}

function unsetGreyHoldOnImage(data: ImageDataArray | number[], originImage: ImageData, hold: Hold): ImageDataArray {
    const center = hold.position[0];
    const cx = Math.round(center[0]);
    const cy = Math.round(center[1]);
    const radius = Math.round(hold.size) + MARGIN_SIZE;
    const xMin = cx - radius;
    const xMax = cx + radius;
    const yMin = cy - radius;
    const yMax = cy + radius;
    const boxes: HoldBox[] = [{
        xMin,
        xMax,
        yMin,
        yMax,
        center,
        size: radius,
    }];
    const width = originImage.width;

    for (let x = xMin; x <= xMax; x++) {
        for (let y = yMin; y <= yMax; y++) {
            if (isUnderHold([x, y], boxes)) {
                const index = (x + y * width) * 4;

                data[index] = originImage.data[index];
                data[index + 1] = originImage.data[index + 1];
                data[index + 2] = originImage.data[index + 2];
            }
        }
    }

    return data as ImageDataArray;
}

export function filterToGrey(originImage: ImageData, holds: Hold[], color?: ColorRGB): ImageData {
    const data = Array.from(originImage.data);
    const refMeanValue = meanColorValue(color);
    /* Darken or lighten the greyValue at the opposite of the chosen value */
    const modification = !color ? 1 : (
        refMeanValue < 127 ? 1.4 : 0.6
    );
    const hueReference = rgbToHsl(color ?? [0, 0, 0])[HUE];

    let index = 0;
    const width = originImage.width;
    const length = originImage.height * width * 4;
    const boxes = buildBoxes(holds);

    while (index < length) {
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        const pixelColor: ColorRGB = [red, green, blue];

        if (!color || !isSameHue(pixelColor, hueReference) && !isUnderHold(getXY(index, width), boxes)) {
            const meanValue = meanColorValue(pixelColor);
            const newValue = clampValue(meanValue * modification);

            data[index] = newValue;
            data[index + 1] = newValue;
            data[index + 2] = newValue;
        }

        index += 4;
    }

    holds.forEach((hold) => {
        unsetGreyHoldOnImage(data, originImage, hold);
    });

    const buffer = new ArrayBuffer(data.length);
    const clampedArray = new Uint8ClampedArray(buffer);

    clampedArray.set(data);

    const image = new ImageData(
        clampedArray,
        originImage.width,
        originImage.height
    );

    return image;
}
