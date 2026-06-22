import { useEffect, useState } from 'react';
import { Sheet } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { useUI } from '../../store/useUI';
import { RELEASE_NOTES, notesSince } from '../../data/releaseNotes';

/**
 * Shows release notes once, after the app updates to a newer version. New
 * installs adopt the current version silently (onboarding already introduced
 * them). Can be re-opened anytime from Settings → About.
 */
export function WhatsNew() {
  const lastSeen = useStore((s) => s.settings.lastSeenVersion);
  const updateSettings = useStore((s) => s.updateSettings);
  const manualOpen = useUI((s) => s.whatsNewOpen);
  const setWhatsNewOpen = useUI((s) => s.setWhatsNewOpen);
  // Decide once, synchronously (persisted state is already rehydrated at mount).
  const [autoOpen, setAutoOpen] = useState(() => {
    const seen = useStore.getState().settings.lastSeenVersion;
    return !!seen && notesSince(seen).length > 0;
  });

  useEffect(() => {
    // New install / pre-feature user: adopt the current version silently so the
    // popup doesn't later fire for notes they never missed.
    if (!useStore.getState().settings.lastSeenVersion) {
      useStore.getState().updateSettings({ lastSeenVersion: __APP_VERSION__ });
    }
  }, []);

  const open = autoOpen || manualOpen;
  // After an update: everything since last seen. Manual re-open: the latest release.
  const notes = autoOpen ? notesSince(lastSeen) : RELEASE_NOTES.slice(0, 1);

  const close = () => {
    setAutoOpen(false);
    setWhatsNewOpen(false);
    if (lastSeen !== __APP_VERSION__) updateSettings({ lastSeenVersion: __APP_VERSION__ });
  };

  return (
    <Sheet open={open} onClose={close} title="What's new">
      <div className="space-y-5 -mt-1">
        {notes.map((n) => (
          <div key={n.version}>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-[15px] font-bold">v{n.version}</span>
              {n.date && <span className="text-xs text-fg-subtle">{n.date}</span>}
            </div>
            <ul className="space-y-2">
              {n.items.map((it, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-fg-muted leading-relaxed">
                  <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Sheet>
  );
}
