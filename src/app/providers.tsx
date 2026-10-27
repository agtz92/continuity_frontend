"use client";

import { useEffect } from "react";
import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "@/lib/apollo";
import { clearCaptureStorage } from "@/lib/captureQueue";
import { supabase } from "@/lib/supabase";
import { Toaster } from "@/components/ui/Toaster";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function Providers({ children }: { children: React.ReactNode }) {
  // Cualquier cierre de sesión (botón, sesión expirada, otra pestaña) borra el
  // borrador y la cola de captura: no deben quedar para la siguiente cuenta.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") clearCaptureStorage();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <ApolloProvider client={apolloClient}>
      {children}
      <Toaster />
      <ConfirmDialog />
    </ApolloProvider>
  );
}
