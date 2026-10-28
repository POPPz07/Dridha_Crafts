import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface BadgeProps {
  variant?: "default" | "handcrafted" | "bestseller" | "new" | "sale" | "limited";
  children: ReactNode;
  className?: string;
}

const badgeVariants: Record<string, string> = {
  default: "bg-warmgrey text-charcoal",
  handcrafted: "bg-brand-green/10 text-brand-green border border-brand-green/20",
  bestseller: "bg-brand-gold/15 text-brand-brown border border-brand-gold/30",
  new: "bg-sage/20 text-brand-green-dark border border-sage/30",
  sale: "bg-terracotta/15 text-terracotta border border-terracotta/30",
  limited: "bg-brand-brown/10 text-brand-brown border border-brand-brown/20",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide uppercase",
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
