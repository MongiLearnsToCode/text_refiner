import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexReactClient } from 'convex/react';
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react';
import * as Sentry from '@sentry/react';
import { authClient } from '@/lib/auth-client';
import App from './App.tsx';
import './index.css';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.5,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
});

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      <Sentry.ErrorBoundary fallback={<p>An unexpected error occurred.</p>}>
        <App />
      </Sentry.ErrorBoundary>
    </ConvexBetterAuthProvider>
  </StrictMode>,
);
