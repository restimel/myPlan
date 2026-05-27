import type { Period, PeriodColor } from '@/stores/ChronometerStore';

type EndEffect = Period['endEffect'];
const END_EFFECT_INDEX: Record<EndEffect, number> = { stop: 0, startNext: 1, restart: 2, continue: 3 };
const END_EFFECT_FROM_INDEX: EndEffect[] = ['stop', 'startNext', 'restart', 'continue'];
/*
 * URL payload format: <version><base64url(payload)>
 *
 * version  — single character (digit or letter, alphabetically ordered).
 *             '0' = raw JSON (no compression), v1 compact schema
 *             '1' = deflate-raw compressed JSON, v1 compact schema
 *             Encoder picks whichever produces a shorter output.
 *
 * JSON     — top-level 2-element array: [templateName, periodsArray]
 *            templateName  string  (kept in payload to avoid URI-encoding overhead for accented chars)
 *            periodsArray  array of compact period arrays, one entry per period:
 *
 *   [0]  name           string
 *   [1]  duration       number (seconds)
 *   [2]  flags          bitmask (default 0, absent = 0):
 *                         bits 0-1: endEffect  0=stop · 1=startNext · 2=restart · 3=continue
 *                         bit 2:    noVibration   (0 = vibration on = default)
 *                         bit 3:    noSound        (0 = sound on = default)
 *                         bit 4:    noSoundWarning (0 = soundWarning on = default)
 *                         bit 5:    resetToPeriod1 (0 = false = default)
 *   [3]  bgColor        number | string | null  (null = "default"; #rrggbb stored as hex integer)
 *   [4]  warnColor      number | string | null
 *   [5]  timeoutColor   number | string | null
 *   [6]  warningTimes   number[] in seconds | null  (null = use DEFAULT_WARNING_TIMES)
 *
 * Colors in #rrggbb format are stored as their integer value (e.g. "#ff0000" → 16711680).
 * Other color formats are kept as strings.
 * Trailing fields are omitted when they match their defaults.
 * [2] is omitted when 0 and no field after it is present.
 * [3]–[5] are only included when at least one color is non-default or [6] is present.
 */

function encodeColor(color: PeriodColor): number | string | null {
    if (color === 'default') {
        return null;
    }

    // Store #rrggbb as integer: saves 2 chars per color over the quoted-string form
    if (/^#[0-9a-fA-F]{6}$/.test(color)) {
        return parseInt(color.slice(1), 16);
    }

    return color;
}

function decodeColor(value: number | string | null | undefined): PeriodColor {
    if (value == null) {
        return 'default';
    }

    if (typeof value === 'number') {
        return '#' + value.toString(16).padStart(6, '0');
    }

    return value;
}

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
    const bgColor = encodeColor(period.colors.background);
    const warnColor = encodeColor(period.colors.txtWarning);
    const timeoutColor = encodeColor(period.colors.timeout);
    // warningTimes is optional (undefined = absent); null means "use defaults" in the URL schema
    const warningTimes = period.warningTimes !== undefined ? period.warningTimes.map((ms) => ms / 1000) : null;
    const hasColors = bgColor !== null || warnColor !== null || timeoutColor !== null;
    const hasWarningTimes = warningTimes !== null;
    // Bitmask layout: bits 0-1 endEffect, bit 2 noVibration, bit 3 noSound, bit 4 noSoundWarning, bit 5 resetToPeriod1
    const flags =
        END_EFFECT_INDEX[period.endEffect] |
        (period.activateVibration ? 0 : 1 << 2) |
        (period.activateSound ? 0 : 1 << 3) |
        (period.soundWarning ? 0 : 1 << 4) |
        (period.resetToPeriod1 ? 1 << 5 : 0);
    const row: unknown[] = [period.name, period.duration];

    if (flags !== 0 || hasColors || hasWarningTimes) {
        row.push(flags);
    }

    if (hasColors || hasWarningTimes) {
        row.push(bgColor, warnColor, timeoutColor);
    }

    if (hasWarningTimes) {
        row.push(warningTimes);
    }

    return row;
}

function compactToPeriod(row: unknown[]): Period {
    // Bitmask layout: bits 0-1 endEffect, bit 2 noVibration, bit 3 noSound, bit 4 noSoundWarning, bit 5 resetToPeriod1
    const flags = (row[2] as number | undefined) ?? 0;
    const warningTimesSec = row[6] as number[] | null | undefined;

    return {
        id: '',
        name: row[0] as string,
        duration: row[1] as number,
        endEffect: END_EFFECT_FROM_INDEX[flags & 3] ?? 'stop',
        activateVibration: (flags & (1 << 2)) === 0,
        activateSound: (flags & (1 << 3)) === 0,
        soundWarning: (flags & (1 << 4)) === 0,
        colors: {
            background: decodeColor(row[3] as number | string | null | undefined),
            txtWarning: decodeColor(row[4] as number | string | null | undefined),
            timeout: decodeColor(row[5] as number | string | null | undefined),
        },
        // != catches both null (explicit default) and undefined (absent field) — both mean "no custom times"
        warningTimes: warningTimesSec != null ? warningTimesSec.map((sec) => sec * 1000) : undefined,
        resetToPeriod1: (flags & (1 << 5)) !== 0 ? true : undefined,
    };
}

function toBase64Url(data: string): string {
    return btoa(encodeURIComponent(data).replace(/%([0-9A-F]{2})/g, (_match, hex) => String.fromCharCode(parseInt(hex, 16))))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function fromBase64Url(base64: string): string {
    const binary = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));

    return decodeURIComponent(Array.from(binary, (char) => '%' + char.charCodeAt(0).toString(16).padStart(2, '0')).join(''));
}

export async function encodeTemplateToUrl(name: string, periods: Period[]): Promise<string> {
    const compact = periods.map(periodToCompact);
    const json = JSON.stringify([name, compact]);
    const raw = '0' + toBase64Url(json);
    const compressed = '1' + await compressToBase64(json);

    return raw.length <= compressed.length ? raw : compressed;
}

export async function decodeTemplateFromUrl(payload: string): Promise<{ name: string; periods: Period[] } | null> {
    try {
        const version = payload[0];
        const data = payload.slice(1);
        const json = version === '0' ? fromBase64Url(data) : await decompressFromBase64(data);
        const [name, compact] = JSON.parse(json) as [string, unknown[][]];

        return { name, periods: compact.map(compactToPeriod) };
    } catch {
        return null;
    }
}