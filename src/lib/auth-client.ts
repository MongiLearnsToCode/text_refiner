import { createAuthClient } from "better-auth/react";
import {
  convexClient,
  crossDomainClient,
} from "@convex-dev/better-auth/client/plugins";

const authSiteUrl = import.meta.env.VITE_CONVEX_SITE_URL as string;

export const authClient = createAuthClient({
  baseURL: authSiteUrl,
  // Keep session state isolated per Convex deployment. This prevents a cached
  // cross-domain session from a previous deployment being treated as valid
  // after the frontend is repointed to a new Convex backend.
  plugins: [
    crossDomainClient({ storagePrefix: `finer-text:${new URL(authSiteUrl).hostname}` }),
    convexClient(),
  ],
});
