import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/App.tsx';
import { giz } from './giz.ts';
import './styles.css';

const root = document.getElementById('root');
if (root) createRoot(root).render(<StrictMode><App api={giz()} /></StrictMode>);
