import { useRef, useState, type ReactNode } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { APP_NAME, APP_TAGLINE, SCHEMA_VERSION } from '../../config';
import { Button, Card, Segmented, Switch } from '../../components/ui';
import { haptics } from '../../lib/haptics';
import { useStore } from '../../store/useStore';
import { useUI } from '../../store/useUI';
import { ThemePicker } from './ThemePicker';
import { SyncSection } from './SyncSection';
import type { SettingsSectionId } from './sections';
import type { DisplayToggles, TabToggles } from '../../types';

function Row({ label, desc, control }: { label: string; desc?: string; control: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <div className="font-medium text-[15px]">{label}</div>
        {desc && <div className="text-xs text-fg-muted mt-0.5">{desc}</div>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

const TAB_LABELS: Record<keyof TabToggles, string> = {
  split: 'Split',
  stretch: 'Stretch',
  progress: 'Progress',
  learn: 'Learn',
};

const DISPLAY_LABELS: Record<keyof DisplayToggles, string> = {
  stats: 'Stats grid',
  streak: 'Streak badge',
  dayCards: 'Day cards',
  lastWorkout: 'Last workout',
  weeklyRecap: 'Weekly recap',
  upNext: 'Up next',
  didYouKnow: 'Did you know',
};

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Settings() {
  const section = ((useUI((s) => s.params.section) as SettingsSectionId) || 'appearance');
  const settings = useStore((s) => s.settings);
  const setUnits = useStore((s) => s.setUnits);
  const updateSettings = useStore((s) => s.updateSettings);
  const toggleDisplay = useStore((s) => s.toggleDisplay);
  const toggleTab = useStore((s) => s.toggleTab);
  const exportData = useStore((s) => s.exportData);
  const importData = useStore((s) => s.importData);
  const resetData = useStore((s) => s.resetData);

  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const onImportFile = async (file: File) => {
    const text = await file.text();
    if (importData(text)) {
      haptics.success();
      flash('Data imported');
    } else {
      haptics.warn();
      flash('Could not read that file');
    }
  };

  return (
    <div className="pb-4 space-y-3.5">
      {section === 'appearance' && (
        <>
          <ThemePicker />
          <Card>
            <Row
              label="Units"
              desc="Used everywhere weights are shown"
              control={
                <Segmented
                  value={settings.units}
                  onChange={setUnits}
                  options={[
                    { value: 'kg', label: 'kg' },
                    { value: 'lbs', label: 'lbs' },
                  ]}
                />
              }
            />
          </Card>
          <Card className="divide-y divide-border">
            <div className="pb-2.5">
              <div className="font-medium text-[15px]">Tabs</div>
              <div className="text-xs text-fg-muted mt-0.5">
                Show or hide bottom-nav tabs. Home, Train, and You always stay.
              </div>
            </div>
            {(Object.keys(TAB_LABELS) as (keyof TabToggles)[]).map((key) => (
              <Row
                key={key}
                label={TAB_LABELS[key]}
                control={
                  <Switch
                    checked={settings.tabs[key]}
                    onChange={() => toggleTab(key)}
                    aria-label={TAB_LABELS[key]}
                  />
                }
              />
            ))}
          </Card>
        </>
      )}

      {section === 'feel' && (
        <Card className="divide-y divide-border">
          <Row
            label="Haptics"
            desc="Subtle vibration on taps"
            control={
              <Switch
                checked={settings.haptics}
                onChange={(v) => updateSettings({ haptics: v })}
                aria-label="Haptics"
              />
            }
          />
          <Row
            label="Rest timer chime"
            desc="Sound when rest ends"
            control={
              <Switch
                checked={settings.restChime}
                onChange={(v) => updateSettings({ restChime: v })}
                aria-label="Rest timer chime"
              />
            }
          />
        </Card>
      )}

      {section === 'home' && (
        <Card className="divide-y divide-border">
          {(Object.keys(DISPLAY_LABELS) as (keyof DisplayToggles)[]).map((key) => (
            <Row
              key={key}
              label={DISPLAY_LABELS[key]}
              control={
                <Switch
                  checked={settings.display[key]}
                  onChange={() => toggleDisplay(key)}
                  aria-label={DISPLAY_LABELS[key]}
                />
              }
            />
          ))}
        </Card>
      )}

      {section === 'sync' && <SyncSection />}

      {section === 'data' && (
        <Card className="space-y-2.5">
          <p className="text-sm text-fg-muted leading-relaxed">
            Your data lives on this device. Back it up or move it to another device with a file.
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              onClick={() => {
                download(`mettle-backup-${new Date().toISOString().slice(0, 10)}.json`, exportData());
                flash('Backup downloaded');
              }}
            >
              <Download size={16} /> Export
            </Button>
            <Button onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> Import
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportFile(f);
              e.target.value = '';
            }}
          />
          <Button
            variant="danger"
            fullWidth
            onClick={() => {
              if (!confirmReset) {
                setConfirmReset(true);
                setTimeout(() => setConfirmReset(false), 3000);
                return;
              }
              resetData();
              setConfirmReset(false);
              haptics.warn();
              flash('All workout data cleared');
            }}
          >
            <Trash2 size={16} /> {confirmReset ? 'Tap again to confirm' : 'Reset all data'}
          </Button>
        </Card>
      )}

      {section === 'about' && (
        <Card>
          <div className="font-brand font-normal text-2xl">{APP_NAME}</div>
          <div className="text-sm text-fg-muted">{APP_TAGLINE}</div>
          <div className="text-xs text-fg-subtle mt-2">
            v{__APP_VERSION__} · built {__BUILD_DATE__} · schema v{SCHEMA_VERSION}
          </div>
        </Card>
      )}

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-[84px] z-50 bg-fg text-canvas text-sm font-medium px-4 py-2.5 rounded-btn shadow-pop">
          {toast}
        </div>
      )}
    </div>
  );
}
