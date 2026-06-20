import { useEffect, useRef, type TouchEvent } from 'react';
import { ChevronLeft, Settings as SettingsIcon } from 'lucide-react';
import { APP_NAME } from '../config';
import { cn } from '../lib/cn';
import { haptics } from '../lib/haptics';
import { useUI, type ScreenId } from '../store/useUI';
import { NAV_ORDER } from './nav';
import { BottomNav } from './BottomNav';
import { Screen } from './Screen';
import { Dashboard } from '../features/dashboard/Dashboard';
import { Split } from '../features/split/Split';
import { Train } from '../features/train/Train';
import { Progress } from '../features/progress/Progress';
import { You } from '../features/you/You';
import { Settings } from '../features/settings/Settings';

function renderScreen(screen: ScreenId) {
  switch (screen) {
    case 'home':
      return <Dashboard />;
    case 'split':
      return <Split />;
    case 'train':
      return <Train />;
    case 'progress':
      return <Progress />;
    case 'you':
      return <You />;
    case 'settings':
      return <Settings />;
  }
}

function Header() {
  const screen = useUI((s) => s.screen);
  const navigate = useUI((s) => s.navigate);
  const inSettings = screen === 'settings';

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
              navigate('home');
            }}
            className="flex items-center gap-1 -ml-1.5 text-fg font-semibold"
          >
            <ChevronLeft size={22} />
            <span className="text-[15px]">Settings</span>
          </button>
        ) : (
          <button
            onClick={() => {
              haptics.tap();
              navigate('home');
            }}
            className="flex items-center gap-2"
          >
            <span className="w-7 h-7 rounded-[9px] bg-accent text-accent-fg grid place-items-center font-black text-[15px]">
              {APP_NAME[0]}
            </span>
            <span className="text-[17px] font-bold tracking-tight">{APP_NAME}</span>
          </button>
        )}

        {!inSettings && (
          <button
            onClick={() => {
              haptics.tap();
              navigate('settings');
            }}
            className="w-9 h-9 -mr-1.5 grid place-items-center text-fg-muted rounded-btn"
            aria-label="Settings"
          >
            <SettingsIcon size={20} />
          </button>
        )}
      </div>
    </header>
  );
}

export function AppShell() {
  const screen = useUI((s) => s.screen);
  const navigate = useUI((s) => s.navigate);

  const curIdx = NAV_ORDER.indexOf(screen as never);
  const prevIdx = useRef(curIdx);
  const dir = curIdx === -1 || prevIdx.current === -1 ? 1 : curIdx >= prevIdx.current ? 1 : -1;
  useEffect(() => {
    prevIdx.current = curIdx;
  }, [curIdx]);

  // Lightweight swipe-between-tabs that doesn't interfere with scroll or taps.
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (!touch.current || screen === 'settings') return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6) {
      const i = NAV_ORDER.indexOf(screen as never);
      const ni = dx < 0 ? Math.min(i + 1, NAV_ORDER.length - 1) : Math.max(i - 1, 0);
      if (ni !== i) {
        haptics.select();
        navigate(NAV_ORDER[ni]);
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
    </div>
  );
}
