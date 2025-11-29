"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "w-full rounded-xl border border-white/10 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 transition-colors focus-visible:outline-none focus-visible:border-sky-500/50 focus-visible:ring-1 focus-visible:ring-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
