import React from 'react';
import ReactDOM from 'react-dom/client';
import { LazyMotion } from 'framer-motion';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

const loadMotionFeatures = () => import('./motionFeatures').then((mod) => mod.default);

registerSW({ immediate: true });

// Check if root element exists before rendering
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <LazyMotion features={loadMotionFeatures} strict>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </LazyMotion>
  </React.StrictMode>
);
