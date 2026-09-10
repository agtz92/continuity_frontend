"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Loader2, Sparkles } from "lucide-react";
import type { Offering, Package } from "@revenuecat/purchases-js";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { PlanBadge } from "@/components/assistant/PlanBadge";
import { getUsage, type UsageSnapshot } from "@/lib/assistantApi";
import {
  getCurrentOffering,
  getManagementUrl,
  getPurchases,
  isWebBillingConfigured,
} from "@/lib/revenuecat";
import { daysUntil } from "@/lib/date";
import { toast } from "@/lib/toast";

type Period = "monthly" | "annual";
type PaidTier = "pro" | "studio";

/**
 * Package identifiers as configured in the RevenueCat offering.
 *
 * RevenueCat says "yearly" where we say "annual" everywhere else; the mapping
 * is pinned here so that vocabulary difference stays in one place instead of
 * leaking into the rest of the page.
 */
const PACKAGE_ID: Record<PaidTier, Record<Period, string>> = {
  pro: { monthly: "$pro_monthly", annual: "$pro_yearly" },
  studio: { monthly: "$studio_monthly", annual: "$studio_yearly" },
};

export default function BillingSettingsPage() {
  const t = useTranslations("settings.billing");
  const tAssistant = useTranslations("assistant.usage");
  const params = useSearchParams();
  const router = useRouter();

  const [usage, setUsage] = useState<UsageSnapshot | null>(null);
  const [period, setPeriod] = useState<Period>("monthly");
  const [offering, setOffering] = useState<Offering | null>(null);
  const [buying, setBuying] = useState(false);
  const [manageUrl, setManageUrl] = useState<string | null>(null);

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

  const plan = (usage?.plan ?? "free") as "free" | "pro" | "studio" | "admin";
  const isExempt = usage?.is_billing_exempt ?? false;
  const externallyManaged = usage?.externally_managed ?? false;
  const boughtInStore =
    usage?.billing_source === "apple" || usage?.billing_source === "google";

  // Prices come from RevenueCat, never from our own catalog: it knows the
  // customer's currency and any active discount, and hardcoding them here is
  // how a listed price drifts from the one actually charged.
  const canSell = isWebBillingConfigured() && !isExempt && !externallyManaged;

  useEffect(() => {
    if (!canSell || plan !== "free") return;
    let cancelled = false;
    getCurrentOffering()
      .then((o) => {
        if (!cancelled) setOffering(o);
      })
      .catch(() => {
        /* offerings unreachable — the page still shows plan and usage */
      });
    return () => {
      cancelled = true;
    };
  }, [canSell, plan]);

  // A web subscriber's portal link is per subscription, so only the SDK can
  // mint it. Store subscribers already got a usable URL from `/usage/`.
  useEffect(() => {
    if (!externallyManaged || boughtInStore) return;
    let cancelled = false;
    getManagementUrl()
      .then((url) => {
        if (!cancelled) setManageUrl(url);
      })
      .catch((e) => {
        // Never swallow this one. Managing and cancelling a subscription is
        // not optional — the stores require it — so a missing link has to be
        // diagnosable instead of just absent.
        console.error("[billing] could not resolve the management URL", e);
      });
    return () => {
      cancelled = true;
    };
  }, [externallyManaged, boughtInStore]);

  const buy = useCallback(
    async (tier: PaidTier, forPeriod: Period) => {
      const purchases = await getPurchases();
      const pkg: Package | undefined =
        offering?.packagesById?.[PACKAGE_ID[tier][forPeriod]];
      if (!purchases || !pkg) {
        toast.error(t("checkoutError"));
        return;
      }
      setBuying(true);
      try {
        await purchases.purchase({ rcPackage: pkg });
        toast.success(t("checkoutSuccess"));
        // The plan arrives through the webhook, which races this callback, so
        // poll briefly rather than showing a stale "free" right after paying.
        await pollUntilUpgraded(setUsage);
      } catch (e) {
        // Logged unconditionally: this is the only place the SDK's error
        // survives, and a purchase that fails with nothing on screen and
        // nothing in the console is the worst possible thing to debug.
        console.error("[billing] purchase failed", e);
        // The SDK throws on user-cancelled too; that isn't worth an error toast.
        if (!isUserCancelled(e)) toast.error(t("checkoutError"));
      } finally {
        setBuying(false);
      }
    },
    [offering, t]
  );

  // Arriving from the landing's pricing CTA (?upgrade=pro&period=annual).
  // Opens the purchase sheet once, for free accounts only.
  const autoFired = useRef(false);
  useEffect(() => {
    if (autoFired.current || !usage || !offering) return;
    const upgrade = params?.get("upgrade");
    const periodParam = params?.get("period");
    if (upgrade !== "pro" && upgrade !== "studio") return;
    if (periodParam !== "monthly" && periodParam !== "annual") return;
    if (!canSell || plan !== "free") return;
    autoFired.current = true;
    // Drop the params so a refresh doesn't reopen the sheet.
    router.replace("/settings/billing");
    setPeriod(periodParam);
    void buy(upgrade, periodParam);
  }, [params, usage, offering, canSell, plan, router, buy]);

  const cap = usage?.daily_message_cap ?? null;
  const used = usage?.messages_sent_today ?? 0;
  const monthlyCap = usage?.monthly_token_cap ?? null;
  const monthlyUsed = usage?.tokens_used_month ?? 0;
  const renewsAt = usage?.plan_renews_at ?? null;
  const cancelScheduled = usage?.cancel_at_period_end ?? false;
  const storeUrl = usage?.manage_url ?? null;
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

  const showUpgradeCards = canSell && plan === "free" && offering !== null;

  return (
    <SettingsShell title={t("title")} description={t("description")}>
      <div className="bg-surface border border-border rounded-lg p-5 mb-5">
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
        </div>

        {isExempt ? (
          <div className="text-xs text-text-muted mb-3">
            {t("exemptBlurb", { plan: planLabel })}
          </div>
        ) : externallyManaged ? (
          <div className="mb-3 rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text-muted">
            <div className="font-semibold text-text mb-0.5">
              {boughtInStore
                ? t("storeManagedTitle", { store: storeName })
                : t("portalManagedTitle")}
            </div>
            <div className="leading-snug">
              {boughtInStore
                ? t("storeManagedBlurb", { store: storeName })
                : t("portalManagedBlurb")}
              {renewsAt
                ? ` ${t("renewsAtWithDays", {
                    date: new Date(renewsAt).toLocaleDateString(),
                    days: Math.max(0, daysUntil(renewsAt) ?? 0),
                  })}`
                : ""}
            </div>
            {boughtInStore && storeUrl ? (
              <ManageLink href={storeUrl} label={t("manageInStore", { store: storeName })} />
            ) : null}
            {!boughtInStore ? (
              manageUrl ? (
                <ManageLink href={manageUrl} label={t("manageSubscription")} />
              ) : (
                // The portal link is minted per subscription and can come back
                // empty (no active subscription, SDK unreachable). Say where to
                // find it rather than rendering nothing: a paid subscriber with
                // no way to cancel is the worst state this page can be in.
                <div className="mt-1.5 italic">{t("portalUnavailable")}</div>
              )
            ) : null}
          </div>
        ) : cancelScheduled && renewsAt ? (
          <div className="mb-3 rounded-lg border border-signal-a50 bg-signal-a12 px-3 py-2 text-xs text-signal ">
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

      {showUpgradeCards && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-semibold text-text">
              {t("upgradeSectionTitle")}
            </h2>
            <BillingToggle period={period} onChange={setPeriod} />
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {(["pro", "studio"] as PaidTier[]).map((tier) => (
              <TierCard
                key={tier}
                tier={tier}
                pkg={offering?.packagesById?.[PACKAGE_ID[tier][period]]}
                popular={tier === "pro"}
                disabled={buying}
                onUpgrade={() => void buy(tier, period)}
              />
            ))}
          </div>
        </div>
      )}
    </SettingsShell>
  );
}

function ManageLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mt-1.5 inline-block font-medium text-accent hover:underline"
    >
      {label}
    </a>
  );
}

/**
 * `ErrorCode.UserCancelledError` from the SDK, inlined as its numeric value.
 *
 * Importing the enum would be a value import and would pull the whole SDK into
 * this page's initial bundle, undoing the dynamic import in `revenuecat.ts`.
 */
const USER_CANCELLED = 1;

/**
 * A cancelled purchase is a normal outcome, not a failure.
 *
 * The SDK reports it as an error, so without this the user gets a red toast
 * for closing a dialog they opened on purpose.
 *
 * The field matters: `purchasesErrorCode` carries `ErrorCode`, while
 * `errorCode` carries `PurchaseFlowErrorCode` — a different enum with no
 * cancellation value. This used to compare `errorCode` against the *string*
 * `"UserCancelledError"`, which could never match (both enums are numeric),
 * leaving a guessed regex over the message as the only filter — one that
 * silently swallowed any real error whose text happened to say "cancel".
 */
function isUserCancelled(e: unknown): boolean {
  return (e as { purchasesErrorCode?: number })?.purchasesErrorCode === USER_CANCELLED;
}

/** Wait for the webhook to promote the plan, up to ~10s. */
async function pollUntilUpgraded(
  setUsage: (u: UsageSnapshot) => void
): Promise<void> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      const snap = await getUsage();
      setUsage(snap);
      if (snap.has_subscription || snap.plan !== "free") return;
    } catch {
      /* keep trying up to the cap */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
}

function TierCard({
  tier,
  pkg,
  popular,
  disabled,
  onUpgrade,
}: {
  tier: PaidTier;
  pkg: Package | undefined;
  popular?: boolean;
  disabled: boolean;
  onUpgrade: () => void;
}) {
  const t = useTranslations(`landing.pricing.tiers.${tier}`);
  const tBilling = useTranslations("settings.billing");
  const perks = (t.raw("perks") as string[]).slice(0, 6);

  const product = pkg?.webBillingProduct;
  const price = product?.currentPrice?.formattedPrice ?? "—";
  const ctaLabel =
    tier === "pro" ? tBilling("upgradeToPro") : tBilling("upgradeToStudio");

  return (
    <div
      className={`relative rounded-lg border p-5 flex flex-col ${
        popular
          ? "border-[color-mix(in_srgb,var(--accent)_50%,transparent)] bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]"
          : "border-border bg-surface"
      }`}
    >
      {popular && (
        <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-accent text-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
          <Sparkles size={10} />
          {tBilling("popular")}
        </span>
      )}

      <h3 className="text-lg font-semibold text-text mb-1">{t("name")}</h3>

      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-3xl font-bold text-text">{price}</span>
      </div>

      <p className="text-xs text-text-muted mb-4">{t("inheritsFrom")}</p>

      <ul className="space-y-2 mb-5 flex-1">
        {perks.map((p) => (
          <li
            key={p}
            className="flex items-start gap-2 text-sm text-text leading-snug"
          >
            <Check size={14} className="mt-0.5 text-accent shrink-0" strokeWidth={3} />
            <span>{p}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        disabled={disabled || !pkg}
        onClick={onUpgrade}
        className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-opacity disabled:opacity-50 ${
          popular
            ? "bg-accent text-white hover:opacity-90"
            : "border border-border bg-surface text-text hover:bg-bg"
        }`}
      >
        {disabled && <Loader2 size={14} className="animate-spin" />}
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
    <div className="rounded-lg border border-border bg-well px-3 py-2">
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
