import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Apple, Check, Download, Smartphone } from 'lucide-react';
import { Button } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { isAndroid, isIOSNonSafariBrowser, isStandalone } from '../../lib/platform';
import { getInstallPrompt, promptInstall, subscribeInstallPrompt } from '../../lib/installPrompt';
import { listContainer, listItem } from '../../theme/motion';

type Platform = 'ios' | 'android';

/* ---- Code-drawn step illustrations (theme-aware via CSS vars) ---- */

const illoFrame = 'w-full rounded-[12px] border border-border bg-surface-2';

/** A browser toolbar with one control highlighted. */
function ToolbarIllo({ highlight }: { highlight: 'share' | 'menu' }) {
  return (
    <svg viewBox="0 0 240 74" className={illoFrame} role="img" aria-hidden>
      {/* address bar */}
      <rect x="16" y="22" width="164" height="30" rx="15" fill="var(--surface)" stroke="var(--border)" />
      <text x="34" y="41" fontSize="11" fill="var(--fg-subtle)" fontFamily="inherit">
        mettle.app
      </text>
      {highlight === 'share' ? (
        <g>
          <circle cx="208" cy="37" r="17" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1.5" />
          {/* share: box with up arrow */}
          <path
            d="M208 28v12M203.5 32l4.5-4.5 4.5 4.5M201.5 36.5v7.5a1.5 1.5 0 001.5 1.5h10a1.5 1.5 0 001.5-1.5v-7.5"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ) : (
        <g>
          <circle cx="208" cy="37" r="17" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1.5" />
          {/* Chrome ⋮ */}
          <circle cx="208" cy="30" r="2.1" fill="var(--accent)" />
          <circle cx="208" cy="37" r="2.1" fill="var(--accent)" />
          <circle cx="208" cy="44" r="2.1" fill="var(--accent)" />
        </g>
      )}
    </svg>
  );
}

/** A sheet/menu with the target row highlighted. */
function MenuRowIllo({ label, icon }: { label: string; icon: 'plus-square' | 'install' }) {
  return (
    <svg viewBox="0 0 240 74" className={illoFrame} role="img" aria-hidden>
      <rect x="16" y="8" width="208" height="18" rx="6" fill="var(--surface)" opacity="0.6" />
      <rect x="16" y="30" width="208" height="26" rx="8" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1.5" />
      {icon === 'plus-square' ? (
        <g stroke="var(--accent)" strokeWidth="1.8" fill="none" strokeLinecap="round">
          <rect x="28" y="36" width="14" height="14" rx="3.5" />
          <path d="M35 40v6M32 43h6" />
        </g>
      ) : (
        <g stroke="var(--accent)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M35 36v9M31 41.5l4 4 4-4" />
          <path d="M28.5 49.5h13" />
        </g>
      )}
      <text x="52" y="47" fontSize="11.5" fontWeight="600" fill="var(--fg)" fontFamily="inherit">
        {label}
      </text>
      <rect x="16" y="60" width="208" height="10" rx="5" fill="var(--surface)" opacity="0.6" />
    </svg>
  );
}

/** The payoff: the app icon on a home screen. */
function HomeScreenIllo() {
  return (
    <svg viewBox="0 0 240 74" className={illoFrame} role="img" aria-hidden>
      {[28, 76, 124, 172].map((x, i) => (
        <rect key={x} x={x} y="14" width="34" height="34" rx="9" fill={i === 3 ? 'var(--accent)' : 'var(--surface)'} stroke="var(--border)" />
      ))}
      <text x="189" y="37" fontSize="15" fontWeight="900" fill="var(--accent-fg)" textAnchor="middle" fontFamily="inherit">
        M
      </text>
      {[28, 76, 124, 172].map((x) => (
        <rect key={`l${x}`} x={x + 4} y="54" width="26" height="5" rx="2.5" fill="var(--surface)" opacity="0.9" />
      ))}
    </svg>
  );
}

function Step({ n, title, body, illo }: { n: number; title: string; body: string; illo: React.ReactNode }) {
  return (
    <motion.div variants={listItem} className="space-y-2.5">
      <div className="flex items-center gap-2.5">
        <span className="w-6 h-6 rounded-full bg-accent bg-accent-grad text-accent-fg grid place-items-center text-[12px] font-bold shrink-0">
          {n}
        </span>
        <div className="min-w-0">
          <div className="font-semibold text-[15px] leading-tight">{title}</div>
          <div className="text-[12.5px] text-fg-muted leading-snug">{body}</div>
        </div>
      </div>
      {illo}
    </motion.div>
  );
}

/**
 * Platform-tabbed, illustrated "add Mettle to your home screen" walkthrough.
 * On Android, offers the real native install prompt when Chrome grants one.
 */
export function InstallGuide() {
  const [platform, setPlatform] = useState<Platform>(() => (isAndroid() ? 'android' : 'ios'));
  const [nativeReady, setNativeReady] = useState(() => getInstallPrompt() != null);
  const [installed, setInstalled] = useState(() => isStandalone());

  useEffect(() => subscribeInstallPrompt(() => setNativeReady(getInstallPrompt() != null)), []);

  if (installed) {
    return (
      <div className="flex items-center gap-3 rounded-card border border-border bg-surface-2 p-4">
        <span className="w-9 h-9 rounded-full bg-accent-soft text-accent grid place-items-center shrink-0">
          <Check size={18} strokeWidth={3} />
        </span>
        <p className="text-sm text-fg-muted leading-snug">
          You're all set — Mettle is already on your home screen.
        </p>
      </div>
    );
  }

  const tabs: { id: Platform; label: string; icon: typeof Apple }[] = [
    { id: 'ios', label: 'iPhone', icon: Apple },
    { id: 'android', label: 'Android', icon: Smartphone },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = platform === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                haptics.select();
                setPlatform(t.id);
              }}
              className={cn(
                'h-14 rounded-card border-2 flex items-center justify-center gap-2 font-semibold text-[15px] transition-colors',
                active ? 'border-accent bg-accent-soft text-fg' : 'border-border bg-surface-2 text-fg-muted',
              )}
            >
              <Icon size={19} /> {t.label}
            </button>
          );
        })}
      </div>

      {platform === 'ios' ? (
        <motion.div key="ios" variants={listContainer} initial="hidden" animate="show" className="space-y-5">
          {isIOSNonSafariBrowser() && (
            <div className="rounded-card border border-warning/40 bg-warning/10 text-[13px] text-fg p-3.5 leading-snug">
              Heads up — on iPhone this only works from <b>Safari</b>. Open mettle in Safari first, then follow these steps.
            </div>
          )}
          <Step
            n={1}
            title="Tap the Share button"
            body="In Safari's toolbar — the square with the arrow pointing up."
            illo={<ToolbarIllo highlight="share" />}
          />
          <Step
            n={2}
            title="Tap “Add to Home Screen”"
            body="Scroll down the share sheet a little to find it."
            illo={<MenuRowIllo label="Add to Home Screen" icon="plus-square" />}
          />
          <Step
            n={3}
            title="Tap “Add” — done"
            body="Mettle lands on your home screen and opens full-screen like a real app."
            illo={<HomeScreenIllo />}
          />
        </motion.div>
      ) : (
        <motion.div key="android" variants={listContainer} initial="hidden" animate="show" className="space-y-5">
          {nativeReady && (
            <div className="space-y-2">
              <Button
                variant="accent"
                size="lg"
                fullWidth
                onClick={async () => {
                  const outcome = await promptInstall();
                  if (outcome === 'accepted') setInstalled(true);
                }}
              >
                <Download size={18} /> Install Mettle
              </Button>
              <p className="text-[12px] text-fg-subtle text-center">One tap — or do it manually below.</p>
            </div>
          )}
          <Step
            n={1}
            title="Open Chrome's menu"
            body="The three dots in the top-right corner."
            illo={<ToolbarIllo highlight="menu" />}
          />
          <Step
            n={2}
            title="Tap “Add to Home screen”"
            body="Sometimes shown as “Install app”."
            illo={<MenuRowIllo label="Add to Home screen" icon="install" />}
          />
          <Step
            n={3}
            title="Confirm — done"
            body="Mettle lands on your home screen and opens full-screen like a real app."
            illo={<HomeScreenIllo />}
          />
        </motion.div>
      )}
    </div>
  );
}
