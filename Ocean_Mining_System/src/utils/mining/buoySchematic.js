export const MOORING_DEPTH = 3500;
// Local z is in above-water metres; labels always use the real depth.
export const schematicHeight = realHeight => realHeight < 0 ? realHeight / 1000 : realHeight;
export const schematicPoint = ([x, y, realHeight]) => [x, y, schematicHeight(realHeight)];
export const MOORING_LINE = [
  [0, 0, -8], [0, 0, -650], [.15, 0, -1050], [.65, 0, -1250],
  [1.1, 0, -850], [1.1, 0, -1000], [1.1, 0, -2000], [1.35, 0, -3250], [1.8, 0, -3500]
];
export const MOORING_TICKS = [6, 4, 2, 0, -1000, -2000, -MOORING_DEPTH];
