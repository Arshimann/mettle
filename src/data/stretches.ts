import { Activity, Dumbbell, Move, PersonStanding, Sunrise, Wind, type LucideIcon } from 'lucide-react';

export interface Stretch {
  name: string;
  target: string;
  hold: string;
  steps: string;
}

export interface StretchCategory {
  id: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  stretches: Stretch[];
}

/** Guided hold length (seconds) parsed from a `hold` string; rep-based holds
 *  fall back to a sensible default so the routine player always has a timer. */
export function holdSeconds(hold: string): number {
  const m = hold.match(/(\d+)\s*s/i);
  return m ? Number(m[1]) : 30;
}

export const STRETCH_CATEGORIES: StretchCategory[] = [
  {
    id: 'posture',
    name: 'Posture reset',
    desc: 'Undo rounded shoulders, forward head, and a tilted pelvis.',
    icon: PersonStanding,
    stretches: [
      {
        name: 'Doorway chest opener',
        target: 'Chest · front shoulders',
        hold: '2 × 30s',
        steps: 'Place your forearms on a doorframe at shoulder height and step one foot through until you feel a stretch across the chest. Keep your ribs down.',
      },
      {
        name: 'Chin tuck',
        target: 'Deep neck flexors',
        hold: '10 reps',
        steps: 'Gently draw your head straight back to make a double chin, without tilting up or down. Hold two seconds, then release.',
      },
      {
        name: 'Wall angels',
        target: 'Upper back · shoulders',
        hold: '10 reps',
        steps: 'Stand with your back against a wall, arms in a goalpost shape. Slide your arms up and down while keeping wrists, elbows, and head on the wall.',
      },
      {
        name: 'Thoracic extension',
        target: 'Mid back',
        hold: '8 reps',
        steps: 'Sit on a chair with hands behind your head and gently arch back over the top edge of the chair to extend the upper spine.',
      },
      {
        name: 'Half-kneeling hip flexor stretch',
        target: 'Hip flexors',
        hold: '2 × 30s / side',
        steps: 'In a half-kneeling lunge, squeeze the back glute and push your hip forward. Avoid arching your lower back — the stretch should be in the front of the hip.',
      },
      {
        name: 'Glute bridge',
        target: 'Glutes · posterior chain',
        hold: '12 reps',
        steps: 'Lie on your back with feet flat, then drive through your heels to lift your hips until shoulders, hips, and knees line up. Squeeze hard at the top.',
      },
    ],
  },
  {
    id: 'hip-open',
    name: 'Hip opening',
    desc: 'Loosen tight hips and improve your squat depth.',
    icon: Move,
    stretches: [
      {
        name: '90/90 hip switch',
        target: 'Hip rotation',
        hold: '8 / side',
        steps: 'Sit with one leg bent in front at 90° and the other out to the side at 90°. Rotate both knees to switch sides slowly and under control.',
      },
      {
        name: 'Pigeon stretch',
        target: 'Glutes · outer hip',
        hold: '2 × 30s / side',
        steps: 'From all fours, bring one shin forward across your body and extend the other leg straight back. Fold your torso over the front shin.',
      },
      {
        name: 'Deep squat hold',
        target: 'Hips · ankles · groin',
        hold: '30–60s',
        steps: 'Sink into the bottom of a squat with heels flat. Use your elbows to gently press your knees outward and sit tall.',
      },
      {
        name: 'Butterfly stretch',
        target: 'Inner thigh · groin',
        hold: '2 × 30s',
        steps: 'Sit tall with the soles of your feet together and let your knees fall open. Hinge forward from the hips to go deeper.',
      },
      {
        name: 'Frog stretch',
        target: 'Adductors · inner hips',
        hold: '30–45s',
        steps: 'On all fours, widen your knees with shins in line behind them, then rock your hips back toward your heels.',
      },
      {
        name: 'Couch stretch',
        target: 'Hip flexors · quads',
        hold: '2 × 30s / side',
        steps: 'Kneel with your back foot propped up a wall and the other foot forward. Tuck your pelvis and ease your torso upright.',
      },
    ],
  },
  {
    id: 'hip-strength',
    name: 'Hip & glute strength',
    desc: 'Build the glutes and stabilizers that protect your hips and back.',
    icon: Dumbbell,
    stretches: [
      {
        name: 'Clamshell',
        target: 'Glute medius',
        hold: '3 × 15 / side',
        steps: 'Lie on your side with knees bent and feet stacked. Keep your feet together and open the top knee like a clam, without rolling your hips back.',
      },
      {
        name: 'Side-lying leg raise',
        target: 'Abductors',
        hold: '3 × 12 / side',
        steps: 'Lie on your side and raise the top leg straight up with the toe angled slightly down. Lower it slowly with control.',
      },
      {
        name: 'Monster walk',
        target: 'Glutes · abductors',
        hold: '2 × 10 steps',
        steps: 'With a band around your knees or ankles, sink into a quarter-squat and take controlled steps sideways, keeping constant tension.',
      },
      {
        name: 'Single-leg glute bridge',
        target: 'Glutes · hamstrings',
        hold: '3 × 8 / side',
        steps: 'Do a glute bridge driving through one heel with the other knee tucked toward your chest. Keep your hips level throughout.',
      },
      {
        name: 'Bird dog',
        target: 'Core · glutes',
        hold: '3 × 8 / side',
        steps: 'From all fours, extend the opposite arm and leg until level with your torso, then return slowly without letting your hips rotate.',
      },
    ],
  },
  {
    id: 'morning',
    name: 'Morning wake-up',
    desc: 'A gentle five-minute flow to loosen up for the day.',
    icon: Sunrise,
    stretches: [
      {
        name: 'Cat-cow',
        target: 'Spine',
        hold: '8 reps',
        steps: 'On all fours, alternate arching your back toward the ceiling and dropping your belly while you lift your gaze.',
      },
      {
        name: 'Standing forward fold',
        target: 'Hamstrings · lower back',
        hold: '30s',
        steps: 'Hinge at the hips and let your upper body hang with soft knees. Sway gently from side to side.',
      },
      {
        name: "Child's pose",
        target: 'Back · hips',
        hold: '30–45s',
        steps: 'Kneel and sit back on your heels, reaching your arms forward and resting your forehead on the floor.',
      },
      {
        name: 'Standing side bend',
        target: 'Obliques · lats',
        hold: '20s / side',
        steps: 'Reach one arm overhead and lean gently to the opposite side, keeping both feet planted.',
      },
      {
        name: 'Neck rolls',
        target: 'Neck',
        hold: '5 / direction',
        steps: 'Slowly circle your head, pausing wherever it feels tight. Keep the movement small and controlled.',
      },
      {
        name: 'Cobra',
        target: 'Abs · lower back',
        hold: '5 reps',
        steps: 'Lie face down and press your chest up with your hands, keeping your hips down and shoulders relaxed.',
      },
    ],
  },
  {
    id: 'lower-back',
    name: 'Lower-back relief',
    desc: 'Ease tension and decompress after sitting or heavy lifts.',
    icon: Activity,
    stretches: [
      {
        name: 'Knees to chest',
        target: 'Lower back',
        hold: '2 × 30s',
        steps: 'Lie on your back and hug both knees toward your chest, rocking gently from side to side.',
      },
      {
        name: 'Supine spinal twist',
        target: 'Spine · glutes',
        hold: '30s / side',
        steps: 'Lying down, drop both bent knees to one side while keeping your shoulders flat and arms out wide.',
      },
      {
        name: 'Sphinx',
        target: 'Lower back',
        hold: '30s',
        steps: 'Lie on your forearms with elbows under your shoulders and lift your chest into a gentle extension.',
      },
      {
        name: 'Seated figure-4',
        target: 'Glutes · piriformis',
        hold: '30s / side',
        steps: 'Sit tall and cross one ankle over the opposite knee, then hinge forward until you feel the outer hip open.',
      },
      {
        name: "Child's pose",
        target: 'Back · hips',
        hold: '45s',
        steps: 'Kneel, sit back on your heels, and reach your arms forward with your forehead resting on the floor. Breathe into your lower back.',
      },
    ],
  },
  {
    id: 'cooldown',
    name: 'Post-lift cooldown',
    desc: 'Wind down and stretch the muscles you just trained.',
    icon: Wind,
    stretches: [
      {
        name: 'Hamstring stretch',
        target: 'Hamstrings',
        hold: '30s / side',
        steps: 'Sit with one leg extended and reach toward your toes with a flat back, hinging at the hip rather than rounding.',
      },
      {
        name: 'Standing quad stretch',
        target: 'Quads',
        hold: '30s / side',
        steps: 'Pull one heel toward your glute with knees together. Hold a wall for balance and keep your hips forward.',
      },
      {
        name: 'Calf stretch',
        target: 'Calves',
        hold: '30s / side',
        steps: 'Press both hands on a wall and extend one leg back with the heel down until you feel the calf lengthen.',
      },
      {
        name: 'Cross-body shoulder',
        target: 'Rear delt · shoulder',
        hold: '30s / side',
        steps: 'Pull one straight arm across your chest with the opposite forearm and let the shoulder relax down.',
      },
      {
        name: 'Overhead triceps',
        target: 'Triceps · lats',
        hold: '30s / side',
        steps: 'Reach one hand down your back and gently press that elbow with the other hand.',
      },
    ],
  },
];
