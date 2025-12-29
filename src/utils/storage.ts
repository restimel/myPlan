import {
    convertToImageData,
    reduceSize,
    table1Dto2D,
    table2Dto1D,
} from '@/utils/image';
import { log } from '@/utils/debug';
import type { Period } from '@/stores/ChronometerStore';

type StoredImage = {
    version: number;
    image: string;
    width: number;
    height: number;
    holds: Hold[];
    settings: RouteSettings;
}

export type StoredRoute = {
    image: ImageData;
    holds: Hold[];
    settings: RouteSettings;
}

/** Name of the localStorage saved on browser */
const ROUTE_STORAGE_NAME = 'plan';
const TIMER_STORAGE_NAME = 'chronometers';

/**
 * This offset is to avoid controls and non printable characters (before 32)
 * and character to escape such as " (code 34)
 * Unfortunately, the \ character (code 92) is higher. But we can hope it does
 * not appear as often.
 */
const CHAR_OFFSET = 35;

/** Localstorage limit is around 5M */
const ROUTE_STORAGE_LIMIT = 2_400_000;

const defaultSettings: RouteSettings = {
    routeName: '',
    greyedImage: {},
};

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

/* {{{ Route storage */

export function saveRoute(image: ImageData, holdList: Hold[], settings: RouteSettings, retry = 5): boolean {
    const storage: StoredImage = {
        version: 1,
        image: dataToString(image.data),
        width: image.width,
        height: image.height,
        holds: holdList,
        settings,
    };

    const json = JSON.stringify(storage);

    if (json.length > ROUTE_STORAGE_LIMIT) {
        const wantedRatioReduceFactor = Math.ceil(json.length * 10 / ROUTE_STORAGE_LIMIT) / 10;
        const ratioReduceFactor = Math.ceil(Math.sqrt(wantedRatioReduceFactor) * 100) / 100;

        if (retry <= 0) {
            log('error', `save route failed (length: ${json.length}, reduceRatio: ${ratioReduceFactor})`);
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
                size: hold.size / ratioReduceFactor,
                index: hold.index,
            } as Hold;
        });

        return saveRoute(newImgData, newHoldList, settings, retry - 1);
    }

    log('information', 'storage size: ' + json.length);
    localStorage.setItem(ROUTE_STORAGE_NAME, json);

    return true;
}

export function loadRoute(): StoredRoute | null {
    const json = localStorage.getItem(ROUTE_STORAGE_NAME);

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
            settings: {
                ...defaultSettings,
                ...(stored.settings ?? {}),
            },
        };

        return result;
    } catch (err) {
        log('warning', `Issue while parsing Route JSON (error: ${err})`);
        return null;
    }
}

/* }}} */
/* {{{ Timer storage */

export function saveTimer(periods: Period[]) {
    const json = JSON.stringify(periods);

    log('information', 'save timer (size: ' + json.length + ')');
    localStorage.setItem(TIMER_STORAGE_NAME, json);
}

export function loadTimer(): Period[] | null {
    const json = localStorage.getItem(TIMER_STORAGE_NAME);

    if (!json) {
        log('information', 'Storage: no timer found');
        return null;
    }

    try {
        const stored = JSON.parse(json);

        if (!Array.isArray(stored)) {
            log('information', 'Storage: invalid stored data --- ' + json);
            return null;
        }

        log('information', 'Storage: load timers:' + stored.length);

        return stored;
    } catch (err) {
        log('warning', `Issue while parsing Timer JSON (error: ${err})`);
        return null;
    }
}

/* }}} */
