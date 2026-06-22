import { Component, type ReactNode } from 'react';
import { Download, RotateCw, TriangleAlert } from 'lucide-react';
import { useStore } from '../store/useStore';

/** Download the full app backup — available even mid-crash so a render bug
 *  never traps a user's logs. */
function downloadBackup() {
  try {
    const text = useStore.getState().exportData();
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mettle-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    /* nothing more we can do */
  }
}

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/** Catches render errors anywhere below it and shows a calm recovery screen
 *  with a data export + reload, instead of a white screen. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Mettle crashed:', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-svh grid place-items-center px-6 bg-canvas text-fg">
        <div className="max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-[18px] bg-surface-2 text-danger grid place-items-center mx-auto mb-4">
            <TriangleAlert size={26} />
          </div>
          <h1 className="text-2xl mb-2">Something broke</h1>
          <p className="text-sm text-fg-muted leading-relaxed mb-6">
            The app hit an unexpected error. Your data is safe on this device — back it up, then reload.
          </p>
          <div className="space-y-2.5">
            <button
              onClick={downloadBackup}
              className="w-full h-12 rounded-btn bg-surface-2 text-fg font-semibold text-[15px] flex items-center justify-center gap-2"
            >
              <Download size={16} /> Export my data
            </button>
            <button
              onClick={() => location.reload()}
              className="w-full h-12 rounded-btn bg-accent text-accent-fg font-semibold text-[15px] flex items-center justify-center gap-2"
            >
              <RotateCw size={16} /> Reload app
            </button>
          </div>
        </div>
      </div>
    );
  }
}
