import { Sheet } from '../../components/ui';
import { InstallGuide } from './InstallGuide';

/** Settings entry point for the add-to-home-screen walkthrough. */
export function InstallSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Get the app">
      <p className="text-sm text-fg-muted leading-relaxed -mt-1 mb-4">
        Mettle installs straight from the browser — no app store. Pick your phone:
      </p>
      <InstallGuide />
      <div className="h-2" />
    </Sheet>
  );
}
