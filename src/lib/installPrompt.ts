/**
 * Captures Chromium's `beforeinstallprompt` so the install guide can offer a
 * real one-tap install button on Android. The event can fire before React
 * mounts, so this module must be imported first thing in main.tsx — capture
 * happens at module scope.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((cb) => cb());

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e as BeforeInstallPromptEvent;
  notify();
});

window.addEventListener('appinstalled', () => {
  deferred = null;
  notify();
});

/** Non-null when the browser is offering a native install right now. */
export function getInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferred;
}

/** Re-render hook for components showing the native install button. */
export function subscribeInstallPrompt(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Show the native prompt. The captured event is single-use. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const evt = deferred;
  if (!evt) return 'unavailable';
  deferred = null;
  notify();
  await evt.prompt();
  const choice = await evt.userChoice;
  return choice.outcome;
}
