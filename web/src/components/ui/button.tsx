"use client";

import type { ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg shadow-indigo-900/30 hover:opacity-95",
        secondary:
          "bg-white/10 text-white border border-white/10 hover:bg-white/15",
        ghost: "text-slate-300 hover:bg-white/5",
        danger:
          "bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-900/30 hover:opacity-95",
      },
      size: {
        md: "text-sm",
        lg: "text-base px-6 py-3",
        sm: "text-xs px-4 py-1.5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonStyles> & {
    asChild?: boolean;
  };

export function Button({
  variant,
  size,
  className,
  asChild,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonStyles({ variant, size }), className)}
      {...props}
    />
  );
}

