type ColorRGB = [number, number, number];
type ColorHSL = [number, number, number];

/** [x, y] */
type Point = [number, number];

/** [x, y, width, height] */
type Box = [number, number, number, number];

/** [[x, y], [x, y]] */
type Rect = [Point, Point];

type Hold = {
    position: Point[];
    value: number | [number, number];
    size: number;
    index: number;
};

type GreySettings = {
    color?: ColorRGB;
    colorMargin?: number;
};

type WarpZone = {
    /** percentage of source height, integer [0, 100] */
    top: number;

    /** percentage of source height, integer [0, 100] */
    bottom: number;

    /** stretch factor × 100, integer (e.g. 150 = ×1.5) */
    factor: number;
};

type RouteSettings = {
    routeName: string;
    greyedImage: GreySettings;
    /* Array to allow multiple zones in the future; only [0] is used for now */
    warpZones?: WarpZone[];
};
