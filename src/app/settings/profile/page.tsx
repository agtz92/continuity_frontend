"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SettingsShell } from "@/components/settings/SettingsShell";

export default function ProfileSettingsPage() {
  const [email, setEmail] = useState<string>("—");
  const [createdAt, setCreatedAt] = useState<string>("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (u) {
        setEmail(u.email ?? "—");
        if (u.created_at) {
          setCreatedAt(new Date(u.created_at).toLocaleDateString());
        }
      }
    });
  }, []);

  return (
    <SettingsShell
      title="Profile"
      description="Your account information."
    >
      <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4">
        <Field label="Email" value={email} />
        {createdAt && <Field label="Member since" value={createdAt} />}
        <div className="pt-2 flex items-center gap-2 text-xs text-zinc-500">
          <User size={14} /> Editable profile fields are coming soon.
        </div>
      </section>
    </SettingsShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className="text-sm text-zinc-100">{value}</div>
    </div>
  );
}
