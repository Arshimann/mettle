import { useEffect } from 'react';
import { ThemeProvider } from './theme/ThemeProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppShell } from './app/AppShell';
import { Onboarding } from './features/onboarding/Onboarding';
import { PasswordReset } from './features/auth/PasswordReset';
import { useStore } from './store/useStore';
import { useAuth } from './store/useAuth';

export default function App() {
  const onboarded = useStore((s) => s.settings.onboarded);
  const initAuth = useAuth((s) => s.init);

  // Restore any Supabase session and start cloud sync. No-ops in local-first builds.
  useEffect(() => initAuth(), [initAuth]);

  return (
    <ThemeProvider>
      <ErrorBoundary>
        {onboarded ? <AppShell /> : <Onboarding />}
        {/* Outside the shell so a reset link works mid-onboarding too. */}
        <PasswordReset />
      </ErrorBoundary>
    </ThemeProvider>
  );
}
