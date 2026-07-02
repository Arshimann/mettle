export interface Fact {
  title: string;
  body: string;
  /** Honest, general attribution — a body, researcher, or line of research.
   *  Never a fabricated precise citation. */
  source: string;
}

export const FACTS: Fact[] = [
  {
    title: 'Progressive overload is the engine',
    body: 'Muscle adapts to demand. Adding a little weight, a rep, or a set over time is what drives growth — not any single workout.',
    source: 'ACSM progression models',
  },
  {
    title: 'Protein has a wide window',
    body: 'Total daily protein matters far more than the exact timing. Aim for 1.6–2.2 g per kg of bodyweight, spread across the day.',
    source: 'ISSN position stand on protein',
  },
  {
    title: 'Soreness ≠ a good workout',
    body: 'DOMS reflects novelty, not effectiveness. You can build muscle with little soreness, and being sore does not mean you grew.',
    source: 'Muscle-damage (DOMS) research',
  },
  {
    title: 'Sleep is anabolic',
    body: 'Most muscle repair and growth-hormone release happen during deep sleep. 7–9 hours does more for your physique than any supplement.',
    source: 'Sleep & recovery research',
  },
  {
    title: 'Most sets should stop shy of failure',
    body: 'Training 1–3 reps from failure on most sets gives nearly all the growth with far less fatigue, so you recover and progress faster.',
    source: 'Proximity-to-failure meta-analyses',
  },
  {
    title: 'Tempo beats momentum',
    body: 'Controlling the lowering (eccentric) phase for 2–3 seconds increases tension and growth more than heaving the weight up and down.',
    source: 'Eccentric-training research',
  },
  {
    title: 'Strength is partly skill',
    body: 'Early strength gains come largely from your nervous system getting better at the movement — practice the lift, not just the muscle.',
    source: 'Neural-adaptation studies',
  },
  {
    title: 'NEAT burns more than the gym',
    body: 'Non-exercise activity — walking, fidgeting, standing — often burns more daily calories than your workout. Steps add up.',
    source: 'NEAT research (Levine et al.)',
  },
  {
    title: 'Rest longer on big lifts',
    body: 'For heavy compound lifts, 2–3 minutes between sets preserves strength and total volume. Short rests suit isolation work.',
    source: 'Rest-interval research (Schoenfeld et al.)',
  },
  {
    title: 'Full range of motion wins',
    body: 'Training muscles at long lengths (deep stretch) tends to build more size than partial reps. Control the full range where safe.',
    source: 'Stretch-mediated hypertrophy research',
  },
  {
    title: 'You can build muscle in a deficit',
    body: 'Beginners and those returning from a break can gain muscle while losing fat, especially with high protein and hard training.',
    source: 'Body-recomposition research',
  },
  {
    title: 'Creatine is the proven one',
    body: 'Creatine monohydrate (3–5 g daily) is among the most researched, safe, and effective supplements for strength and size.',
    source: 'ISSN position stand on creatine',
  },
  {
    title: 'Volume drives hypertrophy',
    body: 'Roughly 10–20 hard sets per muscle per week is a productive range for growth. More is not always better — recovery is finite.',
    source: 'Volume–hypertrophy meta-analyses',
  },
  {
    title: 'Warm up to perform, not to tire',
    body: 'A few ramping sets prime the nervous system and joints. Stop before fatigue so your working sets are your best.',
    source: 'Warm-up & potentiation research',
  },
  {
    title: 'Consistency beats intensity',
    body: 'A decent program followed for years outperforms a perfect one followed for weeks. Showing up is the highest-leverage habit.',
    source: 'Exercise-adherence research',
  },
  {
    title: 'Hit each muscle twice a week',
    body: 'Muscle protein synthesis stays elevated roughly 24–48 hours after training. Splitting weekly sets across two sessions keeps the growth signal on more of the time.',
    source: 'Training-frequency meta-analyses',
  },
  {
    title: 'Caffeine is a legit ergogenic',
    body: 'Around 3–6 mg per kg of bodyweight taken pre-training measurably improves strength, power, and endurance. More is not better — just jitterier.',
    source: 'ISSN position stand on caffeine',
  },
  {
    title: 'Machines build muscle too',
    body: 'Free weights and machines grow muscle similarly when effort and volume match. Free weights train balance and skill; machines let you push safely to the edge.',
    source: 'Free-weight vs machine comparisons',
  },
  {
    title: 'Grip strength tracks whole-body health',
    body: 'In large population studies, grip strength predicts long-term health outcomes remarkably well. Deadlifts, rows, and carries train it for free.',
    source: 'Population health studies (incl. PURE)',
  },
  {
    title: 'Cardio won’t eat your gains',
    body: 'Moderate cardio barely interferes with muscle growth — especially cycling or incline walking kept a few hours away from lifting. Big engines help you train harder.',
    source: 'Concurrent-training meta-analyses',
  },
  {
    title: 'Muscle memory is physical',
    body: 'Muscle you build leaves lasting nuclei in the fibers, which makes regaining lost size after a break far faster than building it the first time.',
    source: 'Myonuclei research (Gundersen et al.)',
  },
  {
    title: 'Alcohol blunts the build',
    body: 'A heavy session of drinking after training measurably suppresses muscle protein synthesis. An occasional drink is fine — just not as a post-workout ritual.',
    source: 'Alcohol & MPS studies',
  },
  {
    title: 'Tendons adapt slower than muscles',
    body: 'Muscle strength can outpace connective tissue by months. Ramping load gradually and pain-free is what keeps elbows, knees, and shoulders in the game.',
    source: 'Connective-tissue adaptation research',
  },
  {
    title: 'A short walk tames blood sugar',
    body: 'Even 10–15 minutes of walking after a meal noticeably lowers the glucose spike. Great habit on rest days and after big post-workout meals.',
    source: 'Post-meal activity studies',
  },
  {
    title: 'Big lifts are core training',
    body: 'Squats, deadlifts, overhead presses, and carries demand heavy trunk bracing — often more than dedicated ab exercises deliver. Add direct core work for the gaps, not the foundation.',
    source: 'Trunk-muscle EMG studies',
  },
  {
    title: 'Intent to move fast counts',
    body: 'Trying to accelerate the bar — even when it moves slowly — recruits more muscle fibers and builds more strength than lazily grinding the same weight.',
    source: 'Compensatory-acceleration research',
  },
  {
    title: 'Mild dehydration costs reps',
    body: 'Losing just ~2% of bodyweight in fluid measurably reduces strength and work capacity. Drink across the day, not all at once pre-workout.',
    source: 'Hydration & performance research',
  },
  {
    title: 'Your first year is the fastest',
    body: 'Newbie gains are real: the first year of consistent training produces more muscle than any year after. Don’t waste it program-hopping — pick a split and milk it.',
    source: 'Longitudinal training studies',
  },
  {
    title: 'Train around your cycle, not against it',
    body: 'Research on menstrual-cycle-based programming finds effects are small and highly individual. Autoregulate: push hard on strong days, back off on rough ones.',
    source: 'Menstrual-cycle training meta-analyses',
  },
  {
    title: 'Standing tall between sets helps',
    body: 'Slumping over your phone raises perceived effort. Easy breathing, a short stroll, or just standing upright clears fatigue between sets better.',
    source: 'Inter-set recovery research',
  },
];
