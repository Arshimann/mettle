/**
 * Pose data for the stretch figure, v2.
 *
 * The figure is a 13-joint skeleton: a 4-point spine chain (neck → chest →
 * waist → pelvis) that can genuinely round and arch, plus two-segment limbs
 * drawn as quadratic curves (the joint is the control point, so elbows and
 * knees bend organically instead of kinking). Each kind is authored as one
 * carefully-posed "deep" keyframe; the second keyframe is derived by easing
 * every joint slightly toward standing, which reads as breathing into the
 * stretch. Kinds where that drift would look wrong (cat-cow, twists, neck
 * rolls, dead hang) author their own second keyframe.
 */

export type Pt = [number, number];

export interface Pose {
  head: Pt; // head circle center
  neck: Pt;
  chest: Pt;
  waist: Pt;
  pelvis: Pt;
  elbowL: Pt;
  handL: Pt;
  elbowR: Pt;
  handR: Pt;
  kneeL: Pt;
  footL: Pt;
  kneeR: Pt;
  footR: Pt;
}

export type FigureKind =
  | 'stand'
  | 'forward-fold'
  | 'seated-fold'
  | 'doorway'
  | 'cobra'
  | 'cat-cow'
  | 'child-pose'
  | 'deep-squat'
  | 'dead-hang'
  | 'spinal-twist'
  | 'lunge'
  | 'quad-pull'
  | 'calf-wall'
  | 'overhead-reach'
  | 'neck'
  | 'bridge'
  | 'butterfly'
  | 'downward-dog';

const STAND: Pose = {
  head: [60, 17],
  neck: [60, 27],
  chest: [60, 39],
  waist: [60, 52],
  pelvis: [60, 64],
  elbowL: [53, 49],
  handL: [51, 61],
  elbowR: [67, 49],
  handR: [69, 61],
  kneeL: [56, 86],
  footL: [55, 106],
  kneeR: [64, 86],
  footR: [65, 106],
};

const mk = (over: Partial<Pose>): Pose => ({ ...STAND, ...over });

const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Ease every joint a touch toward standing — the "breathe out" keyframe. */
function relax(pose: Pose, t = 0.16): Pose {
  const out = {} as Pose;
  (Object.keys(pose) as (keyof Pose)[]).forEach((k) => {
    out[k] = lerp(pose[k], STAND[k], t);
  });
  return out;
}

/** Deep pose (a) + optional authored counter-pose (b, defaults to relax(a)). */
const DEFS: Record<FigureKind, { a: Pose; b?: Pose }> = {
  stand: {
    a: STAND,
    b: mk({ head: [60, 15], neck: [60, 25], chest: [60, 37], handL: [50, 59], handR: [70, 59] }),
  },
  'forward-fold': {
    a: {
      head: [42, 88], neck: [45, 80], chest: [49, 72], waist: [55, 62], pelvis: [62, 58],
      elbowL: [43, 92], handL: [44, 102], elbowR: [47, 93], handR: [48, 103],
      kneeL: [59, 82], footL: [58, 105], kneeR: [65, 82], footR: [64, 105],
    },
  },
  'seated-fold': {
    a: {
      head: [69, 68], neck: [64, 72], chest: [57, 77], waist: [49, 84], pelvis: [42, 92],
      elbowL: [72, 82], handL: [84, 90], elbowR: [74, 84], handR: [86, 92],
      kneeL: [66, 92], footL: [94, 94], kneeR: [68, 95], footR: [96, 97],
    },
  },
  doorway: {
    a: mk({
      chest: [61, 38],
      elbowL: [44, 33], handL: [39, 21], elbowR: [77, 33], handR: [82, 21],
    }),
  },
  cobra: {
    a: {
      head: [43, 64], neck: [46, 72], chest: [52, 81], waist: [63, 91], pelvis: [77, 97],
      elbowL: [51, 92], handL: [55, 102], elbowR: [54, 93], handR: [58, 103],
      kneeL: [91, 100], footL: [106, 101], kneeR: [93, 102], footR: [108, 103],
    },
  },
  'cat-cow': {
    // Cat: spine arched to the ceiling…
    a: {
      head: [36, 80], neck: [42, 73], chest: [51, 67], waist: [65, 66], pelvis: [80, 74],
      elbowL: [45, 87], handL: [45, 100], elbowR: [48, 88], handR: [48, 101],
      kneeL: [82, 100], footL: [95, 102], kneeR: [85, 101], footR: [98, 103],
    },
    // …cow: belly drops, gaze lifts.
    b: {
      head: [34, 66], neck: [41, 71], chest: [51, 79], waist: [65, 84], pelvis: [80, 76],
      elbowL: [45, 87], handL: [45, 100], elbowR: [48, 88], handR: [48, 101],
      kneeL: [82, 100], footL: [95, 102], kneeR: [85, 101], footR: [98, 103],
    },
  },
  'child-pose': {
    a: {
      head: [40, 86], neck: [47, 84], chest: [55, 83], waist: [67, 86], pelvis: [79, 92],
      elbowL: [33, 90], handL: [22, 93], elbowR: [36, 92], handR: [25, 95],
      kneeL: [83, 102], footL: [95, 104], kneeR: [86, 103], footR: [98, 105],
    },
  },
  'deep-squat': {
    a: {
      head: [58, 36], neck: [58, 45], chest: [58, 53], waist: [59, 65], pelvis: [60, 78],
      elbowL: [49, 62], handL: [51, 73], elbowR: [67, 62], handR: [65, 73],
      kneeL: [43, 84], footL: [47, 106], kneeR: [77, 84], footR: [73, 106],
    },
  },
  'dead-hang': {
    a: {
      head: [60, 37], neck: [60, 46], chest: [60, 56], waist: [60, 68], pelvis: [60, 79],
      elbowL: [55, 28], handL: [54, 14], elbowR: [65, 28], handR: [66, 14],
      kneeL: [58, 95], footL: [57, 111], kneeR: [62, 95], footR: [63, 111],
    },
    b: {
      head: [60, 39], neck: [60, 48], chest: [60, 58], waist: [60, 70], pelvis: [60, 81],
      elbowL: [55, 28], handL: [54, 14], elbowR: [65, 28], handR: [66, 14],
      kneeL: [58, 97], footL: [57, 113], kneeR: [62, 97], footR: [63, 113],
    },
  },
  'spinal-twist': {
    a: mk({
      head: [63, 16],
      elbowL: [71, 44], handL: [79, 51], elbowR: [50, 55], handR: [42, 47],
    }),
    b: mk({
      head: [57, 16],
      elbowL: [49, 44], handL: [41, 51], elbowR: [70, 55], handR: [78, 47],
    }),
  },
  lunge: {
    a: {
      head: [59, 27], neck: [59, 36], chest: [60, 45], waist: [59, 57], pelvis: [58, 70],
      elbowL: [52, 53], handL: [54, 64], elbowR: [67, 53], handR: [65, 64],
      kneeL: [45, 86], footL: [43, 106], kneeR: [77, 88], footR: [97, 104],
    },
  },
  'quad-pull': {
    a: mk({
      head: [59, 16],
      elbowL: [47, 43], handL: [38, 36],
      elbowR: [72, 53], handR: [71, 67],
      kneeL: [58, 86], footL: [58, 106],
      kneeR: [66, 88], footR: [70, 68],
    }),
  },
  'calf-wall': {
    a: {
      head: [45, 26], neck: [48, 33], chest: [51, 42], waist: [57, 53], pelvis: [63, 64],
      elbowL: [38, 39], handL: [29, 35], elbowR: [41, 46], handR: [30, 44],
      kneeL: [57, 84], footL: [52, 104], kneeR: [76, 86], footR: [93, 106],
    },
  },
  'overhead-reach': {
    a: {
      head: [70, 19], neck: [67, 28], chest: [64, 39], waist: [59, 52], pelvis: [59, 64],
      elbowL: [58, 22], handL: [62, 11], elbowR: [71, 21], handR: [77, 11],
      kneeL: [56, 86], footL: [55, 106], kneeR: [64, 86], footR: [65, 106],
    },
  },
  neck: {
    a: mk({ head: [67, 18] }),
    b: mk({ head: [53, 18] }),
  },
  bridge: {
    a: {
      head: [26, 99], neck: [32, 97], chest: [40, 91], waist: [52, 83], pelvis: [64, 79],
      elbowL: [36, 102], handL: [26, 104], elbowR: [39, 103], handR: [29, 105],
      kneeL: [79, 84], footL: [85, 102], kneeR: [82, 86], footR: [88, 103],
    },
  },
  butterfly: {
    a: {
      head: [60, 47], neck: [60, 56], chest: [60, 64], waist: [60, 76], pelvis: [60, 88],
      elbowL: [50, 78], handL: [56, 92], elbowR: [70, 78], handR: [64, 92],
      kneeL: [42, 89], footL: [58, 96], kneeR: [78, 89], footR: [62, 96],
    },
    b: {
      head: [60, 49], neck: [60, 58], chest: [60, 66], waist: [60, 77], pelvis: [60, 88],
      elbowL: [50, 79], handL: [56, 92], elbowR: [70, 79], handR: [64, 92],
      kneeL: [46, 87], footL: [58, 96], kneeR: [74, 87], footR: [62, 96],
    },
  },
  'downward-dog': {
    a: {
      head: [41, 75], neck: [46, 68], chest: [52, 61], waist: [61, 52], pelvis: [70, 45],
      elbowL: [36, 87], handL: [28, 100], elbowR: [39, 89], handR: [31, 102],
      kneeL: [80, 66], footL: [92, 96], kneeR: [83, 68], footR: [95, 98],
    },
  },
};

/** Every figure kind, for pickers. */
export const FIGURE_KINDS = Object.keys(DEFS) as FigureKind[];

export const FIGURE_LOOP = { duration: 2.8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' } as const;

// ---- path building -------------------------------------------------------

const f = (n: number) => n.toFixed(1);

/** Smooth open curve through points (Catmull-Rom → cubic Bézier). */
function smooth(pts: Pt[]): string {
  if (pts.length < 2) return '';
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])} ${f(c1[1])}, ${f(c2[0])} ${f(c2[1])}, ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/** Limb: quadratic curve with the joint as control — organic elbow/knee bend. */
const limb = (from: Pt, joint: Pt, to: Pt): string =>
  `M${f(from[0])} ${f(from[1])} Q${f(joint[0])} ${f(joint[1])}, ${f(to[0])} ${f(to[1])}`;

export interface FigurePaths {
  spine: string; // neck → chest → waist → pelvis
  armL: string;
  armR: string;
  legL: string;
  legR: string;
  head: Pt;
  neck: Pt;
}

export function posePaths(p: Pose): FigurePaths {
  return {
    spine: smooth([p.neck, p.chest, p.waist, p.pelvis]),
    armL: limb(p.chest, p.elbowL, p.handL),
    armR: limb(p.chest, p.elbowR, p.handR),
    legL: limb(p.pelvis, p.kneeL, p.footL),
    legR: limb(p.pelvis, p.kneeR, p.footR),
    head: p.head,
    neck: p.neck,
  };
}

/** Two renderable keyframes for a kind. */
export function figureFrames(kind: FigureKind): [FigurePaths, FigurePaths] {
  const def = DEFS[kind] ?? DEFS.stand;
  return [posePaths(def.a), posePaths(def.b ?? relax(def.a))];
}
