import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter/index.css';
import '@fontsource/metal-mania/index.css';
import './index.css';
import App from './App.tsx';
import { useStore } from './store/useStore';
import { setHapticsEnabled } from './lib/haptics';

// Apply persisted haptics preference before first paint.
setHapticsEnabled(useStore.getState().settings.haptics);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
