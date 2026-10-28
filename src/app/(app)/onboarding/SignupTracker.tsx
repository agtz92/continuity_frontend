"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { trackEvent } from "@/lib/analyticsEvents";

// Una cuenta de Google se crea en el callback, justo antes de caer aquí.
const NEW_ACCOUNT_WINDOW_MS = 30 * 60 * 1000;
const TRACKED_KEY = "continuity:signup-tracked";

/**
 * Manda `sign_up` (method "google") la primera vez que una cuenta recién creada
 * con Google llega al onboarding. El registro por email se mide en `/login`, al
 * enviar el formulario: la confirmación suele abrirse en otro navegador y ahí
 * GA ya no sabe de dónde vino la persona.
 */
export function SignupTracker() {
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (!user || user.app_metadata?.provider !== "google") return;
      if (Date.now() - new Date(user.created_at).getTime() > NEW_ACCOUNT_WINDOW_MS) return;
      try {
        if (window.localStorage.getItem(TRACKED_KEY) === user.id) return;
        window.localStorage.setItem(TRACKED_KEY, user.id);
      } catch {
        // Storage bloqueado: a lo sumo se cuenta dos veces si recarga.
      }
      trackEvent("sign_up", { method: "google" });
    });
  }, []);
  return null;
}
