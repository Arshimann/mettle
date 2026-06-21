/**
 * Pose data for the stretch stick-figure. Kept in its own module so the
 * component file can stay component-only (Fast Refresh) and so pickers can
 * import the kind list without pulling in the renderer.
 */

export type Pt = [number, number];
export type Joints = {
  head: Pt;
  sho: Pt;
  hip: Pt;
  elbowL: Pt;
  handL: Pt;
  elbowR: Pt;
  handR: Pt;
  kneeL: Pt;
  footL: Pt;
  kneeR: Pt;
  footR: Pt;
};

// Bones connect named joints; the head is drawn as a separate dot.
export const BONES: [keyof Joints, keyof Joints][] = [
  ['sho', 'head'],
  ['sho', 'hip'],
  ['sho', 'elbowL'],
  ['elbowL', 'handL'],
  ['sho', 'elbowR'],
  ['elbowR', 'handR'],
  ['hip', 'kneeL'],
  ['kneeL', 'footL'],
  ['hip', 'kneeR'],
  ['kneeR', 'footR'],
];

const STAND: Joints = {
  head: [60, 20],
  sho: [60, 38],
  hip: [60, 66],
  elbowL: [49, 53],
  handL: [47, 67],
  elbowR: [71, 53],
  handR: [73, 67],
  kneeL: [54, 87],
  footL: [54, 107],
  kneeR: [66, 87],
  footR: [66, 107],
};

const mk = (over: Partial<Joints>): Joints => ({ ...STAND, ...over });

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

const CAT_COW_LIMBS = {
  elbowL: [44, 84] as Pt,
  handL: [44, 99] as Pt,
  elbowR: [47, 84] as Pt,
  handR: [47, 99] as Pt,
  kneeL: [80, 86] as Pt,
  footL: [80, 99] as Pt,
  kneeR: [83, 86] as Pt,
  footR: [83, 99] as Pt,
};

export const POSES: Record<FigureKind, [Joints, Joints]> = {
  stand: [
    STAND,
    mk({ head: [60, 18], sho: [60, 37], elbowL: [48, 52], handL: [46, 66], elbowR: [72, 52], handR: [74, 66] }),
  ],
  'forward-fold': [
    STAND,
    mk({ head: [60, 74], sho: [60, 58], hip: [60, 64], elbowL: [53, 76], handL: [53, 96], elbowR: [67, 76], handR: [67, 96] }),
  ],
  'seated-fold': [
    {
      head: [46, 44], sho: [46, 60], hip: [46, 82],
      elbowL: [55, 66], handL: [64, 74], elbowR: [55, 70], handR: [64, 78],
      kneeL: [66, 84], footL: [90, 86], kneeR: [66, 88], footR: [90, 90],
    },
    {
      head: [58, 56], sho: [52, 64], hip: [46, 82],
      elbowL: [68, 72], handL: [82, 82], elbowR: [68, 76], handR: [82, 86],
      kneeL: [66, 84], footL: [90, 86], kneeR: [66, 88], footR: [90, 90],
    },
  ],
  doorway: [
    mk({ elbowL: [42, 40], handL: [36, 30], elbowR: [78, 40], handR: [84, 30] }),
    mk({ head: [60, 22], sho: [60, 40], hip: [62, 66], elbowL: [40, 42], handL: [34, 33], elbowR: [80, 42], handR: [86, 33], kneeL: [52, 87], kneeR: [64, 85] }),
  ],
  cobra: [
    {
      head: [48, 92], sho: [54, 95], hip: [80, 99],
      elbowL: [58, 98], handL: [60, 103], elbowR: [58, 99], handR: [60, 104],
      kneeL: [94, 101], footL: [108, 101], kneeR: [94, 103], footR: [108, 103],
    },
    {
      head: [44, 76], sho: [52, 86], hip: [80, 99],
      elbowL: [58, 94], handL: [62, 103], elbowR: [58, 95], handR: [62, 104],
      kneeL: [94, 101], footL: [108, 101], kneeR: [94, 103], footR: [108, 103],
    },
  ],
  'cat-cow': [
    { head: [34, 66], sho: [44, 72], hip: [80, 74], ...CAT_COW_LIMBS },
    { head: [40, 82], sho: [46, 76], hip: [80, 67], ...CAT_COW_LIMBS },
  ],
  'child-pose': [
    {
      head: [40, 84], sho: [52, 82], hip: [78, 90],
      elbowL: [34, 84], handL: [22, 88], elbowR: [34, 86], handR: [22, 90],
      kneeL: [80, 96], footL: [92, 98], kneeR: [82, 96], footR: [92, 100],
    },
    {
      head: [38, 86], sho: [52, 84], hip: [78, 90],
      elbowL: [33, 86], handL: [20, 90], elbowR: [33, 88], handR: [20, 92],
      kneeL: [80, 96], footL: [92, 98], kneeR: [82, 96], footR: [92, 100],
    },
  ],
  'deep-squat': [
    STAND,
    mk({ hip: [60, 80], sho: [60, 58], head: [60, 40], kneeL: [46, 88], footL: [50, 107], kneeR: [74, 88], footR: [70, 107], elbowL: [50, 66], handL: [54, 76], elbowR: [70, 66], handR: [66, 76] }),
  ],
  'dead-hang': [
    {
      head: [60, 40], sho: [60, 48], hip: [60, 74],
      elbowL: [57, 33], handL: [55, 20], elbowR: [63, 33], handR: [65, 20],
      kneeL: [57, 92], footL: [57, 110], kneeR: [63, 92], footR: [63, 110],
    },
    {
      head: [60, 42], sho: [60, 50], hip: [60, 77],
      elbowL: [57, 33], handL: [55, 20], elbowR: [63, 33], handR: [65, 20],
      kneeL: [58, 95], footL: [58, 112], kneeR: [62, 95], footR: [62, 112],
    },
  ],
  'spinal-twist': [
    mk({ elbowL: [48, 48], handL: [64, 46], elbowR: [72, 56], handR: [58, 60] }),
    mk({ elbowL: [72, 48], handL: [56, 46], elbowR: [48, 56], handR: [62, 60] }),
  ],
  lunge: [
    {
      head: [58, 34], sho: [58, 48], hip: [60, 68],
      elbowL: [50, 58], handL: [48, 72], elbowR: [66, 58], handR: [68, 72],
      kneeL: [44, 86], footL: [40, 106], kneeR: [80, 90], footR: [100, 106],
    },
    {
      head: [58, 40], sho: [58, 54], hip: [60, 74],
      elbowL: [50, 64], handL: [48, 78], elbowR: [66, 64], handR: [68, 78],
      kneeL: [42, 88], footL: [40, 106], kneeR: [84, 94], footR: [104, 107],
    },
  ],
  'quad-pull': [
    mk({ elbowR: [74, 58], handR: [74, 72], kneeR: [66, 88], footR: [66, 84] }),
    mk({ head: [60, 19], elbowR: [76, 66], handR: [74, 72], kneeR: [68, 90], footR: [74, 74], handL: [40, 58], elbowL: [44, 50] }),
  ],
  'calf-wall': [
    {
      head: [58, 30], sho: [56, 44], hip: [64, 66],
      elbowL: [44, 40], handL: [32, 34], elbowR: [46, 46], handR: [32, 46],
      kneeL: [58, 86], footL: [56, 107], kneeR: [78, 88], footR: [92, 107],
    },
    {
      head: [52, 32], sho: [52, 46], hip: [66, 66],
      elbowL: [42, 42], handL: [32, 34], elbowR: [44, 48], handR: [32, 46],
      kneeL: [58, 86], footL: [56, 107], kneeR: [82, 90], footR: [98, 107],
    },
  ],
  'overhead-reach': [
    mk({ elbowL: [57, 24], handL: [56, 12], elbowR: [63, 24], handR: [64, 12] }),
    mk({ head: [66, 22], sho: [64, 38], hip: [58, 66], elbowL: [66, 24], handL: [70, 14], elbowR: [60, 30], handR: [58, 18], kneeL: [54, 87], kneeR: [66, 87] }),
  ],
  neck: [mk({ head: [54, 20] }), mk({ head: [66, 20] })],
  bridge: [
    {
      head: [30, 96], sho: [42, 94], hip: [68, 95],
      elbowL: [38, 98], handL: [30, 99], elbowR: [40, 99], handR: [30, 100],
      kneeL: [84, 86], footL: [90, 100], kneeR: [84, 88], footR: [92, 100],
    },
    {
      head: [30, 96], sho: [43, 92], hip: [68, 80],
      elbowL: [38, 98], handL: [30, 99], elbowR: [40, 99], handR: [30, 100],
      kneeL: [84, 86], footL: [90, 100], kneeR: [84, 88], footR: [92, 100],
    },
  ],
  butterfly: [
    {
      head: [60, 48], sho: [60, 62], hip: [60, 86],
      elbowL: [52, 74], handL: [52, 86], elbowR: [68, 74], handR: [68, 86],
      kneeL: [44, 84], footL: [58, 94], kneeR: [76, 84], footR: [62, 94],
    },
    {
      head: [60, 50], sho: [60, 64], hip: [60, 86],
      elbowL: [52, 76], handL: [52, 88], elbowR: [68, 76], handR: [68, 88],
      kneeL: [40, 92], footL: [58, 94], kneeR: [80, 92], footR: [62, 94],
    },
  ],
  'downward-dog': [
    {
      head: [40, 70], sho: [44, 64], hip: [60, 46],
      elbowL: [37, 80], handL: [30, 98], elbowR: [39, 80], handR: [32, 98],
      kneeL: [74, 74], footL: [88, 98], kneeR: [76, 74], footR: [90, 98],
    },
    {
      head: [42, 72], sho: [44, 64], hip: [60, 42],
      elbowL: [37, 80], handL: [30, 98], elbowR: [39, 80], handR: [32, 98],
      kneeL: [74, 74], footL: [88, 98], kneeR: [76, 74], footR: [90, 98],
    },
  ],
};

/** Every figure kind, for pickers. */
export const FIGURE_KINDS = Object.keys(POSES) as FigureKind[];

export const FIGURE_LOOP = { duration: 2.6, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' } as const;
