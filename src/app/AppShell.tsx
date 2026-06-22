import { useRef, useState, type TouchEvent } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Settings as SettingsIcon } from 'lucide-react';
import { APP_NAME } from '../config';
import { cn } from '../lib/cn';
import { haptics } from '../lib/haptics';
import { springPop } from '../theme/motion';
import { useUI, type ScreenId } from '../store/useUI';
import { SETTINGS_SECTIONS } from '../features/settings/sections';
import { visibleNav } from './nav';
import { BottomNav } from './BottomNav';
import { Screen } from './Screen';
import { UpdatePrompt } from '../features/system/UpdatePrompt';
import { Dashboard } from '../features/dashboard/Dashboard';
import { Split } from '../features/split/Split';
import { Train } from '../features/train/Train';
import { Stretch } from '../features/stretch/Stretch';
import { Recovery } from '../features/recovery/Recovery';
import { Progress } from '../features/progress/Progress';
import { Learn } from '../features/learn/Learn';
import { You } from '../features/you/You';
import { Settings } from '../features/settings/Settings';
import { useStore } from '../store/useStore';

function renderScreen(screen: ScreenId) {
  switch (screen) {
    case 'home':
      return <Dashboard />;
    case 'split':
      return <Split />;
    case 'train':
      return <Train />;
    case 'stretch':
      return <Stretch />;
    case 'recovery':
      return <Recovery />;
    case 'progress':
      return <Progress />;
    case 'learn':
      return <Learn />;
    case 'you':
      return <You />;
    case 'settings':
      return <Settings />;
  }
}

function Header() {
  const screen = useUI((s) => s.screen);
  const navigate = useUI((s) => s.navigate);
  const back = useUI((s) => s.back);
  const sectionId = useUI((s) => s.params.section) as string | undefined;
  const [menuOpen, setMenuOpen] = useState(false);
  const inSettings = screen === 'settings';
  const sectionLabel = SETTINGS_SECTIONS.find((s) => s.id === sectionId)?.label ?? 'Settings';

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-canvas/70 border-b border-border/60">
      <div
        className="max-w-[640px] mx-auto h-14 px-[18px] flex items-center justify-between"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {inSettings ? (
          <button
            onClick={() => {
              haptics.tap();
              back();
            }}
            className="flex items-center gap-1 -ml-1.5 text-fg font-semibold"
          >
            <ChevronLeft size={22} />
            <span className="text-[15px]">{sectionLabel}</span>
          </button>
        ) : (
          <button
            onClick={() => {
              haptics.tap();
              navigate('home');
            }}
            className="flex items-center gap-2"
          >
            <span className="w-8 h-8 rounded-[9px] bg-accent text-accent-fg grid place-items-center font-brand font-normal text-[20px] pt-0.5">
              {APP_NAME[0]}
            </span>
            <span className="font-brand font-normal text-[22px] tracking-normal leading-none pt-0.5">
              {APP_NAME}
            </span>
          </button>
        )}

        {!inSettings && (
          <div className="relative">
            <button
              onClick={() => {
                haptics.tap();
                setMenuOpen((o) => !o);
              }}
              className={cn(
                'w-9 h-9 -mr-1.5 grid place-items-center rounded-btn transition-colors',
                menuOpen ? 'text-accent bg-accent-soft' : 'text-fg-muted',
              )}
              aria-label="Settings"
              aria-expanded={menuOpen}
            >
              <SettingsIcon size={20} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={springPop}
                  className="absolute right-0 top-[calc(100%+10px)] z-50 w-56 origin-top-right bg-elevated border border-border rounded-card shadow-pop p-1.5"
                >
                  <div className="px-2.5 pt-1.5 pb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-fg-subtle">
                    Settings
                  </div>
                  {SETTINGS_SECTIONS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          haptics.select();
                          navigate('settings', { section: item.id });
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-2.5 h-10 rounded-btn text-[14px] font-medium text-fg hover:bg-surface-2 transition-colors"
                      >
                        <Icon size={17} className="text-fg-muted" />
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronRight size={15} className="text-fg-subtle" />
                      </button>
                    );
                  })}
                </motion.div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export function AppShell() {
  const screen = useUI((s) => s.screen);
  const navigate = useUI((s) => s.navigate);

  const dir = useUI((s) => s.dir);
  const overlays = useUI((s) => s.overlays);
  const tabs = useStore((s) => s.settings.tabs);
  const order = visibleNav(tabs).map((n) => n.id);

  // Lightweight swipe-between-tabs that doesn't interfere with scroll or taps.
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: TouchEvent) => {
    // Don't arm a swipe while a sheet/modal is open.
    if (overlays > 0) {
      touch.current = null;
      return;
    }
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (!touch.current || screen === 'settings' || overlays > 0) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6) {
      const i = order.indexOf(screen as never);
      if (i === -1) return;
      const ni = dx < 0 ? Math.min(i + 1, order.length - 1) : Math.max(i - 1, 0);
      if (ni !== i) {
        haptics.select();
        navigate(order[ni]);
      }
    }
  };

  return (
    <div className={cn('min-h-svh')}>
      <Header />
      <main
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="max-w-[640px] mx-auto px-[18px] pt-3 pb-[92px]"
      >
        <Screen key={screen} dir={dir}>
          {renderScreen(screen)}
        </Screen>
      </main>
      <BottomNav />
      <UpdatePrompt />
    </div>
  );
}
