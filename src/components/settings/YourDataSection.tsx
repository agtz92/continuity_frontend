"use client";

import { useEffect, useState } from "react";
import { useApolloClient } from "@apollo/client";
import { useLocale, useTranslations } from "next-intl";
import { Download, Trash2 } from "lucide-react";
import { MY_DATA_EXPORT } from "@/lib/graphql";
import {
  deleteConversation,
  listConversations,
  type ConversationListItem,
} from "@/lib/assistantApi";
import { toast } from "@/lib/toast";

/**
 * "Tus datos": descargar todo lo que guardamos (portabilidad) y borrar
 * conversaciones con Loop una a una. Las conversaciones no se ven en ningún
 * otro lado —el panel solo muestra la actual—, así que esta lista es la única
 * forma de saber cuáles quedan guardadas.
 */
export function YourDataSection() {
  const t = useTranslations("settings.yourData");
  const locale = useLocale();
  const apollo = useApolloClient();
  const [exporting, setExporting] = useState(false);
  const [conversations, setConversations] = useState<ConversationListItem[] | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    listConversations()
      .then(setConversations)
      .catch(() => setConversations([]));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await apollo.query<{ myDataExport: string }>({
        query: MY_DATA_EXPORT,
        fetchPolicy: "no-cache",
      });
      const blob = new Blob([data.myDataExport], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `continuuit-mis-datos-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("exportError"));
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteConversation(id);
      setConversations((cs) => (cs ?? []).filter((c) => c.id !== id));
      toast.success(t("conversationDeleted"));
    } catch {
      toast.error(t("deleteError"));
    } finally {
      setDeleting(null);
      setConfirming(null);
    }
  };

  return (
    <section className="bg-surface border border-border rounded-lg p-5 space-y-5">
      <div>
        <div className="text-xs text-text-muted mb-2">{t("title")}</div>
        <p className="text-sm text-text-muted">{t("exportBody")}</p>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-border hover:opacity-80 rounded-lg text-sm text-text transition-opacity disabled:opacity-50"
        >
          <Download size={14} />
          {exporting ? t("exporting") : t("export")}
        </button>
      </div>

      <div>
        <div className="text-xs text-text-muted mb-2">{t("conversationsTitle")}</div>
        {conversations === null ? null : conversations.length === 0 ? (
          <p className="text-sm text-text-muted">{t("noConversations")}</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {conversations.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-text">
                    {c.title || t("untitled")}
                  </div>
                  <div className="text-xs text-text-muted">
                    {new Date(c.updated_at).toLocaleDateString(locale)}
                  </div>
                </div>
                {confirming === c.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirming(null)}
                      className="text-xs text-text-muted hover:text-text"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      disabled={deleting === c.id}
                      className="rounded-md bg-signal px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50"
                    >
                      {t("confirmDelete")}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming(c.id)}
                    aria-label={t("delete")}
                    title={t("delete")}
                    className="p-1.5 text-text-muted hover:text-signal"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
