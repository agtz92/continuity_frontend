"use client";

import { CreditCard } from "lucide-react";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { ComingSoon } from "@/components/settings/ComingSoon";

export default function BillingSettingsPage() {
  return (
    <SettingsShell
      title="Billing & plan"
      description="Manage your subscription, payment method, and invoices."
    >
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-5">
        <div className="text-xs text-zinc-500 mb-1">Current plan</div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-zinc-100 font-medium">Free</div>
            <div className="text-zinc-500 text-xs mt-0.5">
              Unlimited projects, tasks, and ideas while in beta.
            </div>
          </div>
          <button
            disabled
            className="px-3 py-1.5 text-xs rounded-lg border border-zinc-700 text-zinc-500 cursor-not-allowed"
          >
            Upgrade
          </button>
        </div>
      </div>
      <ComingSoon icon={CreditCard} message="Paid plans and invoices will live here." />
    </SettingsShell>
  );
}
