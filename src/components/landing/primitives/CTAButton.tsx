"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "ghost" | "cream";
type Size = "md" | "lg";

type Props = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
};

// CSS-only hover/tap scale (was framer-motion) so CTAButton — rendered by the
// marketing nav on every page — doesn't drag framer into the marketing bundle.
// `motion-safe:` honors prefers-reduced-motion.
const base =
  "relative inline-flex items-center justify-center font-medium tracking-tight rounded-full transition-[transform,color,background-color,border-color,box-shadow] duration-200 will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ls-navy focus-visible:ring-ls-ochre disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary:
    "bg-ls-ochre text-ls-navy hover:bg-[#E4BC5F] shadow-[0_8px_30px_rgba(212,168,71,0.35)]",
  ghost:
    "bg-transparent text-ls-text-primary border border-white/20 hover:border-white/40 hover:bg-white/5",
  cream:
    "bg-ls-cream text-ls-navy hover:bg-[#FFF1D0] shadow-[0_8px_30px_rgba(245,230,200,0.25)]",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-base",
};

export default function CTAButton({
  children,
  href,
  onClick,
  variant = "primary",
  size = "lg",
  className = "",
  type = "button",
  disabled = false,
}: Props) {
  const interaction = disabled
    ? ""
    : "motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]";
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${interaction} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
