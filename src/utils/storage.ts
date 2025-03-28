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

/** Name of the localStorage saved on browser */
const STORAGE_NAME = 'plan';

/**
 * This offset is to avoid controls and non printable characters (before 32)
 * and character to escape such as " (code 34)
 * Unfortunately, the \ character (code 92) is higher. But we can hope it does
 * not appear as often.
 */
const CHAR_OFFSET = 35;

/** Localstorage limit is around 5M */
const STORAGE_LIMIT = 2_400_000;

/** Used for compression */
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

/** Uncompress the stored data */
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

        const newHoldList = holdList.map((hold) => {
            return {
                position: hold.position.map(([x, y]) => {
                    return [
                        x / ratioReduceFactor,
                        y / ratioReduceFactor,
                    ] as Point;
                }),
                value: hold.value,
                size: hold.size,
                index: hold.index,
            } as Hold;
        });

        return saveRoute(newImgData, newHoldList, retry - 1);
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
        const stored: StoredImage = JSON.parse(json);
        const data = stringToData(stored.image);
        const imgData = convertToImageData(
            data,
            stored.width,
            stored.height
        );

        const result: StoredRoute = {
            image: imgData,
            holds: stored.holds,
        };

        return result;
    } catch (err) {
        console.warn('Issue while parsing JSON', err);
        return null;
    }
}
