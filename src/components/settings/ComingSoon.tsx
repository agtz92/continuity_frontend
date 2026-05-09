import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  message,
}: {
  icon: LucideIcon;
  message: string;
}) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-6 py-12 text-center">
      <Icon size={28} className="mx-auto mb-3 text-zinc-600" />
      <p className="text-zinc-400 text-sm">{message}</p>
      <p className="text-zinc-600 text-xs mt-2">Coming soon.</p>
    </div>
  );
}
