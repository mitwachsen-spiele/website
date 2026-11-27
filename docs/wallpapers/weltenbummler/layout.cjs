// Layouts in the sign frame (geom.cjs): u along the planks (px), v across (px, 0 = seam between plank 2 and 3)
const navy = [29, 40, 56];
const g1 = [168, 124, 76], g2 = [163, 119, 71], g3 = [160, 117, 71];
const grad = [[0, [255, 250, 240]], [0.55, [255, 240, 200]], [0.96, [255, 201, 91]]];
// grain lines of the original board, traced from the original (they run behind the lettering)
const grain = [
  { color: g1, t: 4, pts: [[18, -95.5], [70, -97.5], [150, -99.3], [235, -99.6], [300, -97.8], [400, -94.5], [480, -92.2], [560, -91.5], [620, -91.5], [680, -93], [736, -95.2]] },
  { color: g2, t: 4, pts: [[18, -48.8], [45, -47.8], [95, -46.5]] },
  { color: g3, t: 4, pts: [[18, 32.4], [60, 30.3], [120, 29], [200, 28.3], [250, 28.8], [320, 30.3], [390, 32.1], [450, 34.6], [540, 36.2], [630, 36], [690, 34], [736, 31.8]] },
];
const base = {
  navy, grain,
  region: { u0: 3, u1: 805, v0: -126, v1: 76, feather: 4 },
  keep: [{ u: 19.8, v: -129.5, r: 16 }, { u: 810.9, v: -130.1, r: 16 }],
};
const title = (text, size, u, v) => ({ text, size, u, v, ls: -4 * size / 120, stroke: 18 * size / 120, asc: 77 * size / 120,
  sh: [6 * size / 120, 7 * size / 120], shC: [60, 40, 20], shA: 0.38, grad });
const sub = (text, size, u, v) => ({ text, size, u, v, ls: -2 * size / 47.5, color: [56, 38, 22], hl: [0, 3 * size / 47.5], hlC: [255, 235, 195], hlA: 0.45 });
const knot = (u, v, rx, ry) => ({ u, v, rx, ry, lw: 3, fill: [143, 100, 57] });
module.exports = {
  old: { ...base, knots: [knot(261, -88, 11, 8), knot(726, 44.2, 15.5, 8.5)],
    title: title('Mitwachsen', 120, 75, -23), sub: sub('larmic.de/spiele/mitwachsen', 47.5, 93.5, 56.5) },
  new: { ...base, knots: [knot(338, -84, 11, 8), knot(752, 43.6, 14.5, 8)],
    title: title('Weltenbummler', 100, 56, -29.5), sub: { ...sub('weltenbummler.mitwachsen-spiele.de', 40, 72, 54), dotGap: 1.2 } },
};
