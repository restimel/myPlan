import type { Period } from '@/stores/ChronometerStore';

type EndEffect = Period['endEffect'];
const END_EFFECT_INDEX: Record<EndEffect, number> = { stop: 0, startNext: 1, restart: 2, continue: 3 };
const END_EFFECT_FROM_INDEX: EndEffect[] = ['stop', 'startNext', 'restart', 'continue'];
const CURRENT_VERSION = '1';

/*
 * URL payload format: <version><base64(deflate-raw(JSON))>
 *
 * version  — single character, currently '1'. Bump when the compact schema changes.
 *
 * JSON     — array of compact period arrays, one entry per period:
 *
 *   [0]  name           string
 *   [1]  duration       number (seconds)
 *   [2]  endEffect      0=stop · 1=startNext · 2=restart · 3=continue  (default 0)
 *   [3]  vibration      0|1                                             (default 1)
 *   [4]  sound          0|1                                             (default 1)
 *   [5]  soundWarning   0|1                                             (default 1)
 *   [6]  bgColor        string | null  (null = "default")
 *   [7]  warnColor      string | null  (null = "default")
 *   [8]  timeoutColor   string | null  (null = "default")
 *   [9]  warningTimes   number[] | null  (null = use DEFAULT_WARNING_TIMES)
 *   [10] resetToPeriod1 1 | absent
 *
 * Trailing fields are omitted when they match their defaults.
 * [2]–[5] are only included when at least one is non-default or [6]+ are present.
 * [6]–[8] are only included when at least one color is non-default or [9]+ are present.
 */
async function compressToBase64(data: string): Promise<string> {
    const encoded = new TextEncoder().encode(data);
    const stream = new CompressionStream('deflate-raw');
    const writer = stream.writable.getWriter();

    writer.write(encoded);
    writer.close();

    const chunks: Uint8Array[] = [];
    const reader = stream.readable.getReader();

    while (true) {
        const { done, value } = await reader.read();

        if (done) {
            break;
        }

        chunks.push(value);
    }

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }

    return btoa(Array.from(result, (byte) => String.fromCharCode(byte)).join(''))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

async function decompressFromBase64(base64: string): Promise<string> {
    const binary = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const stream = new DecompressionStream('deflate-raw');
    const writer = stream.writable.getWriter();

    writer.write(bytes);
    writer.close();

    const chunks: Uint8Array[] = [];
    const reader = stream.readable.getReader();

    while (true) {
        const { done, value } = await reader.read();

        if (done) {
            break;
        }

        chunks.push(value);
    }

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }

    return new TextDecoder().decode(result);
}

function periodToCompact(period: Period): unknown[] {
    const bgColor = period.colors.background === 'default' ? null : period.colors.background;
    const warnColor = period.colors.txtWarning === 'default' ? null : period.colors.txtWarning;
    const timeoutColor = period.colors.timeout === 'default' ? null : period.colors.timeout;
    const warningTimes = period.warningTimes ?? null;
    const hasColors = bgColor !== null || warnColor !== null || timeoutColor !== null;
    const hasWarningTimes = warningTimes !== null;
    const hasReset = period.resetToPeriod1 === true;
    const hasExtended = hasColors || hasWarningTimes || hasReset;
    const endEffectVal = END_EFFECT_INDEX[period.endEffect];
    const vibration = period.activateVibration ? 1 : 0;
    const sound = period.activateSound ? 1 : 0;
    const soundWarning = period.soundWarning ? 1 : 0;
    const row: unknown[] = [period.name, period.duration];

    if (hasExtended) {
        row.push(endEffectVal, vibration, sound, soundWarning, bgColor, warnColor, timeoutColor);
    } else if (endEffectVal !== 0 || vibration !== 1 || sound !== 1 || soundWarning !== 1) {
        row.push(endEffectVal);

        if (vibration !== 1 || sound !== 1 || soundWarning !== 1) {
            row.push(vibration);
        }

        if (sound !== 1 || soundWarning !== 1) {
            row.push(sound);
        }

        if (soundWarning !== 1) {
            row.push(soundWarning);
        }
    }

    if (hasWarningTimes || hasReset) {
        row.push(warningTimes);
    }

    if (hasReset) {
        row.push(1);
    }

    return row;
}

function compactToPeriod(row: unknown[]): Period {
    return {
        id: '',
        name: row[0] as string,
        duration: row[1] as number,
        endEffect: END_EFFECT_FROM_INDEX[(row[2] as number | undefined) ?? 0] ?? 'stop',
        activateVibration: row[3] == null ? true : row[3] === 1,
        activateSound: row[4] == null ? true : row[4] === 1,
        soundWarning: row[5] == null ? true : row[5] === 1,
        colors: {
            background: (row[6] as string | null | undefined) ?? 'default',
            txtWarning: (row[7] as string | null | undefined) ?? 'default',
            timeout: (row[8] as string | null | undefined) ?? 'default',
        },
        warningTimes: row[9] != null ? row[9] as number[] : undefined,
        resetToPeriod1: row[10] === 1 ? true : undefined,
    };
}

export async function encodePeriodsToUrl(periods: Period[]): Promise<string> {
    const compact = periods.map(periodToCompact);
    const json = JSON.stringify(compact);
    const compressed = await compressToBase64(json);

    return CURRENT_VERSION + compressed;
}

export async function decodePeriodsFromUrl(payload: string): Promise<Period[] | null> {
    try {
        const json = await decompressFromBase64(payload.slice(1));
        const compact = JSON.parse(json) as unknown[][];

        return compact.map(compactToPeriod);
    } catch {
        return null;
    }
}