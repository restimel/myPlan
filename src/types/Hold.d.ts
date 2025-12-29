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
};

type RouteSettings = {
    routeName: string;
    greyedImage: GreySettings;
};
