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
import { NotificationBell } from '../features/notifications/NotificationBell';
import { Screen } from './Screen';
import { UpdatePrompt } from '../features/system/UpdatePrompt';
import { WhatsNew } from '../features/system/WhatsNew';
import { AchievementUnlock } from '../features/system/AchievementUnlock';
import { Toaster } from '../features/system/Toaster';
import { Dashboard } from '../features/dashboard/Dashboard';
import { Split } from '../features/split/Split';
import { Train } from '../features/train/Train';
import { Stretch } from '../features/stretch/Stretch';
import { Progress } from '../features/progress/Progress';
import { Learn } from '../features/learn/Learn';
import { Friends } from '../features/friends/Friends';
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
    case 'progress':
      return <Progress />;
    case 'learn':
      return <Learn />;
    case 'friends':
      return <Friends />;
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
    // The notch inset pads the header itself, never the fixed-height bar inside
    // it — with border-box, a 59px Dynamic Island inset would eat the whole 56px
    // bar and crush its contents.
    <header
      className="sticky top-0 z-30 backdrop-blur-xl bg-canvas/70 border-b border-border/60"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="max-w-[640px] mx-auto h-14 px-[18px] flex items-center justify-between">
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
            <span
              className="w-8 h-8 rounded-[10px] bg-accent bg-accent-grad text-accent-fg grid place-items-center glow-accent font-brand font-black text-[16px]"
              style={{ fontStretch: '125%' }}
            >
              {APP_NAME[0]}
            </span>
            <span className="wordmark text-[16px] leading-none pt-px">{APP_NAME}</span>
          </button>
        )}

        {!inSettings && (
          <div className="flex items-center gap-0.5">
            <NotificationBell />
            <div className="relative">
            <motion.button
              onClick={() => {
                haptics.tap();
                setMenuOpen((o) => !o);
              }}
              whileTap={{ rotate: 26, scale: 0.9 }}
              transition={springPop}
              className={cn(
                'w-9 h-9 -mr-1.5 grid place-items-center rounded-btn transition-colors',
                menuOpen ? 'text-accent bg-accent-soft' : 'text-fg-muted',
              )}
              aria-label="Settings"
              aria-expanded={menuOpen}
            >
              <SettingsIcon size={20} />
            </motion.button>
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

  // Swipe-between-tabs, armed only from the top (header) or bottom (nav) bands —
  // a swipe that starts mid-content (building a split, scrolling a list) is ignored
  // so you can't accidentally yank yourself to another tab.
  const touch = useRef<{ x: number; y: number } | null>(null);
  const inSwipeZone = (y: number) => y <= 72 || y >= window.innerHeight - 96;
  const onTouchStart = (e: TouchEvent) => {
    // Don't arm a swipe while a sheet/modal is open, or from the content area.
    const t = e.touches[0];
    if (overlays > 0 || !inSwipeZone(t.clientY)) {
      touch.current = null;
      return;
    }
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
    // Touch handlers live on the root so the header and bottom nav (siblings of
    // <main>) count as swipe zones.
    <div className={cn('min-h-svh')} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <Header />
      {/* Clears the floating nav: its top edge sits at inset + 74px. */}
      <main className="max-w-[640px] mx-auto px-[18px] pt-3 pb-[calc(env(safe-area-inset-bottom)+96px)]">
        <Screen key={screen} dir={dir}>
          {renderScreen(screen)}
        </Screen>
      </main>
      <BottomNav />
      <UpdatePrompt />
      <WhatsNew />

      <AchievementUnlock />
      <Toaster />
    </div>
  );
}
