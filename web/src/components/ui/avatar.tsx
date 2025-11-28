"use client";

import Image from "next/image";
import type { HTMLAttributes } from "react";
import { cn, mediaFromCid } from "@/lib/utils";

type AvatarProps = HTMLAttributes<HTMLDivElement> & {
  cid?: string;
  fallback?: string;
  size?: number;
};

export function Avatar({
  cid,
  fallback,
  size = 48,
  className,
  ...props
}: AvatarProps) {
  const url = cid ? mediaFromCid(cid) : undefined;
  const initials = fallback
    ?.split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white",
        className,
      )}
      style={{ width: size, height: size }}
      {...props}
    >
      {url ? (
        <Image
          src={url}
          alt={fallback ?? "avatar"}
          width={size}
          height={size}
          className="rounded-full border border-white/10 object-cover"
        />
      ) : (
        <span>{initials ?? "?"}</span>
      )}
    </div>
  );
}


