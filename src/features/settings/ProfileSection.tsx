import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Card, CardLabel, Segmented } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { useStore } from '../../store/useStore';
import { fmtWeight, parseNum, toKg, unitLabel } from '../../lib/units';
import { todayStr } from '../../lib/date';
import type { Activity, Sex } from '../../types';

const ACTIVITIES: { value: Activity; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very active' },
];

const inputCls =
  'w-full h-12 px-3.5 rounded-btn bg-surface-2 border border-border text-[15px] outline-none focus:border-border-strong';

export function ProfileSection() {
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const bodyWeight = useStore((s) => s.bodyWeight);
  const addBodyWeight = useStore((s) => s.addBodyWeight);
  const units = useStore((s) => s.settings.units);

  const [height, setHeight] = useState(profile.height ? String(profile.height) : '');
  const [age, setAge] = useState(profile.age ? String(profile.age) : '');
  const [bw, setBw] = useState('');

  const sorted = [...bodyWeight].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];

  const commitHeight = (v: string) => {
    setHeight(v);
    setProfile({ height: v.trim() ? Math.round(parseNum(v)) || null : null });
  };
  const commitAge = (v: string) => {
    setAge(v);
    setProfile({ age: v.trim() ? Math.round(parseNum(v)) || null : null });
  };

  const logWeight = () => {
    const n = parseNum(bw);
    if (isNaN(n) || n <= 0) return;
    addBodyWeight({ date: todayStr(), weight: toKg(bw, units) });
    haptics.success();
    setBw('');
  };

  return (
    <div className="space-y-3.5">
      <Card className="space-y-3">
        <CardLabel>About you</CardLabel>
        <input inputMode="numeric" value={height} onChange={(e) => commitHeight(e.target.value)} placeholder="Height (cm)" className={inputCls} />
        <input inputMode="numeric" value={age} onChange={(e) => commitAge(e.target.value)} placeholder="Age" className={inputCls} />
        <div>
          <div className="text-[13px] font-semibold text-fg-muted mb-1.5">Sex</div>
          <Segmented
            fullWidth
            value={(profile.sex ?? 'male') as Exclude<Sex, null>}
            onChange={(v) => setProfile({ sex: v })}
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
                onClick={() => { haptics.tap(); setProfile({ activity: a.value }); }}
                className={cn(
                  'px-3 h-9 rounded-full text-[13px] font-semibold border transition-colors',
                  profile.activity === a.value ? 'bg-accent text-accent-fg border-accent' : 'bg-surface-2 text-fg-muted border-border',
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-baseline justify-between">
          <CardLabel className="mb-0">Body weight</CardLabel>
          {latest && (
            <span className="text-sm font-bold tabular">
              {fmtWeight(latest.weight, units)} {unitLabel(units)}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            inputMode="decimal"
            value={bw}
            onChange={(e) => setBw(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') logWeight(); }}
            placeholder={`Today's weight in ${unitLabel(units)}`}
            className={cn(inputCls, 'flex-1')}
          />
          <Button variant="accent" onClick={logWeight} className="shrink-0">
            <Plus size={16} /> Log
          </Button>
        </div>
        {sorted.length > 0 && (
          <p className="text-xs text-fg-muted">
            {sorted.length} entr{sorted.length === 1 ? 'y' : 'ies'} logged · trend on the You tab.
          </p>
        )}
      </Card>
    </div>
  );
}
