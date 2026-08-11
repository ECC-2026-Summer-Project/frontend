import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/gobals.css';
import App from './App.jsx';
import { worker } from './mock/browser.ts';
import { Global } from '@emotion/react';

// TODO: 실제 백엔드가 생기면 이 mock 부트스트랩을 제거하고 항상 바로 렌더링하도록 되돌려야 함.
// 아직 백엔드가 없어 전체 기능이 MSW mock에 의존하고 있어서, 빌드/프리뷰(정적 배포)에서도
// 동작하도록 DEV 여부와 상관없이 worker를 켠다.
worker.start().then(() => {
  createRoot(document.getElementById('root')).render(
    <div>
      <Global />
      <App />
    </div>,
  );
});
