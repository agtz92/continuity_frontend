"use client";

/**
 * RevenueCat Web Billing — the only way the web sells a subscription.
 *
 * There is no server checkout any more: the backend deliberately holds no
 * RevenueCat integration and only *receives* its webhook, so purchasing,
 * listing prices and reaching the customer portal all happen here in the
 * browser through `@revenuecat/purchases-js`.
 *
 * Two things this module is careful about:
 *
 * 1. **`appUserId` must be the Supabase user id.** It is what arrives in the
 *    webhook as `app_user_id`, and the backend resolves the account from it.
 *    Configure with anything else and the purchase is unattributable until a
 *    TRANSFER we deliberately don't automate — see `core/billing/store_webhooks.py`.
 * 2. **The SDK is imported lazily.** It only loads when someone actually opens
 *    the billing page, instead of riding along in the app bundle.
 *
 * Backend model: `docs/integracion-pagos-web-y-movil.md`.
 */

import type {
  CustomerInfo,
  Offering,
  Purchases,
} from "@revenuecat/purchases-js";
import { supabase } from "./supabase";

/** Public (publishable) key from RevenueCat → Web → the Billing app. */
const API_KEY = process.env.NEXT_PUBLIC_REVENUECAT_WEB_KEY ?? "";

/**
 * Whether the web can sell at all.
 *
 * Without the key the page still renders the current plan and usage — it just
 * can't offer to buy anything. Showing an upgrade button that throws on click
 * would be worse than showing none.
 */
export function isWebBillingConfigured(): boolean {
  return API_KEY.length > 0;
}

let configuredFor: string | null = null;
let instance: Purchases | null = null;

async function currentUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

/**
 * The configured SDK instance, or null when billing isn't set up or nobody
 * is signed in.
 *
 * `configure` throws if called twice, so the instance is cached and
 * `changeUser` handles the (rare) case of a different account in the same
 * tab — signing out and back in as someone else.
 */
export async function getPurchases(): Promise<Purchases | null> {
  if (!isWebBillingConfigured()) return null;

  const userId = await currentUserId();
  if (!userId) return null;

  const { Purchases: SDK } = await import("@revenuecat/purchases-js");

  if (instance && configuredFor === userId) return instance;
  if (instance) {
    await instance.changeUser(userId);
    configuredFor = userId;
    return instance;
  }

  instance = SDK.configure({ apiKey: API_KEY, appUserId: userId });
  configuredFor = userId;
  return instance;
}

/** The offering to show, or null if RevenueCat has none marked current. */
export async function getCurrentOffering(): Promise<Offering | null> {
  const purchases = await getPurchases();
  if (!purchases) return null;
  const offerings = await purchases.getOfferings();
  return offerings.current;
}

/**
 * Where this customer manages their subscription, straight from RevenueCat.
 *
 * This is the piece the server can't provide: the portal link is per
 * subscription and only the SDK (or an API call with a secret key) can mint
 * it. `/usage/`'s `manage_url` points here for web subscribers precisely so
 * this last hop happens where the SDK lives.
 */
export async function getManagementUrl(): Promise<string | null> {
  const purchases = await getPurchases();
  if (!purchases) return null;
  const info: CustomerInfo = await purchases.getCustomerInfo();
  return info.managementURL;
}
