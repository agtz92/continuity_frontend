"use client";

import { motion } from "framer-motion";
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

const base =
  "relative inline-flex items-center justify-center font-medium tracking-tight transition-colors will-change-transform rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ls-navy focus-visible:ring-ls-ochre disabled:opacity-50 disabled:cursor-not-allowed";

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
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  const motionProps = {
    whileHover: disabled ? undefined : { scale: 1.02 },
    whileTap: disabled ? undefined : { scale: 0.98 },
    transition: { type: "spring" as const, stiffness: 400, damping: 28 },
  };

  if (href) {
    return (
      <motion.span {...motionProps} className="inline-block">
        <Link href={href} className={classes}>
          {children}
        </Link>
      </motion.span>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      {...motionProps}
    >
      {children}
    </motion.button>
  );
}
