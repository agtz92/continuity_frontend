import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  variant?: "phone" | "card";
  className?: string;
  label?: string;
};

/**
 * Lightweight chrome around a feature mockup. `phone` mimics a mobile chat
 * surface (used for the Telegram/WhatsApp demo); `card` is a window-style
 * surface for desktop-feeling mockups (project card, AI chat panel).
 */
export default function DeviceFrame({
  children,
  variant = "card",
  className = "",
  label,
}: Props) {
  if (variant === "phone") {
    return (
      <div
        className={`relative mx-auto w-full max-w-sm rounded-[2.5rem] border border-white/10 bg-[#0F1426] p-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] ${className}`}
      >
        <div className="rounded-[2rem] bg-[#1A1F4D] overflow-hidden">
          {label ? (
            <div className="px-5 pt-4 pb-3 border-b border-white/5">
              <p className="text-xs text-ls-text-secondary tracking-wide uppercase">
                {label}
              </p>
            </div>
          ) : null}
          <div className="px-4 py-4">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-2xl border border-white/10 bg-[#0F1426]/80 backdrop-blur-md shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] overflow-hidden ${className}`}
    >
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        {label ? (
          <span className="ml-3 text-xs text-ls-text-secondary">{label}</span>
        ) : null}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
