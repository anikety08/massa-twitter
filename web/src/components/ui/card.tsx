"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/5 bg-white/5 p-6 shadow-xl shadow-blue-950/40 backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}


