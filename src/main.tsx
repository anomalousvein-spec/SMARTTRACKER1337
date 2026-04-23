import React from 'react';
import ReactDOM from 'react-dom/client';
import { LazyMotion } from 'framer-motion';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

const loadMotionFeatures = () => import('./motionFeatures').then((mod) => mod.default);

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LazyMotion features={loadMotionFeatures} strict>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </LazyMotion>
  </React.StrictMode>
);
