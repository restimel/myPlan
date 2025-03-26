
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

function stringToData(text: string): Uint8ClampedArray<ArrayBufferLike> {
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

    const buffer = new ArrayBuffer(data.length);
    const clampedArray = new Uint8ClampedArray(buffer);

    clampedArray.set(data);

    return clampedArray;
}

export function saveRoute(image: ImageData, holdList: Hold[]): boolean {
    const storage: StoredImage = {
        image: dataToString(image.data),
        width: image.width,
        height: image.height,
        holds: holdList,
    };

    const json = JSON.stringify(storage);

    if (json.length > STORAGE_LIMIT) {
        return false;
    }

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
        const imgData = new ImageData(
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
