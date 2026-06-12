"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * Client-side "signed-in → dashboard" redirect for the landing root (`/`).
 *
 * The root used to call `getServerSession()` server-side and `redirect()`,
 * which read cookies and forced the page dynamic. To keep `/` static (and
 * CDN-fast for the common anonymous visitor) the session check moves to the
 * client. `/welcome` intentionally does NOT use this — it stays a public
 * landing even for signed-in users.
 */
export default function RedirectIfAuthed({ to = "/dashboard" }: { to?: string }) {
  const router = useRouter();
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) router.replace(to);
    });
    return () => {
      active = false;
    };
  }, [router, to]);
  return null;
}
