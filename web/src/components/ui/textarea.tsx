"use client";

import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextArea({ className, ...props }: TextAreaProps) {
  return (
    <textarea
      className={cn(
        "w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70",
        className,
      )}
      {...props}
    />
  );
}


