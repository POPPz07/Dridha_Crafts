import { cn } from "@/lib/utils";
import type { ReactNode, HTMLAttributes } from "react";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  size?: "default" | "narrow" | "wide" | "full";
  as?: "div" | "section" | "main" | "article";
}

const containerSizes: Record<string, string> = {
  default: "max-w-[1400px]",
  narrow: "max-w-[900px]",
  wide: "max-w-[1600px]",
  full: "max-w-full",
};

export function Container({
  children,
  size = "default",
  as: Component = "div",
  className,
  ...props
}: ContainerProps) {
  return (
    <Component
      className={cn(
        "w-full mx-auto px-4 sm:px-6 lg:px-8",
        containerSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
