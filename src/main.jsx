import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { worker } from './mock/browser.ts';
import { Global } from '@emotion/react';

if (import.meta.env.DEV) {
  worker.start().then(() => {
    createRoot(document.getElementById('root')).render(
      <div>
        <Global />
        <App />
      </div>,
    );
  });
} else {
  createRoot(document.getElementById('root')).render(
    <div>
      <App />
    </div>,
  );
}
