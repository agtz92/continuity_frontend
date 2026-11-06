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
  // borrador, la cola de captura y la caché de Apollo: no deben quedar para la
  // siguiente cuenta que entre en esta pestaña. `clearStore` no relanza queries.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_OUT") return;
      clearCaptureStorage();
      apolloClient.clearStore().catch(() => {});
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
