import { Check, Monitor } from 'lucide-react';
import { Card, CardLabel, Segmented, Switch } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { useStore } from '../../store/useStore';
import {
  normalizeSystemPair,
  normalizeTheme,
  THEME_LIST,
  THEMES,
  type ThemeId,
} from '../../theme/themes';
import { ACCENT_SWATCHES } from '../../theme/accent';

/** A miniature of the theme: canvas, a surface, and its accent. */
function Swatch({ id, active }: { id: ThemeId; active: boolean }) {
  const t = THEMES[id];
  return (
    <div
      className={cn(
        'relative h-14 rounded-btn overflow-hidden border-2 transition-colors',
        active ? 'border-accent' : 'border-border',
      )}
      style={{ background: t.canvas }}
    >
      <div
        className="absolute left-2 right-2 top-2 h-4 rounded-[4px]"
        style={{ background: t.preview.fg, opacity: 0.14 }}
      />
      <div className="absolute left-2 bottom-2 h-3 w-8 rounded-full" style={{ background: t.preview.accent }} />
      <div
        className="absolute right-2 bottom-2 h-3 w-3 rounded-full"
        style={{ background: t.preview.fg, opacity: 0.5 }}
      />
      {active && (
        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-accent text-accent-fg grid place-items-center">
          <Check size={10} strokeWidth={3.5} />
        </span>
      )}
    </div>
  );
}

export function ThemePicker() {
  const settings = useStore((s) => s.settings);
  const setTheme = useStore((s) => s.setTheme);
  const updateSettings = useStore((s) => s.updateSettings);

  const mode = normalizeTheme(settings.theme);
  const pair = normalizeSystemPair(settings.systemPair);
  const activeId = mode === 'system' ? null : mode;
  const activeDef = THEMES[mode === 'system' ? pair.dark : mode];
  const accentLocked = Boolean(activeDef?.accentLocked);

  return (
    <>
      <Card>
        <CardLabel>Theme</CardLabel>
        <div className="grid grid-cols-3 gap-2.5">
          {THEME_LIST.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                if (mode === t.id) return;
                haptics.select();
                setTheme(t.id);
              }}
              className="text-left"
              aria-label={t.label}
              aria-pressed={activeId === t.id}
            >
              <Swatch id={t.id} active={activeId === t.id} />
              <div className="text-[12px] font-semibold mt-1.5 truncate">{t.label}</div>
              <div className="text-[10px] text-fg-subtle leading-tight truncate">{t.tagline}</div>
            </button>
          ))}

          {/* System: split preview of whichever pair is configured. */}
          <button
            onClick={() => {
              if (mode === 'system') return;
              haptics.select();
              setTheme('system');
            }}
            className="text-left"
            aria-label="Match system"
            aria-pressed={mode === 'system'}
          >
            <div
              className={cn(
                'relative h-14 rounded-btn overflow-hidden border-2 flex transition-colors',
                mode === 'system' ? 'border-accent' : 'border-border',
              )}
            >
              <div className="flex-1" style={{ background: THEMES[pair.dark].canvas }} />
              <div className="flex-1" style={{ background: THEMES[pair.light].canvas }} />
              <span className="absolute inset-0 grid place-items-center text-fg-muted">
                <Monitor size={16} />
              </span>
            </div>
            <div className="text-[12px] font-semibold mt-1.5">System</div>
            <div className="text-[10px] text-fg-subtle leading-tight truncate">Follows your device</div>
          </button>
        </div>

        {mode === 'system' && (
          <div className="mt-4 space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-fg-subtle">
              Which pair to alternate
            </div>
            {(['dark', 'light'] as const).map((scene) => (
              <div key={scene} className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-fg-muted w-10 shrink-0 capitalize">{scene}</span>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                  {THEME_LIST.filter((t) => t.scene === scene).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        haptics.select();
                        updateSettings({ systemPair: { ...pair, [scene]: t.id } });
                      }}
                      className={cn(
                        'shrink-0 h-8 px-3 rounded-full border text-[12px] font-semibold transition-colors',
                        pair[scene] === t.id
                          ? 'border-accent bg-accent-soft text-fg'
                          : 'border-border bg-surface-2 text-fg-muted',
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-baseline justify-between mb-2">
          <CardLabel className="mb-0">Accent colour</CardLabel>
          {settings.accent && (
            <button
              onClick={() => {
                haptics.tap();
                updateSettings({ accent: null });
              }}
              className="text-[12px] font-semibold text-accent"
            >
              Reset
            </button>
          )}
        </div>

        {accentLocked ? (
          <p className="text-[13px] text-fg-muted leading-snug">
            {activeDef.label}'s red is part of the look, so it keeps its own accent. Pick another theme to
            customise this.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-6 gap-2">
              {ACCENT_SWATCHES.map((hex) => (
                <button
                  key={hex}
                  onClick={() => {
                    haptics.select();
                    updateSettings({ accent: hex });
                  }}
                  aria-label={`Accent ${hex}`}
                  className={cn(
                    'h-9 rounded-btn border-2 transition-transform',
                    settings.accent?.toLowerCase() === hex.toLowerCase()
                      ? 'border-fg scale-105'
                      : 'border-transparent',
                  )}
                  style={{ background: hex }}
                />
              ))}
            </div>
            <label className="flex items-center gap-3 mt-3">
              <input
                type="color"
                value={settings.accent ?? THEMES[mode === 'system' ? pair.dark : mode].preview.accent}
                onChange={(e) => updateSettings({ accent: e.target.value })}
                className="w-10 h-9 rounded-btn bg-surface-2 border border-border p-1"
                aria-label="Custom accent colour"
              />
              <span className="text-[13px] text-fg-muted">Or pick any colour</span>
            </label>
            <p className="text-[11px] text-fg-subtle mt-2.5 leading-snug">
              Text on accent buttons flips between black and white automatically, whichever stays readable.
            </p>
          </>
        )}
      </Card>

      <Card className="divide-y divide-border">
        <div className="flex items-center justify-between gap-4 pb-3">
          <div className="min-w-0">
            <div className="font-medium text-[15px]">Heavy metal font</div>
            <div className="text-xs text-fg-muted mt-0.5">A gothic display face, for the mood</div>
          </div>
          <Switch
            checked={settings.displayFont === 'metal'}
            onChange={(v) => updateSettings({ displayFont: v ? 'metal' : 'default' })}
            aria-label="Heavy metal font"
          />
        </div>
        {settings.displayFont === 'metal' && (
          <div className="pt-3">
            <div className="text-[13px] font-semibold text-fg-muted mb-2">Where it applies</div>
            <Segmented
              fullWidth
              value={settings.displayFontScope}
              onChange={(v) => updateSettings({ displayFontScope: v })}
              options={[
                { value: 'wordmark' as const, label: 'Logo only' },
                { value: 'headings' as const, label: 'All headings' },
              ]}
            />
          </div>
        )}
      </Card>
    </>
  );
}
