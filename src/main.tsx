/**
 * @file main.tsx
 * @module ملف إضافي في النظام
 * @description ملف جزء من نظام MARO ERP. الوظيفة: main.tsx.
 */
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
