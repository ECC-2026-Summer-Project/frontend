import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/gobals.css';
import App from './App.jsx';
import { Global } from '@emotion/react';

function renderApp() {
  createRoot(document.getElementById('root')).render(
    <div>
      <Global />
      <App />
    </div>,
  );
}

const useMock = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true';

// VITE_USE_MOCK=true일 때만 MSW를 켠다 (실제 백엔드로 붙을 땐 false).
// mock 코드를 동적 import로 분리해 실제 서버용 빌드에는 MSW 번들이 섞여 들어가지 않게 한다.
// (top-level await은 vite의 기본 build.target에서 지원되지 않을 수 있어 .then()으로 처리)
if (useMock) {
  import('./mock/browser.ts').then(({ worker }) =>
    worker.start().then(renderApp),
  );
} else {
  renderApp();
}
