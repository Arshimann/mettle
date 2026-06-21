export interface Lesson {
  title: string;
  tag: string;
  body: string;
}

/** Bite-size, original training lessons shown in the Learn tab. */
export const LESSONS: Lesson[] = [
  {
    title: 'Progressive overload is the whole game',
    tag: 'Principles',
    body: 'Muscles adapt to a demand they have already met. To keep changing, the demand has to keep rising — a little more weight, a rep or two more, or a cleaner, harder set than last time. Track it so "a little more" is a fact, not a feeling.',
  },
  {
    title: 'Most growth lives between 5 and 30 reps',
    tag: 'Hypertrophy',
    body: 'As long as a set ends within a few reps of failure, a wide rep range builds muscle. Use heavier, lower-rep work for joints that like it and higher reps where heavy load is awkward or risky.',
  },
  {
    title: 'Leave one or two reps in the tank — usually',
    tag: 'Intensity',
    body: 'Training close to failure drives adaptation, but going to true failure on every set just digs a recovery hole. Save all-out efforts for your last set of an exercise or for moves where failing is safe.',
  },
  {
    title: 'Weekly sets per muscle matter more than any single workout',
    tag: 'Volume',
    body: 'Roughly 10–20 hard sets per muscle per week is a productive range for most people. Spread them across two-plus sessions so each one is fresh enough to be hard.',
  },
  {
    title: 'Rest long enough to do the next set justice',
    tag: 'Rest',
    body: 'For heavy compounds, 2–3 minutes lets strength recover so the next set is genuinely hard for the right reason. Small isolation moves can run on shorter rest. Rushing big lifts just lowers the weight you can use.',
  },
  {
    title: 'Protein and sleep do the building',
    tag: 'Recovery',
    body: 'Training is the signal; food and sleep are the construction crew. Aim for roughly 1.6–2.2 g of protein per kg of bodyweight a day and protect 7–9 hours of sleep. Skimp on either and the training spins its wheels.',
  },
  {
    title: 'Estimated 1RM tracks strength without max-out risk',
    tag: 'Metrics',
    body: 'A set of 5 at a given weight predicts your one-rep max closely. Watching that estimate climb over weeks is a safer, smoother strength signal than constantly testing true maxes.',
  },
  {
    title: 'Deload before you have to',
    tag: 'Recovery',
    body: 'When lifts stall, sleep frays, and joints nag for a couple of weeks, take a lighter week — cut volume or intensity by a third or so. You usually come back stronger, not behind.',
  },
];
