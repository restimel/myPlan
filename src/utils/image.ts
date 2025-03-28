type Color = [number, number, number];

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

export function table1Dto2D(imageData: ImageData): Color[][]  {
    const image: Color[][] = new Array(imageData.width);
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;

    for (let x = 0; x < width; x++) {
        const col: Color[] = new Array(height);

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

export function table2Dto1D(image: Color[][]): ImageData {
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

export function reduceSize(image: Color[][], reduceRatio: number): Color[][] {
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

    const newImage: Color[][] = Array.from({ length: newWidth }, () =>
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

            const c00: Color = image[x1][y1];
            const c10: Color = image[x2][y1];
            const c01: Color = image[x1][y2];
            const c11: Color = image[x2][y2];

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
