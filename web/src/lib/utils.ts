import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address?: string, size = 6) {
  if (!address) return "";
  return `${address.slice(0, size)}…${address.slice(-size)}`;
}

export function timestampToRelative(timestamp: number) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const date = new Date(timestamp);
  return date.toLocaleDateString();
}

export function topicToLabel(topic: string) {
  return `#${topic.replace(/[^a-z0-9-_]/gi, "")}`;
}

export function mediaFromCid(cid?: string) {
  if (!cid) return "";
  const gateway =
    process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? "https://ipfs.io/ipfs/";
  return `${gateway}${cid}`;
}


