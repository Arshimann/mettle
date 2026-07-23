// First import: arms the beforeinstallprompt capture before the browser fires it.
import './lib/installPrompt';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter/index.css';
// wdth build = weight 100–900 + width 62–125% axes (the expanded display voice).
import '@fontsource-variable/archivo/wdth.css';
import './index.css';
import App from './App.tsx';
import { useStore } from './store/useStore';
import { setHapticsEnabled } from './lib/haptics';
import { initAudio, setSoundFxEnabled } from './lib/sound';

// Keep the haptics + sound-effect flags in sync with settings — at boot AND
// whenever they change (Settings toggle, data import, cloud sync).
setHapticsEnabled(useStore.getState().settings.haptics);
setSoundFxEnabled(useStore.getState().settings.soundFx);
useStore.subscribe((s) => {
  setHapticsEnabled(s.settings.haptics);
  setSoundFxEnabled(s.settings.soundFx);
});

// Unlock the shared AudioContext on the first user gesture so timer chimes
// are audible on iOS (contexts started outside a gesture stay suspended).
initAudio();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
