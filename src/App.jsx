// App.jsx
import { useState } from 'react';
import styled from '@emotion/styled';
import reactLogo from './assets/react.svg';
import viteLogo from './assets/vite.svg';
import heroImg from './assets/hero.png';
import './App.css';

// 스타일 컴포넌트 정의
const StyledButton = styled.button`
  background-color: #646cff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.6em 1.4em;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.25s;

  &:hover {
    background-color: #535bf2;
  }
`;

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.jsx</code> and save to test <code>HMR</code>
          </p>

          {/* 기존 button 대신 StyledButton 사용 */}
          <StyledButton onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </StyledButton>
        </div>
      </section>
    </>
  );
}

export default App;
