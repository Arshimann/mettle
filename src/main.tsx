import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter/index.css';
import '@fontsource/metal-mania/index.css';
import './index.css';
import App from './App.tsx';
import { useStore } from './store/useStore';
import { setHapticsEnabled } from './lib/haptics';
import { initAudio } from './lib/sound';

// Keep the haptics flag in sync with the setting — at boot AND whenever it
// changes (Settings toggle, data import, cloud sync). Previously only set
// once at boot, so toggling haptics didn't apply until a full reload.
setHapticsEnabled(useStore.getState().settings.haptics);
useStore.subscribe((s) => setHapticsEnabled(s.settings.haptics));

// Unlock the shared AudioContext on the first user gesture so timer chimes
// are audible on iOS (contexts started outside a gesture stay suspended).
initAudio();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
