import {
  Activity,
  Bed,
  Flame,
  Layers,
  Ruler,
  Scale,
  type LucideIcon,
} from 'lucide-react';

/**
 * The Playbook: six sections, each a ladder of levels that unlock as you read.
 * Level 1 assumes nothing; level 3 assumes the vocabulary the earlier levels
 * built. Content is evidence-led and says plainly when something is uncertain.
 */

export type PlaybookSectionId =
  | 'principles'
  | 'volume'
  | 'intensity'
  | 'rest'
  | 'recovery'
  | 'technique';

export interface PlaybookBlock {
  kind: 'p' | 'h' | 'list';
  text?: string;
  items?: string[];
}

export interface PlaybookArticle {
  /** Stable forever — it's the read-progress key. Never renumber. */
  id: string;
  title: string;
  summary: string;
  minutes: number;
  blocks: PlaybookBlock[];
  takeaways: string[];
  sources: string[];
}

export interface PlaybookLevel {
  level: 1 | 2 | 3;
  title: string;
  blurb: string;
  articles: PlaybookArticle[];
}

export interface PlaybookSection {
  id: PlaybookSectionId;
  title: string;
  tagline: string;
  icon: LucideIcon;
  levels: PlaybookLevel[];
}

const p = (text: string): PlaybookBlock => ({ kind: 'p', text });
const h = (text: string): PlaybookBlock => ({ kind: 'h', text });
const list = (items: string[]): PlaybookBlock => ({ kind: 'list', items });

export const PLAYBOOK: PlaybookSection[] = [
  // ─────────────────────────────── PRINCIPLES ───────────────────────────────
  {
    id: 'principles',
    title: 'Principles',
    tagline: 'The rules everything else hangs off',
    icon: Layers,
    levels: [
      {
        level: 1,
        title: 'Foundations',
        blurb: 'What actually makes a muscle grow',
        articles: [
          {
            id: 'principles.1.overload',
            title: 'Progressive overload',
            summary: 'The one rule that survives every training argument',
            minutes: 3,
            blocks: [
              p('A muscle grows when it is asked to do more than it is used to. That is the whole mechanism. Everything else — split design, exercise selection, tempo, rest periods — exists to let you keep asking for more, week after week, without breaking.'),
              p('"More" is not only heavier. Over a training block you can add weight, add reps at the same weight, add sets, improve control, or shorten rest while holding output. Each is a valid way to overload, and the useful ones change as you become more advanced.'),
              h('Why beginners progress so fast'),
              p('Early progress is mostly neural. Your nervous system gets better at recruiting the muscle you already have — the fibres coordinate, the movement stops feeling foreign, and the weight climbs quickly. That phase is real, but it ends. When it does, progress becomes a slower business of accumulating tissue, and the training has to get more deliberate.'),
              h('The trap'),
              p('Most people stall not because their program is wrong but because they never actually track whether they are doing more than last time. If you cannot answer "what did I lift for this last week", you cannot know whether you overloaded. Logging is not admin — it is the feedback loop that makes the principle usable.'),
            ],
            takeaways: [
              'Do more over time than you did before — that is the mechanism.',
              '"More" can be weight, reps, sets, or control.',
              'Early progress is largely neural and will slow down. That is normal, not failure.',
            ],
            sources: ['Schoenfeld, Mechanisms of muscle hypertrophy (2010)'],
          },
          {
            id: 'principles.1.specificity',
            title: 'Specificity',
            summary: 'You get good at what you actually do',
            minutes: 3,
            blocks: [
              p('Adaptation is specific to the demand. Train heavy triples and you get better at heavy triples. Train sets of fifteen and you build work capacity in that range. There is overlap — strength and size feed each other — but the closer your training is to your goal, the more of the adaptation transfers.'),
              h('What this means in practice'),
              p('If you want a bigger squat, squatting has to be in your week, not just leg press. If you want a bigger chest, the chest needs direct volume in ranges you can control. And if you want both strength and size, you do not have to choose — you sequence them, or split them within a week.'),
              h('The honest limit'),
              p('Specificity is why "the best exercise" is a question with no universal answer. The best exercise is the one that trains the thing you want, that you can load progressively, and that does not hurt. Those three filters eliminate most arguments.'),
            ],
            takeaways: [
              'Adaptation follows the specific demand you place on the body.',
              'Pick exercises you can load progressively and perform without pain.',
              'Strength and size overlap — you rarely have to choose one.',
            ],
            sources: ['Principle of specificity — standard exercise physiology'],
          },
        ],
      },
      {
        level: 2,
        title: 'Practitioner',
        blurb: 'Structuring months, not sessions',
        articles: [
          {
            id: 'principles.2.periodisation',
            title: 'Periodisation without the jargon',
            summary: 'Why you cannot push hard forever',
            minutes: 4,
            blocks: [
              p('Periodisation is planned variation. You cannot add weight to the bar every session indefinitely, so instead of pretending you can, you plan the rise and the back-off in advance.'),
              h('The simplest version that works'),
              p('Run three to five weeks where volume or intensity creeps up, then take a lighter week. During the lighter week you keep training, keep the movements, and cut the hard sets roughly in half or drop the load meaningfully. You are not stopping — you are letting accumulated fatigue drain so the work you did can express itself as progress.'),
              p('Most people discover this by accident: they get run down, take a week off, come back and hit a personal best. Planning it turns that accident into a system.'),
              h('When to deload'),
              list([
                'Performance drops across several lifts for more than a session or two.',
                'Warm-up weights feel heavier than usual.',
                'Sleep and appetite are off, and motivation has gone flat.',
                'Or simply: it has been four to six hard weeks.',
              ]),
              p('Note that these signs overlap with life stress. Fatigue does not care whether it came from the gym or from work — it accumulates in the same body.'),
            ],
            takeaways: [
              'Plan the back-off week instead of waiting for your body to force one.',
              'A deload keeps the movements and cuts hard sets or load.',
              'Three to five hard weeks, then one lighter, is a defensible default.',
            ],
            sources: ['Standard periodisation models (linear, undulating)'],
          },
        ],
      },
      {
        level: 3,
        title: 'Deep cut',
        blurb: 'Individual variation and honest uncertainty',
        articles: [
          {
            id: 'principles.3.individual',
            title: 'Why the same program gets different results',
            summary: 'Responders, non-responders, and what you control',
            minutes: 4,
            blocks: [
              p('Give twenty people an identical program and the range of results is wide. Some add noticeable muscle in twelve weeks; a few barely change. This is measured repeatedly, and it is not a motivation problem.'),
              h('What differs'),
              list([
                'Baseline training age — the less trained you are, the more room there is.',
                'Recovery capacity, driven heavily by sleep and total food.',
                'Genetics: muscle fibre proportions, tendon insertions, hormonal environment.',
                'Life stress, which quietly taxes the same recovery budget training does.',
              ]),
              h('What follows from it'),
              p('Comparing your rate of progress to someone else\'s is close to meaningless. Comparing your current numbers to your own numbers from three months ago is the only comparison that carries information. This is also why "the program that worked for that lifter" is weak evidence — you are not running the same experiment.'),
              p('The uncomfortable part: you control training, sleep, and food. You do not control your response rate. Doing the controllables well is the whole job.'),
            ],
            takeaways: [
              'Response to identical training varies enormously between people.',
              'Compare yourself to your own logs, not to other lifters.',
              'Control training, sleep, and food; the rest is not yours to control.',
            ],
            sources: ['Hubal et al., variability in muscle size and strength gain (2005)'],
          },
        ],
      },
    ],
  },

  // ───────────────────────────────── VOLUME ─────────────────────────────────
  {
    id: 'volume',
    title: 'Volume',
    tagline: 'How much work, and where to put it',
    icon: Scale,
    levels: [
      {
        level: 1,
        title: 'Foundations',
        blurb: 'Counting what matters',
        articles: [
          {
            id: 'volume.1.hardsets',
            title: 'Hard sets are the unit',
            summary: 'The number worth counting, and the number to ignore',
            minutes: 3,
            blocks: [
              p('The most useful measure of training volume is the number of hard sets a muscle does per week. A hard set means genuine effort — roughly the last few reps are difficult and you are within a couple of reps of failure.'),
              p('Sets taken well short of that still count for something, but not much, and counting them inflates your sense of how much work you are doing. This is the single most common reason people think they are training a muscle hard when they are not.'),
              h('Rough weekly ranges'),
              p('Around ten hard sets per muscle per week is a solid working target for most people, with useful results anywhere from about six to twenty. Bigger muscles that get hit by compounds tolerate more; small isolation muscles need far less than people assume.'),
              h('Counting indirect work'),
              p('Your triceps work on every press and your biceps on every row. Mettle counts this as partial credit rather than ignoring it, which is why your front delts can quietly accumulate a lot of volume without a single dedicated exercise — and why they are so often the most over-trained region on a chest-and-shoulder heavy program.'),
            ],
            takeaways: [
              'Count hard sets per muscle per week, not total sets performed.',
              'About ten hard sets a week per muscle is a reasonable target.',
              'Indirect work is real work — presses train triceps and front delts.',
            ],
            sources: ['Schoenfeld et al., dose–response of weekly sets (2017)'],
          },
        ],
      },
      {
        level: 2,
        title: 'Practitioner',
        blurb: 'Finding your own ceiling',
        articles: [
          {
            id: 'volume.2.landmarks',
            title: 'Minimum, maximum, and the space between',
            summary: 'How much is enough, and how much is too much',
            minutes: 4,
            blocks: [
              p('There is a floor below which a muscle does not grow, a range where it grows well, and a ceiling above which more work stops helping and starts costing you recovery. Those three landmarks differ per muscle and per person, and they move as you get more trained.'),
              h('Finding your range'),
              p('Start at the lower end of a sensible range and add a set or two per muscle per week over a block. Watch two things: whether performance is still improving, and whether you are recovering between sessions. When adding volume stops producing progress, you have found the top of your useful range for now.'),
              h('The ceiling is not fixed'),
              p('More volume is only better if you can recover from it. Sleep, food, and life stress set that ceiling, which is why the same lifter tolerates far more volume on holiday than during a brutal work month. Volume you cannot recover from is not training — it is just fatigue.'),
              h('Small muscles'),
              p('Rear delts, calves, forearms and abs do not need the same volume as quads or lats. Piling twenty sets a week onto a small isolation muscle is a common way to waste effort and accumulate junk fatigue. A few focused sets, done well, twice a week, does the job.'),
            ],
            takeaways: [
              'Add volume gradually and watch whether progress continues.',
              'Your ceiling is set by recovery, not by ambition.',
              'Small isolation muscles need far less volume than large ones.',
            ],
            sources: ['Volume landmark frameworks; dose–response literature'],
          },
        ],
      },
      {
        level: 3,
        title: 'Deep cut',
        blurb: 'Distribution and diminishing returns',
        articles: [
          {
            id: 'volume.3.frequency',
            title: 'Spreading volume across the week',
            summary: 'Same sets, different distribution',
            minutes: 3,
            blocks: [
              p('If a muscle is going to get twelve hard sets a week, it generally does better split across two or three sessions than crammed into one. Quality drops sharply deep into a single session — the last sets of a sixteen-set chest day are not doing what the first ones did.'),
              p('Beyond about two sessions per muscle per week, the added benefit of more frequency is small, provided total volume is matched. Frequency is mostly a tool for fitting volume in with good quality, not a magic variable of its own.'),
              h('Practical reading'),
              p('If your weekly totals look right but a muscle is not progressing, look at how those sets are distributed before adding more of them.'),
            ],
            takeaways: [
              'Split a muscle\'s weekly volume across two or three sessions.',
              'Frequency mostly serves volume quality, not a separate adaptation.',
              'Check distribution before adding more total sets.',
            ],
            sources: ['Schoenfeld et al., training frequency meta-analysis (2016)'],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────── INTENSITY ───────────────────────────────
  {
    id: 'intensity',
    title: 'Intensity',
    tagline: 'How hard, and how close to failure',
    icon: Flame,
    levels: [
      {
        level: 1,
        title: 'Foundations',
        blurb: 'Effort, measured honestly',
        articles: [
          {
            id: 'intensity.1.rir',
            title: 'Reps in reserve',
            summary: 'A usable way to talk about effort',
            minutes: 3,
            blocks: [
              p('Reps in reserve is how many more reps you could have done before failing. Stopping with two in the tank is RIR 2. Going to the point where the bar stops moving is RIR 0.'),
              p('Most productive training happens between roughly RIR 0 and RIR 3. Sets ending with four or more left in the tank contribute little to growth for an experienced lifter, though they are perfectly useful as warm-ups or technique practice.'),
              h('The estimation problem'),
              p('Untrained lifters are famously bad at judging RIR — typically stopping much further from failure than they think. This corrects with experience, and the fastest way to calibrate is to occasionally take an isolation exercise genuinely to failure and see how far off your estimate was.'),
            ],
            takeaways: [
              'Train most working sets within about three reps of failure.',
              'Novices usually stop further from failure than they believe.',
              'Calibrate occasionally by taking a safe isolation set to true failure.',
            ],
            sources: ['Zourdos et al., RIR-based RPE scale (2016)'],
          },
        ],
      },
      {
        level: 2,
        title: 'Practitioner',
        blurb: 'Spending effort where it pays',
        articles: [
          {
            id: 'intensity.2.failure',
            title: 'When training to failure is worth it',
            summary: 'And when it just costs you the next session',
            minutes: 4,
            blocks: [
              p('Training to failure grows muscle. So does stopping a rep or two short. The difference in growth is small; the difference in fatigue is not.'),
              h('The trade'),
              p('Failure on a heavy compound is expensive. A failed set of squats or deadlifts taxes your recovery for days and raises injury risk as form degrades under maximum effort. Failure on a cable curl or leg extension costs almost nothing by comparison.'),
              p('So the sensible policy is asymmetric: keep one to three reps in reserve on the big compounds, and take isolation work close to or at failure where it is cheap and safe.'),
              h('Where failure genuinely helps'),
              p('At low loads — sets of twenty or more — getting close to failure matters more, because the lighter the weight, the further you have to go before high-threshold fibres are recruited. Light sets stopped early do very little.'),
            ],
            takeaways: [
              'Keep reps in reserve on heavy compounds; failure there is expensive.',
              'Take isolation work close to failure — it is cheap and safe.',
              'The lighter the load, the closer to failure you need to be.',
            ],
            sources: ['Grgic et al., training to failure meta-analysis (2021)'],
          },
        ],
      },
      {
        level: 3,
        title: 'Deep cut',
        blurb: 'Rep ranges and what they buy',
        articles: [
          {
            id: 'intensity.3.reprange',
            title: 'Do rep ranges matter for growth?',
            summary: 'Less than you were told, but not zero',
            minutes: 4,
            blocks: [
              p('For hypertrophy, anything from about five to thirty reps per set produces similar growth when sets are taken close enough to failure. The classic "eight to twelve for size" is a reasonable default, not a biological rule.'),
              h('So why not train however you like?'),
              p('Because the ranges differ in cost. Heavy low-rep sets are joint and nervous-system intensive. Very high-rep sets are deeply unpleasant and limited by burning discomfort rather than muscular capacity. The middle ranges let you accumulate quality volume with tolerable cost, which is why they dominate in practice.'),
              h('Where load does matter'),
              p('Maximal strength is more load-specific. If a heavy single or triple is your goal, you have to train heavy, because you are training a skill as much as a tissue.'),
            ],
            takeaways: [
              'Roughly 5–30 reps builds similar muscle if effort is high enough.',
              'Middle ranges dominate because their cost-to-benefit is best.',
              'Maximal strength genuinely requires heavy, specific practice.',
            ],
            sources: ['Schoenfeld et al., load and hypertrophy meta-analysis (2017)'],
          },
        ],
      },
    ],
  },

  // ────────────────────────────────── REST ──────────────────────────────────
  {
    id: 'rest',
    title: 'Rest',
    tagline: 'Between sets, between sessions',
    icon: Activity,
    levels: [
      {
        level: 1,
        title: 'Foundations',
        blurb: 'How long to sit between sets',
        articles: [
          {
            id: 'rest.1.between-sets',
            title: 'Rest periods',
            summary: 'Short rest is not more efficient than it looks',
            minutes: 3,
            blocks: [
              p('Resting longer between sets lets you perform more reps at a given weight, and more total reps means more stimulus. The old idea that short rest periods build more muscle by driving a hormonal response has not held up.'),
              h('Usable defaults'),
              list([
                'Heavy compounds: two to five minutes. You want the next set to be genuine.',
                'Moderate accessory work: about ninety seconds to two minutes.',
                'Small isolation work: sixty to ninety seconds is usually plenty.',
              ]),
              p('If you are cutting rest to save time, cut it on the isolation work at the end, not on the heavy lift at the start — that is where the trade costs you the most.'),
            ],
            takeaways: [
              'Longer rest means more quality reps, which means more stimulus.',
              'Two to five minutes on heavy compounds; less on isolation.',
              'Save time at the end of a session, not on the main lift.',
            ],
            sources: ['Schoenfeld et al., rest interval and hypertrophy (2016)'],
          },
        ],
      },
      {
        level: 2,
        title: 'Practitioner',
        blurb: 'Rest days and how many you need',
        articles: [
          {
            id: 'rest.2.rest-days',
            title: 'Rest days are training days',
            summary: 'The adaptation happens when you stop',
            minutes: 3,
            blocks: [
              p('Training is the stimulus; the adaptation happens afterwards, while you rest and eat. Skipping rest does not accelerate anything — it just accumulates fatigue that eventually forces a longer break than the one you avoided.'),
              h('How many'),
              p('Most people training seriously do well with three to five training days a week and the rest genuinely off or very light. Higher frequencies work, but only if per-session volume drops so that total weekly work stays recoverable.'),
              h('Active rest'),
              p('Walking, easy cycling, mobility work and stretching on off days are fine and often help — blood flow without meaningful fatigue. What is not a rest day is a "light" session that quietly becomes a hard one.'),
            ],
            takeaways: [
              'Adaptation happens during rest, not during the session.',
              'Three to five hard days a week suits most people.',
              'Easy movement on off days is fine; a secretly hard session is not.',
            ],
            sources: ['Recovery and supercompensation literature'],
          },
        ],
      },
      {
        level: 3,
        title: 'Deep cut',
        blurb: 'Time off without losing progress',
        articles: [
          {
            id: 'rest.3.detraining',
            title: 'What you actually lose when you stop',
            summary: 'Less than you fear, and it comes back fast',
            minutes: 3,
            blocks: [
              p('A week completely off costs essentially nothing in muscle. Strength holds for around two to three weeks. Noticeable muscle loss takes considerably longer than most lifters believe, and even then the tissue returns far faster the second time.'),
              h('Muscle memory is real'),
              p('Trained muscle keeps structural changes — including additional nuclei within muscle fibres — that appear to persist long after size is lost. This is the best current explanation for why regaining old muscle is dramatically faster than building it the first time.'),
              h('Practical reading'),
              p('An illness, a holiday, or a busy fortnight is not a catastrophe. Coming back cautiously — reducing weight, rebuilding volume over a couple of weeks — costs a fraction of what an injury from rushing back does.'),
            ],
            takeaways: [
              'A week off costs almost nothing; strength holds two to three weeks.',
              'Regaining lost muscle is much faster than building it initially.',
              'Return gradually — rushing back is how comebacks turn into injuries.',
            ],
            sources: ['Gundersen, muscle memory and myonuclei (2016)'],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────── RECOVERY ────────────────────────────────
  {
    id: 'recovery',
    title: 'Recovery',
    tagline: 'Sleep, food, hormones, stress',
    icon: Bed,
    levels: [
      {
        level: 1,
        title: 'Foundations',
        blurb: 'The two that outrank everything',
        articles: [
          {
            id: 'recovery.1.sleep',
            title: 'Sleep is the training variable',
            summary: 'Nothing you buy competes with it',
            minutes: 3,
            blocks: [
              p('Sleep is the highest-leverage recovery input there is, and the one most often traded away. Restricting sleep to around five hours measurably reduces strength, lowers testosterone in young men within a week, raises perceived effort, and impairs the fat-loss-to-muscle-retention ratio when dieting.'),
              h('What good looks like'),
              list([
                'Seven to nine hours, consistently — regularity matters as much as duration.',
                'A dark, cool room. Light exposure at night is a genuine disruptor.',
                'Consistent wake time, including weekends, which anchors the whole rhythm.',
                'Caffeine has a half-life of around five to six hours — an afternoon coffee is still working at bedtime.',
              ]),
              p('If you are choosing between an extra hour of training and an extra hour of sleep, the sleep usually wins.'),
            ],
            takeaways: [
              'Seven to nine hours, consistently, beats any supplement.',
              'Short sleep lowers strength and testosterone within days.',
              'Regular wake time and a dark, cool room do most of the work.',
            ],
            sources: ['Leproult & Van Cauter, sleep restriction and testosterone (2011)'],
          },
          {
            id: 'recovery.1.protein',
            title: 'Protein and total food',
            summary: 'Enough of both, then stop worrying',
            minutes: 3,
            blocks: [
              p('Around 1.6 grams of protein per kilogram of bodyweight per day covers essentially everyone training for muscle. Going higher is not harmful, but measurable extra benefit above roughly 2.2 g/kg has not been shown.'),
              h('Distribution matters less than the total'),
              p('Spreading protein across three to five meals is slightly better than one enormous serving, but the total across the day is the variable that carries the weight. The much-discussed "anabolic window" after training is far wider than the thirty-minute panic it was sold as.'),
              h('Total calories decide the direction'),
              p('You cannot out-protein an inadequate diet. In a meaningful deficit, muscle gain slows to near zero for most trained lifters — protein and training then serve to protect what you have, which is a perfectly good goal, just a different one.'),
            ],
            takeaways: [
              'Roughly 1.6 g of protein per kg of bodyweight per day is enough.',
              'Daily total matters far more than precise meal timing.',
              'In a deficit, expect to maintain muscle rather than build it.',
            ],
            sources: ['Morton et al., protein supplementation meta-analysis (2018)'],
          },
        ],
      },
      {
        level: 2,
        title: 'Practitioner',
        blurb: 'Hormones and lifestyle, without the nonsense',
        articles: [
          {
            id: 'recovery.2.hormones',
            title: 'Optimising your hormones, honestly',
            summary: 'What actually moves the needle, and what is sold to you',
            minutes: 5,
            blocks: [
              p('Hormonal "optimisation" is the most oversold topic in fitness. The genuinely effective levers are unglamorous and free, and they are the same ones that improve everything else.'),
              h('What is well supported'),
              list([
                'Sleep. Restricting young men to five hours a night for one week lowered daytime testosterone by 10–15%. No legal supplement approaches that effect size.',
                'Body composition. Excess body fat raises conversion of testosterone to oestrogen; getting to a healthier body fat range reliably improves the profile in men who were carrying excess.',
                'Enough food. Chronic aggressive dieting suppresses testosterone and thyroid output. Very low fat intake specifically tends to reduce testosterone.',
                'Resistance training itself, and not overreaching to the point of chronic fatigue.',
                'Managing chronic stress. Sustained high cortisol works against the same processes you train for.',
              ]),
              h('What is mostly noise'),
              p('The acute testosterone spike from a hard session is real, small, and transient — and it has not been shown to drive muscle growth. Training design aimed at "maximising the hormonal response" is chasing a signal that does not appear to matter. Meanwhile most testosterone-boosting supplements show no meaningful effect in healthy men; the exception is correcting a genuine deficiency, such as vitamin D or zinc if you are actually low.'),
              h('The honest framing'),
              p('If your sleep, body composition, food intake and stress are handled, your hormones are close to as good as lifestyle can make them. If they are not handled, no supplement will compensate. And if you suspect a genuine clinical problem, that is a conversation with a doctor and a blood test — not a purchase.'),
            ],
            takeaways: [
              'Sleep, body fat, adequate food and stress are the real levers.',
              'The post-workout testosterone spike does not drive growth.',
              'Supplements only help if they correct an actual deficiency.',
              'Suspected clinical issues need a doctor, not a stack.',
            ],
            sources: [
              'Leproult & Van Cauter (2011)',
              'West & Phillips, hormone response and hypertrophy (2012)',
            ],
          },
        ],
      },
      {
        level: 3,
        title: 'Deep cut',
        blurb: 'Height, posture, and what training can change',
        articles: [
          {
            id: 'recovery.3.height',
            title: 'The real science of getting taller',
            summary: 'What changes, what does not, and why the myths persist',
            minutes: 5,
            blocks: [
              p('This one deserves straight talk, because it is surrounded by more marketing than almost any other topic in training.'),
              h('How height is actually determined'),
              p('Long bones grow at growth plates — cartilage regions near the ends of bones. Through childhood and adolescence these plates add length. Toward the end of puberty, driven largely by sex hormones, they fuse into solid bone. Once fused, the bone cannot lengthen again. For most people this completes somewhere in the late teens to early twenties.'),
              p('Height is mostly genetic — twin studies put heritability around 80%. The remaining variance is dominated by nutrition and health during childhood, which is why average heights rise across generations as childhood nutrition improves.'),
              h('If your plates have not closed yet'),
              p('Adequate total calories, sufficient protein, enough sleep, and general health let you reach your genetic potential. You cannot exceed it. Nothing accelerates growth beyond it, and attempts to force it are not benign.'),
              h('If your plates have closed'),
              p('No exercise, stretch, supplement, or hanging routine lengthens bone. Anyone selling that is selling a myth. Limb-lengthening surgery exists, is major orthopaedic surgery with a long and difficult recovery, and is the only genuine intervention.'),
              h('So why do people measure taller after stretching?'),
              p('Because a real, temporary change is happening — just not in your bones. Spinal discs compress under load and through the day, and decompress with rest and positional work. Most people are measurably shorter in the evening than the morning, typically by around a centimetre or two. Hanging, decompression work and lying down restore some of that within a day. It is genuine, it is transient, and it is not bone growth.'),
              h('What is permanent and worth doing'),
              p('Posture is the honest opportunity. A habitually slumped thoracic spine and forward head position cost real, visible height that you can recover and keep. Strengthening the upper back, mobilising the thoracic spine, and stretching chronically tight hip flexors and chest can restore height you already have and were not standing in. That is not a trick — it is the difference between your actual stature and your habitual one.'),
            ],
            takeaways: [
              'Bones lengthen only at growth plates, which fuse after puberty.',
              'Height is roughly 80% genetic; childhood nutrition explains most of the rest.',
              'After fusion, nothing lengthens bone — spinal decompression is real but temporary.',
              'Posture work recovers real height you already have, permanently.',
            ],
            sources: [
              'Growth plate physiology (epiphyseal fusion)',
              'Silventoinen et al., heritability of adult height (2003)',
            ],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────── TECHNIQUE ────────────────────────────────
  {
    id: 'technique',
    title: 'Technique',
    tagline: 'Moving well enough to keep training',
    icon: Ruler,
    levels: [
      {
        level: 1,
        title: 'Foundations',
        blurb: 'Range, control, and tension',
        articles: [
          {
            id: 'technique.1.rom',
            title: 'Range of motion',
            summary: 'Why partial reps cost you more than they save',
            minutes: 3,
            blocks: [
              p('Training a muscle through a full range generally builds more of it than training through a partial one — particularly the stretched portion of the movement, which appears to be an unusually potent stimulus.'),
              h('The stretched position'),
              p('Exercises that load a muscle while it is lengthened tend to punch above their weight: deep squats for quads, Romanian deadlifts for hamstrings, incline curls for the long head of the biceps, overhead extensions for triceps. If you have limited time, prioritise the movements that load the stretch.'),
              h('When partials earn their place'),
              p('Lengthened partials — working the bottom portion of a movement after full reps are gone — are a legitimate intensity technique. That is a deliberate choice at the end of a set, not the same thing as habitually cutting depth because the weight is too heavy.'),
            ],
            takeaways: [
              'Full range beats partial range for growth in most cases.',
              'Loading the stretched position is especially effective.',
              'Deliberate lengthened partials are useful; ego-driven half reps are not.',
            ],
            sources: ['Pedrosa et al., range of motion and hypertrophy (2022)'],
          },
        ],
      },
      {
        level: 2,
        title: 'Practitioner',
        blurb: 'Bracing and staying uninjured',
        articles: [
          {
            id: 'technique.2.bracing',
            title: 'Bracing and spinal position',
            summary: 'How to not get hurt under a heavy bar',
            minutes: 4,
            blocks: [
              p('Under heavy load your torso has to behave like a rigid cylinder. That is what bracing means: taking a breath into the belly, not the chest, and tensing the abdominal wall outward against it. Hold it for the rep, breathe between reps.'),
              h('Neutral spine'),
              p('A roughly neutral spine distributes load across structures designed to take it. The instruction is not "flat" or "arched" but "keep the shape you started with". Losing position under load — a rounding back late in a deadlift, a collapsing chest in a squat — is the signal that the set is over.'),
              h('Belts'),
              p('A belt gives your abdominal wall something to brace against and modestly increases what you can lift. It is not a substitute for bracing, and it does not make a bad position safe. Most people only need one for genuinely heavy compound work.'),
              h('Pain'),
              p('Discomfort under effort is normal. Sharp, localised, or joint-line pain is not, and training through it is how a manageable problem becomes a long one. Stop the set, not just the rep.'),
            ],
            takeaways: [
              'Brace into the belly and hold position for the rep.',
              'Losing spinal position means the set is finished.',
              'A belt supports bracing; it does not replace it.',
              'Sharp or joint pain means stop — not push through.',
            ],
            sources: ['Standard strength coaching practice; intra-abdominal pressure research'],
          },
        ],
      },
      {
        level: 3,
        title: 'Deep cut',
        blurb: 'Tempo and the mind–muscle connection',
        articles: [
          {
            id: 'technique.3.tempo',
            title: 'Tempo, control, and focus',
            summary: 'What is worth controlling and what is fussing',
            minutes: 3,
            blocks: [
              p('Lowering the weight under control matters — it is where a large part of the stimulus and most of the muscle damage comes from. Deliberately grinding out five-second negatives on everything, however, mostly reduces the load and volume you can handle.'),
              h('A reasonable default'),
              p('Control the lowering over roughly two seconds, then lift with intent. Trying to move the weight quickly on the way up, even when the bar itself moves slowly because it is heavy, recruits more high-threshold motor units than lifting lazily.'),
              h('Mind–muscle connection'),
              p('Consciously focusing on the working muscle measurably increases its activation, and there is evidence this translates into growth for isolation work. On heavy compounds the better cue is usually external and task-focused — drive the floor away, push the bar to the ceiling — because that produces more force.'),
            ],
            takeaways: [
              'Control the lowering; lift with intent to move fast.',
              'Internal focus suits isolation work; external cues suit heavy compounds.',
              'Extreme slow tempos cost more load and volume than they return.',
            ],
            sources: ['Schoenfeld et al., attentional focus and hypertrophy (2018)'],
          },
        ],
      },
    ],
  },
];

export const ALL_ARTICLES: PlaybookArticle[] = PLAYBOOK.flatMap((s) =>
  s.levels.flatMap((l) => l.articles),
);

export const ARTICLE_INDEX = new Map(
  PLAYBOOK.flatMap((section) =>
    section.levels.flatMap((level) =>
      level.articles.map((article) => [article.id, { section, level, article }] as const),
    ),
  ),
);
