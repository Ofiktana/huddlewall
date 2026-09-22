import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { HuddleProvider } from './context/HuddleContext';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HuddleProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HuddleProvider>
  </StrictMode>,
);
