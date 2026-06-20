import { ThemeProvider } from './theme/ThemeProvider';
import { AppShell } from './app/AppShell';
import { Onboarding } from './features/onboarding/Onboarding';
import { useStore } from './store/useStore';

export default function App() {
  const onboarded = useStore((s) => s.settings.onboarded);
  return <ThemeProvider>{onboarded ? <AppShell /> : <Onboarding />}</ThemeProvider>;
}
