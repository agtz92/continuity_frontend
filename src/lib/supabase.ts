"use client";

import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser-side Supabase client. Uses `@supabase/ssr` so the auth session is
 * persisted in cookies (not just localStorage), which lets the server-side
 * session check in `src/lib/supabase-server.ts` see it on the next request.
 *
 * If we used the plain `@supabase/supabase-js` client here, signing in would
 * work in the browser but the server would never see the session — landing on
 * `/dashboard` would bounce straight back to `/login` because the cookie was
 * never written. That's the bug this file fixes.
 */
export const supabase = createBrowserClient(url, anonKey);
