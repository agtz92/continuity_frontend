"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@apollo/client";
import { useLocale, useTranslations } from "next-intl";
import { Check, Sparkles } from "lucide-react";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { PlanBadge } from "@/components/assistant/PlanBadge";
import { RetentionFlow } from "@/components/settings/RetentionFlow";
import { DowngradeConfirmModal } from "@/components/settings/DowngradeConfirmModal";
import { SwitchPeriodModal } from "@/components/settings/SwitchPeriodModal";
import {
  CREATE_CHECKOUT_SESSION,
  CREATE_PORTAL_SESSION,
  REACTIVATE_SUBSCRIPTION,
} from "@/lib/graphql";
import { getUsage, type UsageSnapshot } from "@/lib/assistantApi";
import { useBillingErrorMessage } from "@/lib/billingErrors";
import { daysUntil } from "@/lib/date";
import { toast } from "@/lib/toast";

type Period = "monthly" | "annual";
type PaidTier = "pro" | "studio";

export default function BillingSettingsPage() {
  const t = useTranslations("settings.billing");
  const tAssistant = useTranslations("assistant.usage");
  const locale = useLocale();
  const billingError = useBillingErrorMessage();
  const params = useSearchParams();
  const router = useRouter();
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);
  const [period, setPeriod] = useState<Period>("monthly");

  const refetchUsage = useCallback(() => {
    getUsage()
      .then(setUsage)
      .catch(() => {
        /* swallow — assistant might be offline */
      });
  }, []);

  useEffect(() => {
    refetchUsage();
  }, [refetchUsage]);

  const [showRetention, setShowRetention] = useState(false);
  const [showDowngrade, setShowDowngrade] = useState(false);
  const [showSwitchPeriod, setShowSwitchPeriod] = useState(false);

  // Handle the return from Stripe Checkout. On success, the webhook that
  // promotes the plan (`checkout.session.completed`) is asynchronous and races
  // with this redirect, so the first `usage` read is almost always still
  // "free". Poll briefly until the subscription shows up so the UI reflects the
  // new plan without a manual reload. Guarded so it runs once per return.
  const returnHandledRef = useRef(false);
  useEffect(() => {
    const status = params?.get("status");
    if (!status || returnHandledRef.current) return;
    returnHandledRef.current = true;

    if (status === "cancelled") {
      toast.info(t("checkoutCancelled"));
      return;
    }
    if (status !== "success") return;

    toast.success(t("checkoutSuccess"));

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 6; // ~ up to 10s of webhook lag (immediate + 5×2s)
    const poll = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        const snap = await getUsage();
        if (cancelled) return;
        setUsage(snap);
        // Stop as soon as the subscription is reflected.
        if (snap.has_subscription || snap.plan !== "free") return;
      } catch {
        /* assistant might be offline — keep retrying up to the cap */
      }
      if (!cancelled && attempts < MAX_ATTEMPTS) {
        setTimeout(poll, 2000);
      }
    };
    void poll();

    return () => {
      cancelled = true;
    };
  }, [params, t]);

  const [createCheckout, { loading: checkingOut }] = useMutation(
    CREATE_CHECKOUT_SESSION,
    {
      onCompleted: (data) => {
        const url = data?.createCheckoutSession?.url;
        if (url) window.location.assign(url);
      },
      onError: (e) => {
        const code = e.graphQLErrors?.[0]?.extensions?.code;
        toast.error(code ? billingError(e) : t("checkoutError"));
      },
    }
  );
  const [createPortal, { loading: openingPortal }] = useMutation(
    CREATE_PORTAL_SESSION,
    {
      onCompleted: (data) => {
        const url = data?.createPortalSession?.url;
        if (url) window.location.assign(url);
      },
      onError: (e) => {
        const code = e.graphQLErrors?.[0]?.extensions?.code;
        toast.error(code ? billingError(e) : t("portalError"));
      },
    }
  );
  const [reactivate, { loading: reactivating }] = useMutation(
    REACTIVATE_SUBSCRIPTION,
    {
      onCompleted: () => {
        toast.success(t("reactivateSuccess"));
        refetchUsage();
      },
      onError: (e) => toast.error(billingError(e)),
    }
  );

  // Auto-checkout when arriving from the landing pricing CTA
  // (?upgrade=pro|studio&period=monthly|annual). Only fires once per visit
  // and only for free users — exempt, store-managed or already-paid accounts
  // ignore it.
  const [autoCheckoutFired, setAutoCheckoutFired] = useState(false);
  useEffect(() => {
    if (autoCheckoutFired || !usage) return;
    const upgrade = params?.get("upgrade");
    const periodParam = params?.get("period");
    if (!upgrade || !periodParam) return;
    if (usage.is_billing_exempt) return;
    if (usage.store_managed) return;
    if (usage.plan !== "free") return;
    const planEnum = upgrade.toUpperCase();
    const periodEnum = periodParam.toUpperCase();
    if (!["PRO", "STUDIO"].includes(planEnum)) return;
    if (!["MONTHLY", "ANNUAL"].includes(periodEnum)) return;
    setAutoCheckoutFired(true);
    // Drop `?upgrade=…` from the history entry *before* leaving for Stripe.
    // Otherwise the entry survives, and pressing Back after paying returns
    // here while the webhook has not promoted the plan yet — `plan` still
    // reads "free", this effect fires again, and the user ends up with two
    // parallel subscriptions and two charges. `replace` (not `push`) is what
    // makes the offending entry unreachable.
    router.replace("/settings/billing");
    createCheckout({
      variables: { plan: planEnum, period: periodEnum, locale },
    });
  }, [params, usage, autoCheckoutFired, createCheckout, locale, router]);

  const plan = (usage?.plan ?? "free") as
    | "free"
    | "pro"
    | "studio"
    | "admin";
  const cap = usage?.daily_message_cap ?? null;
  const used = usage?.messages_sent_today ?? 0;
  const monthlyCap = usage?.monthly_token_cap ?? null;
  const monthlyUsed = usage?.tokens_used_month ?? 0;
  const isExempt = usage?.is_billing_exempt ?? false;
  const hasSubscription = usage?.has_subscription ?? false;
  const renewsAt = usage?.plan_renews_at ?? null;
  const subscriptionPeriod = usage?.subscription_period ?? null;
  const cancelScheduled = usage?.cancel_at_period_end ?? false;
  // Apple and Google own the payment method, the plan switcher and the
  // cancel button for anything bought in their stores. We can show the plan
  // here, but every control has to point back at the store — our Stripe
  // portal knows nothing about that subscription.
  const storeManaged = usage?.store_managed ?? false;
  const storeName =
    usage?.billing_source === "apple"
      ? t("storeApple")
      : usage?.billing_source === "google"
      ? t("storeGoogle")
      : "";

  const planLabel =
    plan === "studio"
      ? t("studio")
      : plan === "admin"
      ? t("admin")
      : plan === "pro"
      ? t("pro")
      : t("free");

  const handleUpgrade = (tier: PaidTier) =>
    createCheckout({
      variables: {
        plan: tier.toUpperCase(),
        period: period.toUpperCase(),
        locale,
      },
    });

  // Show in-app upgrade cards only for free users. Paid users (pro/studio)
  // change plans through the Stripe Customer Portal instead — creating a
  // brand-new checkout for an existing customer would spawn a parallel
  // subscription, not upgrade the current one.
  const showUpgradeCards = !isExempt && !storeManaged && plan === "free";
  const tiersToShow: PaidTier[] = showUpgradeCards ? ["pro", "studio"] : [];

  return (
    <SettingsShell title={t("title")} description={t("description")}>
      {/* Current plan banner */}
      <div className="bg-surface/50 border border-border rounded-xl p-5 mb-5">
        <div className="text-xs text-text-muted mb-1">{t("currentPlan")}</div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="text-text font-medium">{planLabel}</div>
            <PlanBadge plan={plan} />
            {isExempt && (
              <span className="rounded-md border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                {t("exemptBadge")}
              </span>
            )}
          </div>
          {hasSubscription && !isExempt && !storeManaged && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                disabled={openingPortal}
                onClick={() => createPortal({ variables: { locale } })}
                className="px-3 py-1.5 text-xs rounded-lg border border-border bg-surface text-text font-medium hover:bg-bg disabled:opacity-50"
              >
                {t("manageSubscription")}
              </button>
              {!cancelScheduled && plan === "studio" && (
                <button
                  type="button"
                  onClick={() => setShowDowngrade(true)}
                  className="px-3 py-1.5 text-xs rounded-lg text-text-muted hover:text-text hover:bg-bg"
                >
                  {t("downgradeToProButton")}
                </button>
              )}
              {!cancelScheduled && (plan === "pro" || plan === "studio") && (
                <button
                  type="button"
                  onClick={() => setShowRetention(true)}
                  className="px-3 py-1.5 text-xs rounded-lg text-text-muted hover:text-text hover:bg-bg"
                >
                  {t("cancelSubscription")}
                </button>
              )}
              {cancelScheduled && (
                <button
                  type="button"
                  disabled={reactivating}
                  onClick={() => reactivate()}
                  className="px-3 py-1.5 text-xs rounded-lg bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {t("reactivate")}
                </button>
              )}
            </div>
          )}
        </div>

        {isExempt ? (
          <div className="text-xs text-text-muted mb-3">
            {t("exemptBlurb", { plan: planLabel })}
          </div>
        ) : storeManaged ? (
          <div className="mb-3 rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text-muted">
            <div className="font-semibold text-text mb-0.5">
              {t("storeManagedTitle", { store: storeName })}
            </div>
            <div className="leading-snug">
              {t("storeManagedBlurb", { store: storeName })}
              {renewsAt
                ? ` ${t("renewsAtWithDays", {
                    date: new Date(renewsAt).toLocaleDateString(),
                    days: Math.max(0, daysUntil(renewsAt) ?? 0),
                  })}`
                : ""}
            </div>
          </div>
        ) : cancelScheduled && renewsAt ? (
          <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            <div className="font-semibold mb-0.5">{t("cancelScheduled")}</div>
            <div className="leading-snug">
              {t("cancelScheduledBlurb", {
                plan: planLabel,
                date: new Date(renewsAt).toLocaleDateString(),
                days: Math.max(0, daysUntil(renewsAt) ?? 0),
              })}
            </div>
          </div>
        ) : plan === "free" ? (
          <div className="text-xs text-text-muted mb-3">{t("freeBlurb")}</div>
        ) : renewsAt ? (
          <div className="text-xs text-text-muted mb-3">
            {t("renewsAtWithDays", {
              date: new Date(renewsAt).toLocaleDateString(),
              days: Math.max(0, daysUntil(renewsAt) ?? 0),
            })}
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <UsageRow
            label={tAssistant("dailyMessages")}
            value={cap == null ? `${used}` : `${used} / ${cap}`}
          />
          <UsageRow
            label={tAssistant("monthlyTokens")}
            value={
              monthlyCap == null
                ? formatNumber(monthlyUsed)
                : `${formatNumber(monthlyUsed)} / ${formatNumber(monthlyCap)}`
            }
          />
        </div>
      </div>

      {/* Retention / cancel flow modal */}
      {(plan === "pro" || plan === "studio") && (
        <RetentionFlow
          open={showRetention}
          onClose={() => setShowRetention(false)}
          plan={plan}
          hadRetentionOffer={usage?.had_retention_offer ?? false}
          renewsAt={renewsAt}
          onChange={refetchUsage}
        />
      )}

      {/* Studio → Pro downgrade confirm modal */}
      {plan === "studio" && (
        <DowngradeConfirmModal
          open={showDowngrade}
          onClose={() => setShowDowngrade(false)}
          onSuccess={refetchUsage}
        />
      )}

      {/* Monthly ↔ Annual period switch modal */}
      {(plan === "pro" || plan === "studio") && subscriptionPeriod && (
        <SwitchPeriodModal
          open={showSwitchPeriod}
          onClose={() => setShowSwitchPeriod(false)}
          onSuccess={refetchUsage}
          plan={plan}
          currentPeriod={subscriptionPeriod}
        />
      )}

      {/* Billing period card (only for paid users with a known period) */}
      {!isExempt &&
        (plan === "pro" || plan === "studio") &&
        subscriptionPeriod && (
          <div className="bg-surface/50 border border-border rounded-xl p-5 mb-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs text-text-muted mb-1">
                  {t("billingPeriod.label")}
                </div>
                <div className="text-sm text-text font-medium">
                  {subscriptionPeriod === "annual"
                    ? t("billingPeriod.currentAnnual")
                    : t("billingPeriod.currentMonthly")}
                </div>
                {subscriptionPeriod === "monthly" && (
                  <div className="text-xs text-accent mt-1">
                    {t("billingPeriod.annualSavingsHint")}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowSwitchPeriod(true)}
                className="px-3 py-1.5 text-xs rounded-lg border border-border bg-surface text-text font-medium hover:bg-bg"
              >
                {subscriptionPeriod === "monthly"
                  ? t("billingPeriod.switchToAnnual")
                  : t("billingPeriod.switchToMonthly")}
              </button>
            </div>
          </div>
        )}

      {/* Upgrade cards */}
      {showUpgradeCards && tiersToShow.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-semibold text-text">
              {plan === "free"
                ? t("upgradeSectionTitle")
                : t("upgradeSectionTitlePro")}
            </h2>
            <BillingToggle period={period} onChange={setPeriod} />
          </div>

          <div
            className={`grid gap-4 ${
              tiersToShow.length === 2
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1"
            }`}
          >
            {tiersToShow.map((tier) => (
              <TierCard
                key={tier}
                tier={tier}
                period={period}
                popular={tier === "pro" && plan === "free"}
                disabled={checkingOut}
                onUpgrade={() => handleUpgrade(tier)}
              />
            ))}
          </div>
        </div>
      )}
    </SettingsShell>
  );
}

function TierCard({
  tier,
  period,
  popular,
  disabled,
  onUpgrade,
}: {
  tier: PaidTier;
  period: Period;
  popular?: boolean;
  disabled: boolean;
  onUpgrade: () => void;
}) {
  const t = useTranslations(`landing.pricing.tiers.${tier}`);
  const tBilling = useTranslations("settings.billing");
  const perks = (t.raw("perks") as string[]).slice(0, 6);

  const price = period === "annual" ? t("priceAnnual") : t("price");
  const cadence =
    period === "annual" ? t("priceCadenceAnnual") : t("priceCadence");
  const ctaLabel =
    tier === "pro" ? tBilling("upgradeToPro") : tBilling("upgradeToStudio");

  return (
    <div
      className={`relative rounded-xl border p-5 flex flex-col ${
        popular
          ? "border-[color-mix(in_srgb,var(--accent)_50%,transparent)] bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]"
          : "border-border bg-surface/40"
      }`}
    >
      {popular && (
        <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-accent text-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
          <Sparkles size={10} />
          {tBilling("popular")}
        </span>
      )}

      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-lg font-semibold text-text">{t("name")}</h3>
      </div>

      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-3xl font-bold text-text">{price}</span>
        <span className="text-xs text-text-muted">{cadence}</span>
      </div>

      <p className="text-xs text-text-muted mb-4">{t("inheritsFrom")}</p>

      <ul className="space-y-2 mb-5 flex-1">
        {perks.map((p) => (
          <li
            key={p}
            className="flex items-start gap-2 text-sm text-text leading-snug"
          >
            <Check
              size={14}
              className="mt-0.5 text-accent shrink-0"
              strokeWidth={3}
            />
            <span>{p}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        disabled={disabled}
        onClick={onUpgrade}
        className={`w-full px-4 py-2 text-sm rounded-lg font-medium transition-opacity disabled:opacity-50 ${
          popular
            ? "bg-accent text-white hover:opacity-90"
            : "border border-border bg-surface text-text hover:bg-bg"
        }`}
      >
        {ctaLabel}
      </button>
    </div>
  );
}

function BillingToggle({
  period,
  onChange,
}: {
  period: Period;
  onChange: (p: Period) => void;
}) {
  const t = useTranslations("settings.billing");
  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex rounded-full border border-border bg-surface p-1">
        <button
          type="button"
          onClick={() => onChange("monthly")}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            period === "monthly"
              ? "bg-accent text-white font-medium"
              : "text-text-muted hover:text-text"
          }`}
        >
          {t("billingMonthly")}
        </button>
        <button
          type="button"
          onClick={() => onChange("annual")}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            period === "annual"
              ? "bg-accent text-white font-medium"
              : "text-text-muted hover:text-text"
          }`}
        >
          {t("billingAnnual")}
        </button>
      </div>
      {period === "annual" && (
        <span className="text-xs text-accent">{t("billingAnnualHint")}</span>
      )}
    </div>
  );
}

function UsageRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-text-muted">
        {label}
      </div>
      <div className="text-sm text-text font-medium mt-0.5">{value}</div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
