import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Session } from "@supabase/supabase-js";

/**
 * Server-side Supabase client that reads the user's session from cookies.
 * Used by the root page to render the landing for anonymous visitors and the
 * dashboard for authenticated ones — without a client-side redirect flash.
 *
 * We deliberately do NOT write cookies from here (the `set`/`remove` handlers
 * are no-ops). Auth state mutations still flow through the client SDK
 * (`src/lib/supabase.ts`); this helper only reads.
 */
function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  return async () => {
    const store = await cookies();
    return createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return store.getAll();
        },
        setAll() {
          // no-op: cookie writes happen on the client where the auth SDK runs
        },
      },
    });
  };
}

const createClient = getSupabaseServer();

export async function getServerSession(): Promise<Session | null> {
  try {
    const client = await createClient();
    const { data } = await client.auth.getSession();
    return data.session;
  } catch {
    return null;
  }
}
