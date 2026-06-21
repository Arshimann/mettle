import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button, Card, CardLabel, Segmented, Sheet } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { useStore } from '../../store/useStore';
import { caloriePlan, DIET_RATES, proteinTarget, tdee, waterTarget, type DietGoal } from '../../lib/formulas';
import { fromKg, unitLabel } from '../../lib/units';
import type { Activity, Sex } from '../../types';

const ACTIVITIES: { value: Activity; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very active' },
];

function Row({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-baseline justify-between">
        <span className="font-medium">{label}</span>
        <span className="font-bold tabular">{value}</span>
      </div>
      <p className="text-xs text-fg-muted mt-0.5">{note}</p>
    </div>
  );
}

export function Coach() {
  const bodyWeight = useStore((s) => s.bodyWeight);
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const units = useStore((s) => s.settings.units);

  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState<DietGoal>('maintain');
  const [rateIdx, setRateIdx] = useState(0);
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<Exclude<Sex, null>>('male');
  const [activity, setActivity] = useState<Activity>('moderate');

  const sorted = [...bodyWeight].sort((a, b) => a.date.localeCompare(b.date));
  const wKg = sorted[sorted.length - 1]?.weight ?? null;

  const openEditor = () => {
    haptics.tap();
    setHeight(profile.height ? String(profile.height) : '');
    setAge(profile.age ? String(profile.age) : '');
    setSex(profile.sex ?? 'male');
    setActivity(profile.activity);
    setOpen(true);
  };

  const saveProfile = () => {
    setProfile({
      height: height ? Math.round(parseFloat(height)) : null,
      age: age ? Math.round(parseFloat(age)) : null,
      sex,
      activity,
    });
    haptics.success();
    setOpen(false);
  };

  const protein = wKg ? proteinTarget(wKg) : null;
  const water = wKg ? waterTarget(wKg) : null;
  const cals = wKg ? tdee(wKg, profile) : null;

  const rates = DIET_RATES[goal];
  const rate = rates[Math.min(rateIdx, rates.length - 1)];
  const plan = cals != null && wKg != null ? caloriePlan(cals, wKg, goal, rate.delta) : null;

  const profileSummary = [
    profile.height ? `${profile.height} cm` : null,
    profile.age ? `${profile.age} yrs` : null,
    profile.sex ? (profile.sex === 'male' ? 'Male' : 'Female') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const inputCls =
    'w-full h-12 px-3.5 rounded-btn bg-surface-2 border border-border text-[15px] outline-none focus:border-border-strong';

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <CardLabel className="mb-0">Coach</CardLabel>
        <button onClick={openEditor} className="flex items-center gap-1 text-[13px] font-semibold text-fg-muted">
          <Pencil size={14} /> Profile
        </button>
      </div>

      <button onClick={openEditor} className="text-[13px] text-fg-muted mb-3 flex items-center gap-1.5 text-left">
        {profileSummary || 'Add your height, age & sex'}
        <Pencil size={12} className="text-fg-subtle shrink-0" />
      </button>

      {!wKg ? (
        <p className="text-sm text-fg-muted">Log your body weight to get protein, water, and calorie targets.</p>
      ) : (
        <div className="divide-y divide-border">
          <Row
            label="Protein"
            value={`${protein![0]}–${protein![1]} g`}
            note="1.4–1.8 g per kg. Spread across 3–5 meals."
          />
          <Row label="Water" value={`${(water! / 1000).toFixed(1)} L`} note={`About ${water!.toLocaleString()} ml a day.`} />
          {cals != null ? (
            <Row
              label="Calories"
              value={`${cals.toLocaleString()} kcal`}
              note="Maintenance — what you burn on an average day. Plan a bulk or cut below."
            />
          ) : (
            <Row label="Calories" value="—" note="Add height, age, and sex to unlock calorie targets." />
          )}
          <Row label="Sleep" value="7–9 hrs" note="More growth happens here than at the rack." />
        </div>
      )}

      {plan && (
        <div className="mt-3 pt-3 border-t border-border">
          <CardLabel>Bulk / cut</CardLabel>
          <Segmented
            fullWidth
            value={goal}
            onChange={(g) => { setGoal(g); setRateIdx(0); }}
            options={[
              { value: 'cut', label: 'Cut' },
              { value: 'maintain', label: 'Maintain' },
              { value: 'bulk', label: 'Bulk' },
            ]}
          />
          {goal !== 'maintain' && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {rates.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => { haptics.tap(); setRateIdx(i); }}
                  className={cn(
                    'px-3 h-9 rounded-full text-[13px] font-semibold border transition-colors',
                    i === rateIdx ? 'bg-accent text-accent-fg border-accent' : 'bg-surface-2 text-fg-muted border-border',
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
          <div className="mt-3 rounded-card bg-surface-2 p-3.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] font-semibold text-fg-muted">Daily target</span>
              <span className="text-2xl font-bold tabular">
                {plan.calories.toLocaleString()} <span className="text-sm font-semibold text-fg-muted">kcal</span>
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[13px]">
              <span className="text-fg-muted">{plan.delta === 0 ? 'At maintenance' : `${plan.delta > 0 ? '+' : ''}${plan.delta} kcal/day`}</span>
              <span className="font-semibold">
                {plan.weeklyKg === 0
                  ? 'Hold weight'
                  : `≈ ${plan.weeklyKg < 0 ? 'lose' : 'gain'} ${fromKg(Math.abs(plan.weeklyKg), units)} ${unitLabel(units)}/wk`}
              </span>
            </div>
            <div className="mt-1.5 text-[13px] text-fg-muted">
              Protein {plan.protein[0]}–{plan.protein[1]} g/day
            </div>
          </div>
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Your profile">
        <div className="space-y-3">
          <input inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="Height (cm)" className={inputCls} />
          <input inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" className={inputCls} />
          <div>
            <div className="text-[13px] font-semibold text-fg-muted mb-1.5">Sex</div>
            <Segmented
              fullWidth
              value={sex}
              onChange={setSex}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
              ]}
            />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-fg-muted mb-1.5">Activity</div>
            <div className="flex flex-wrap gap-1.5">
              {ACTIVITIES.map((a) => (
                <button
                  key={a.value}
                  onClick={() => { haptics.tap(); setActivity(a.value); }}
                  className={cn(
                    'px-3 h-9 rounded-full text-[13px] font-semibold border transition-colors',
                    activity === a.value ? 'bg-accent text-accent-fg border-accent' : 'bg-surface-2 text-fg-muted border-border',
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          <Button variant="accent" size="lg" fullWidth onClick={saveProfile}>
            Save profile
          </Button>
        </div>
      </Sheet>
    </Card>
  );
}
