"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import type { Category, Idea, Priority } from "@/lib/types";
import { PRIORITIES } from "@/lib/types";
import { priorityDotClass } from "@/lib/priority";
import { Modal } from "@/components/ui/Modal";
import { Meta } from "@/components/ui/Meta";

/**
 * El **único modal ceremonioso del producto** (S06).
 *
 * Todo lo demás en continuu.it se captura sin fricción a propósito. Promover
 * una idea es la excepción, y la excepción tiene una razón: es el momento en
 * que algo deja de ser un "estaría bien" y pasa a ser un compromiso. El plan lo
 * dice como criterio de aceptación: **no se puede promover sin escribir la
 * primera acción**.
 *
 * La primera acción no es un campo nuevo — se guarda como el **siguiente paso**
 * del proyecto, que es exactamente lo que es. Un proyecto que nace sin
 * siguiente paso nace ya estancado.
 *
 * El candado vive aquí, en el cliente. El servidor acepta la mutación sin
 * primera acción para no romper la app nativa, que aún manda solo el id
 * (REDISENO_DECISIONES.md, D-55).
 */
export function PromoteIdeaModal({
  idea,
  categories,
  onClose,
  onPromote,
}: {
  idea: Idea;
  categories: Category[];
  onClose: () => void;
  onPromote: (
    id: string,
    extra: { firstAction: string; categoryId: string | null; priority: Priority }
  ) => Promise<boolean> | boolean;
}) {
  const t = useTranslations("views.ideas.promoteModal");
  const tPriority = useTranslations("priority");
  const tCommon = useTranslations("common");

  const [firstAction, setFirstAction] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [priority, setPriority] = useState<Priority>("medium");
  const [busy, setBusy] = useState(false);

  const ready = firstAction.trim().length > 0;

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    try {
      const ok = await onPromote(idea.id, {
        firstAction: firstAction.trim(),
        categoryId,
        priority,
      });
      if (ok) onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={t("title")}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={!ready || busy}
            className="flex-1 px-4 py-2 rounded-md bg-accent text-bg font-medium text-sm transition-colors duration-150 ease-out hover:bg-accent-hi disabled:opacity-40"
          >
            {t("cta")}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-md border border-border text-text-3 text-sm transition-colors duration-150 ease-out hover:text-text"
          >
            {tCommon("cancel")}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <Meta variant="cintillo" tone="faint" className="block">
            {t("becomes")}
          </Meta>
          <p className="font-display-app text-xl text-text mt-1">{idea.title}</p>
          {idea.why && (
            <p className="text-[15px] leading-[1.6] text-text-3 mt-2">
              → {idea.why}
            </p>
          )}
        </div>

        {/* La primera acción es lo único obligatorio, y va primero. */}
        <div>
          <label
            htmlFor="promote-first-action"
            className="flex items-baseline gap-2"
          >
            <Meta variant="cintillo" tone="muted">
              {t("firstAction")}
            </Meta>
            <Meta variant="cintillo" tone="inherit" className="text-signal">
              {t("required")}
            </Meta>
          </label>
          <input
            id="promote-first-action"
            value={firstAction}
            onChange={(e) => setFirstAction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void submit();
              }
            }}
            placeholder={t("firstActionPlaceholder")}
            autoFocus
            className="mt-1.5 w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text placeholder:text-text-off outline-none focus:border-accent"
          />
          <Meta tone="faint" className="mt-1 block">
            {t("firstActionHint")}
          </Meta>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex flex-col gap-1.5">
            <Meta variant="cintillo" tone="muted">
              {t("category")}
            </Meta>
            <select
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(e.target.value || null)}
              className="bg-bg border border-border rounded-md px-2 py-1.5 text-sm outline-none focus:border-accent"
            >
              <option value="">{t("noCategory")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-1.5">
            <Meta variant="cintillo" tone="muted">
              {t("priority")}
            </Meta>
            <div className="flex gap-1">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  aria-pressed={priority === p}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border transition-colors duration-150 ease-out ${
                    priority === p
                      ? "border-accent-a50 bg-accent-a12 text-text"
                      : "border-border text-text-4 hover:text-text-2"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`w-2 h-2 rounded-full ${priorityDotClass[p]}`}
                  />
                  <Meta variant="cintillo" tone="inherit">
                    {tPriority(p)}
                  </Meta>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
