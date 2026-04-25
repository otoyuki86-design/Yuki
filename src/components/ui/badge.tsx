import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "secondary";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        variant === "default" && "bg-blue-600 text-white border-transparent",
        variant === "outline" && "border-current bg-transparent",
        variant === "secondary" && "bg-slate-100 text-slate-700 border-slate-200",
        className
      )}
      {...props}
    />
  );
}
