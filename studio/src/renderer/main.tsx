import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { Root } from './components/Root.tsx';
import { giz } from './giz.ts';
import './styles.css';
import './screens.css';
import './stages.css';

const root = document.getElementById('root');
// The boundary's title is fixed text: when it shows, the translations may be what broke.
if (root) createRoot(root).render(<StrictMode><ErrorBoundary title="Algo deu errado · Something went wrong"><Root api={giz()} /></ErrorBoundary></StrictMode>);
