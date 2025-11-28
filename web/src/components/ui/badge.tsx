"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-0.5 text-xs font-medium text-sky-200",
        className,
      )}
      {...props}
    />
  );
}


