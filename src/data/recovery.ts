import { Activity, Bone, Footprints, Hand, Move, PersonStanding } from 'lucide-react';
import type { StretchCategory } from './stretches';

/** Recovery is general mobility, not medical treatment. */
export const RECOVERY_DISCLAIMER =
  'General mobility to keep joints healthy and ease everyday aches — not medical advice. Stop if anything is sharp or painful, and see a professional for a real injury.';

/** Gentle, rehab-style mobility grouped by the area that tends to flare up. */
export const RECOVERY_CATEGORIES: StretchCategory[] = [
  {
    id: 'lower-back',
    name: 'Lower back',
    desc: 'Calm an achy back and restore gentle motion.',
    icon: Activity,
    stretches: [
      {
        name: 'Pelvic tilt',
        target: 'Lower spine · core',
        hold: '10 reps',
        steps: 'Lie on your back with knees bent and gently flatten your lower back into the floor by tilting your pelvis, then release. Slow and pain-free.',
        illustration: 'bridge',
      },
      {
        name: 'Single knee to chest',
        target: 'Lower back · glutes',
        hold: '30s / side',
        steps: 'Lying down, draw one knee toward your chest while the other foot stays planted. Keep your shoulders relaxed on the floor.',
        illustration: 'bridge',
      },
      {
        name: 'Cat-cow',
        target: 'Spine mobility',
        hold: '8 reps',
        steps: 'On all fours, slowly alternate arching and rounding your spine, moving only as far as feels comfortable.',
        illustration: 'cat-cow',
      },
      {
        name: "Child's pose",
        target: 'Lower back · hips',
        hold: '45s',
        steps: 'Kneel and sit back toward your heels with arms reaching forward, breathing into your lower back to let it decompress.',
        illustration: 'child-pose',
      },
    ],
  },
  {
    id: 'neck-shoulder',
    name: 'Neck & shoulders',
    desc: 'Release desk-and-phone tension up top.',
    icon: PersonStanding,
    stretches: [
      {
        name: 'Chin tuck',
        target: 'Deep neck flexors',
        hold: '10 reps',
        steps: 'Draw your head straight back into a gentle double chin without tipping up or down. Builds support for a forward-head posture.',
        illustration: 'neck',
      },
      {
        name: 'Neck side stretch',
        target: 'Upper traps',
        hold: '30s / side',
        steps: 'Gently tilt one ear toward your shoulder and let the opposite arm hang heavy. Breathe and let the trap lengthen.',
        illustration: 'neck',
      },
      {
        name: 'Shoulder rolls',
        target: 'Shoulders',
        hold: '10 / direction',
        steps: 'Roll your shoulders slowly up, back, and down in big circles, then reverse. Keep the neck relaxed.',
        illustration: 'overhead-reach',
      },
      {
        name: 'Wall slides',
        target: 'Upper back · shoulders',
        hold: '10 reps',
        steps: 'With your back to a wall and arms in a goalpost, slide them up and down while keeping contact, restoring overhead motion.',
        illustration: 'doorway',
      },
    ],
  },
  {
    id: 'hips',
    name: 'Hips',
    desc: 'Reset tight, cranky hips.',
    icon: Move,
    stretches: [
      {
        name: 'Glute bridge',
        target: 'Glutes · hips',
        hold: '12 reps',
        steps: 'Lie on your back and drive through your heels to lift your hips, squeezing your glutes at the top. Reactivates a sleepy posterior chain.',
        illustration: 'bridge',
      },
      {
        name: 'Figure-4 stretch',
        target: 'Glutes · piriformis',
        hold: '30s / side',
        steps: 'Cross one ankle over the opposite knee and draw the legs toward you (or hinge forward if seated) until the outer hip opens.',
        illustration: 'seated-fold',
      },
      {
        name: 'Half-kneeling hip flexor',
        target: 'Hip flexors',
        hold: '30s / side',
        steps: 'In a tall half-kneel, tuck your pelvis and ease forward until you feel the front of the back hip stretch. Avoid arching the back.',
        illustration: 'lunge',
      },
    ],
  },
  {
    id: 'knees',
    name: 'Knees',
    desc: 'Strengthen and mobilize around the knee.',
    icon: Bone,
    stretches: [
      {
        name: 'Quad set',
        target: 'Quads · knee',
        hold: '10 × 5s',
        steps: 'Sit with your leg straight and tighten your thigh to press the back of the knee down, holding briefly. Gentle activation, no load.',
        illustration: 'bridge',
      },
      {
        name: 'Straight-leg raise',
        target: 'Quads · hip flexors',
        hold: '3 × 10 / side',
        steps: 'Lying down with one knee bent, keep the other leg straight and lift it to the height of the bent knee, then lower slowly.',
        illustration: 'bridge',
      },
      {
        name: 'Heel slides',
        target: 'Knee range of motion',
        hold: '10 reps / side',
        steps: 'Lying down, slide one heel toward your glute to bend the knee as far as is comfortable, then straighten. Restores smooth motion.',
        illustration: 'bridge',
      },
      {
        name: 'Standing quad stretch',
        target: 'Quads',
        hold: '30s / side',
        steps: 'Hold a wall and pull one heel toward your glute with knees together and hips pressed slightly forward.',
        illustration: 'quad-pull',
      },
    ],
  },
  {
    id: 'wrist-elbow',
    name: 'Wrists & elbows',
    desc: 'Counter grip work and keyboard strain.',
    icon: Hand,
    stretches: [
      {
        name: 'Wrist flexor stretch',
        target: 'Forearm flexors',
        hold: '30s / side',
        steps: 'Extend one arm with the palm up and gently pull the fingers back toward you with the other hand until the underside of the forearm stretches.',
        illustration: 'doorway',
      },
      {
        name: 'Wrist extensor stretch',
        target: 'Forearm extensors',
        hold: '30s / side',
        steps: 'Extend one arm with the palm down and gently press the back of the hand toward you to stretch the top of the forearm.',
        illustration: 'doorway',
      },
      {
        name: 'Prayer stretch',
        target: 'Wrists',
        hold: '3 × 20s',
        steps: 'Press your palms together in front of your chest and lower your hands while keeping the palms touching until the wrists open.',
        illustration: 'overhead-reach',
      },
    ],
  },
  {
    id: 'ankles',
    name: 'Ankles',
    desc: 'Keep ankles springy and stable.',
    icon: Footprints,
    stretches: [
      {
        name: 'Calf stretch',
        target: 'Calves · achilles',
        hold: '30s / side',
        steps: 'Press both hands on a wall and step one foot back with the heel down and knee straight until the calf lengthens.',
        illustration: 'calf-wall',
      },
      {
        name: 'Ankle circles',
        target: 'Ankle mobility',
        hold: '10 / direction',
        steps: 'Lift one foot and slowly trace large circles with your toes in both directions to oil the joint.',
        illustration: 'stand',
      },
      {
        name: 'Wall dorsiflexion',
        target: 'Ankle range',
        hold: '10 reps / side',
        steps: 'In a short lunge facing a wall, drive your front knee forward over your toes, keeping the heel down, then return. Improves squat-depth motion.',
        illustration: 'lunge',
      },
    ],
  },
];
