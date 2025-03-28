import {
    convertToImageData,
    reduceSize,
    table1Dto2D,
    table2Dto1D,
} from '@/utils/image';

type StoredImage = {
    image: string;
    width: number;
    height: number;
    holds: Hold[];
}

type StoredRoute = {
    image: ImageData;
    holds: Hold[];
}

const STORAGE_NAME = 'plan';
const CHAR_OFFSET = 35;
const STORAGE_LIMIT = 3_000_000;

function dataToString(data: Uint8ClampedArray<ArrayBufferLike>): string {
    const length = data.length;
    const text: string[] = [];

    for (let idx = 0; idx < length; idx = idx + 4) {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        text.push(
            String.fromCharCode(
                r + CHAR_OFFSET,
                g + CHAR_OFFSET,
                b + CHAR_OFFSET
            )
        );
    }

    return text.join('');
}

function stringToData(text: string): number[] {
    const data: number[] = [];
    const list = Array.from(text);
    const length = list.length;

    for (let idx = 0; idx < length; idx++) {
        const char = list[idx];

        data.push(char.charCodeAt(0) - CHAR_OFFSET);

        if ((idx + 1) % 3 === 0) {
            data.push(255);
        }
    }

    return data;
}

export function saveRoute(image: ImageData, holdList: Hold[], retry = 5): boolean {
    const storage: StoredImage = {
        image: dataToString(image.data),
        width: image.width,
        height: image.height,
        holds: holdList,
    };

    const json = JSON.stringify(storage);

    if (json.length > STORAGE_LIMIT) {
        const ratioReduceFactor = Math.ceil(json.length * 10 / STORAGE_LIMIT) / 10;

        if (retry <= 0) {
            console.log('save route failed', json.length, ratioReduceFactor);
            return false;
        }

        const image2D = table1Dto2D(image);
        const resized = reduceSize(image2D, ratioReduceFactor);
        const newImgData = table2Dto1D(resized);

        return saveRoute(newImgData, holdList, retry - 1);
    }

    console.log('size:', json.length);
    localStorage.setItem(STORAGE_NAME, json);

    return true;
}

export function loadRoute(): StoredRoute | null {
    const json = localStorage.getItem(STORAGE_NAME);

    if (!json) {
        return null;
    }

    try {
        const data: StoredImage = JSON.parse(json);
        const imgData = convertToImageData(
            stringToData(data.image),
            data.width,
            data.height
        );

        const result: StoredRoute = {
            image: imgData,
            holds: data.holds,
        };

        return result;
    } catch (err) {
        console.warn('Issue while parsing JSON', err);
        return null;
    }
}
