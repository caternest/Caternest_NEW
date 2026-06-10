import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (!localStorage.getItem('wiped_demo_caterers_v4')) {
    localStorage.removeItem('registrations');
    localStorage.removeItem('orders');
    localStorage.removeItem('demo_custom_menu');
    localStorage.removeItem('demo_custom_packages');
    localStorage.removeItem('users');
    localStorage.setItem('wiped_demo_caterers_v4', 'true');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
