"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { useTranslations } from "next-intl";
import { useMutation } from "@apollo/client";
import { ArrowLeft, Bug, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLocaleSync } from "@/hooks/useLocaleSync";
import { useThemeSync } from "@/hooks/useThemeSync";
import { usePaletteSync } from "@/hooks/usePaletteSync";
import { TopNav } from "@/components/layout/TopNav";
import { BugTopicSelect } from "@/components/BugTopicSelect";
import { SUBMIT_BUG_REPORT } from "@/lib/graphql";
import { BUG_TOPIC_VALUES } from "@/lib/bugTopics";
import { toast } from "@/lib/toast";

const MAX_MESSAGE_LEN = 4000;

export default function ReportBugPage() {
  useLocaleSync();
  useThemeSync();
  usePaletteSync();
  const router = useRouter();
  const t = useTranslations("reportBug");
  const tTopics = useTranslations("bugTopics");
  const tCommon = useTranslations("common");

  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
      if (!data.session) router.replace("/login?return_to=/report-bug");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) router.replace("/login?return_to=/report-bug");
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  const topicOptions = useMemo(
    () => BUG_TOPIC_VALUES.map((v) => tTopics(v)),
    [tTopics]
  );

  const [submit, { loading }] = useMutation(SUBMIT_BUG_REPORT, {
    onCompleted: () => {
      setSent(true);
    },
    onError: (e) => toast.error(e.message),
  });

  const canSubmit = topic.trim().length > 0 && message.trim().length > 0 && !loading;

  const handleSubmit = () => {
    if (!canSubmit) return;
    submit({
      variables: {
        data: {
          topic: topic.trim(),
          message: message.trim(),
          platform: "web",
        },
      },
    });
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-text-muted">
        {tCommon("loading")}
      </div>
    );
  }
  if (!session) return null;

  return (
    <div className="min-h-screen bg-bg text-text">
      <TopNav />
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-text-muted hover:text-text mb-6 text-sm group"
        >
          <ArrowLeft
            size={14}
            className="transition-transform group-hover:-translate-x-0.5"
          />
          {tCommon("backToDashboard")}
        </Link>

        <header className="mb-6 flex items-start gap-3">
          <div className="rounded-lg bg-accent/15 p-2 text-accent">
            <Bug size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="text-text-muted text-sm mt-1">{t("description")}</p>
          </div>
        </header>

        {sent ? (
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <CheckCircle2
              size={40}
              className="mx-auto text-emerald-500"
              aria-hidden="true"
            />
            <h2 className="mt-4 text-lg font-semibold">{t("successTitle")}</h2>
            <p className="mt-1 text-sm text-text-muted">{t("successBody")}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setTopic("");
                  setMessage("");
                  setSent(false);
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface"
              >
                {t("sendAnother")}
              </button>
              <Link
                href="/dashboard"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                {tCommon("backToDashboard")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t("topicLabel")}
              </label>
              <BugTopicSelect
                value={topic}
                onChange={setTopic}
                options={topicOptions}
                placeholder={t("topicPlaceholder")}
                disabled={loading}
              />
              <p className="mt-1 text-xs text-text-muted">{t("topicHint")}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t("messageLabel")}
              </label>
              <textarea
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value.slice(0, MAX_MESSAGE_LEN))
                }
                placeholder={t("messagePlaceholder")}
                rows={6}
                disabled={loading}
                className="bg-surface border border-border rounded-lg px-3 py-2 text-sm w-full resize-y"
              />
              <div className="mt-1 text-right text-xs text-text-muted">
                {message.length}/{MAX_MESSAGE_LEN}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t("sending") : t("submit")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
