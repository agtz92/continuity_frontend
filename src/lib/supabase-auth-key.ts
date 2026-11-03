/**
 * Cookie name for the Supabase auth session, pinned on every client.
 *
 * The SDK derives the default from the URL's first host label
 * (`sb-<label>-auth-token`). We now point NEXT_PUBLIC_SUPABASE_URL at the
 * custom domain `auth.continuu.it`, which would turn it into
 * `sb-auth-auth-token` and silently log every user out. Keeping the original
 * project-ref name preserves existing sessions.
 */
export const SUPABASE_AUTH_COOKIE = "sb-mhvmliwlhavjpdgpdzss-auth-token";
