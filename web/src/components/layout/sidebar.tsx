"use client";

import { useState } from "react";
import { useWalletStore } from "@/state/wallet-store";
import { formatAddress } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  HomeIcon,
  SearchIcon,
  BellIcon,
  MessageIcon,
  ProfileIcon,
  MoreIcon,
  LogoIcon,
  WalletIcon,
  HashtagIcon,
  BookmarkIcon,
} from "@/components/ui/icons";

type NavItem = {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
};

type SidebarProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
  profile?: {
    handle?: string;
    displayName?: string;
    avatarCid?: string;
  } | null;
};

export function Sidebar({ activeTab, onTabChange, profile }: SidebarProps) {
  const address = useWalletStore((state) => state.address);
  const balance = useWalletStore((state) => state.balance);
  const provider = useWalletStore((state) => state.provider);
  const connect = useWalletStore((state) => state.connect);
  const disconnect = useWalletStore((state) => state.disconnect);
  const isConnecting = useWalletStore((state) => state.isConnecting);
  const [showMenu, setShowMenu] = useState(false);

  const isConnected = Boolean(provider && address);

  const navItems: NavItem[] = [
    {
      icon: <HomeIcon size={26} />,
      label: "Home",
      active: activeTab === "home",
      onClick: () => onTabChange("home"),
    },
    {
      icon: <HashtagIcon size={26} />,
      label: "Explore",
      active: activeTab === "explore",
      onClick: () => onTabChange("explore"),
    },
    {
      icon: <BellIcon size={26} />,
      label: "Notifications",
      active: activeTab === "notifications",
      onClick: () => onTabChange("notifications"),
    },
    {
      icon: <MessageIcon size={26} />,
      label: "Messages",
      active: activeTab === "messages",
      onClick: () => onTabChange("messages"),
    },
    {
      icon: <BookmarkIcon size={26} />,
      label: "Bookmarks",
      active: activeTab === "bookmarks",
      onClick: () => onTabChange("bookmarks"),
    },
    {
      icon: <ProfileIcon size={26} />,
      label: "Profile",
      active: activeTab === "profile",
      onClick: () => onTabChange("profile"),
    },
  ];

  return (
    <aside className="sticky top-0 flex h-screen w-[275px] flex-col justify-between border-r border-white/10 px-3 py-4">
      <div className="space-y-2">
        <div className="p-3">
          <LogoIcon size={32} />
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`flex w-full items-center gap-4 rounded-full px-4 py-3 text-xl transition-colors ${
                item.active
                  ? "font-bold text-white"
                  : "text-slate-200 hover:bg-white/10"
              }`}
            >
              <span className={item.active ? "text-sky-400" : ""}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex w-full items-center gap-4 rounded-full px-4 py-3 text-xl text-slate-200 transition-colors hover:bg-white/10"
          >
            <MoreIcon size={26} />
            <span>More</span>
          </button>
        </nav>

        {isConnected ? (
          <Button
            size="lg"
            className="mt-4 w-full rounded-full py-4 text-lg font-bold"
            onClick={() => onTabChange("compose")}
          >
            Post
          </Button>
        ) : (
          <Button
            size="lg"
            className="mt-4 w-full rounded-full py-4 text-lg font-bold"
            onClick={() => connect()}
            disabled={isConnecting}
          >
            <WalletIcon size={20} className="mr-2" />
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        )}
      </div>

      {isConnected && (
        <button
          onClick={() => disconnect()}
          className="group flex w-full items-center gap-3 rounded-full p-3 transition-colors hover:bg-white/10"
        >
          <Avatar
            cid={profile?.avatarCid}
            fallback={profile?.displayName || "User"}
            size={40}
            className="border-2 border-white/20"
          />
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-white truncate">
              {profile?.displayName || "Anonymous"}
            </p>
            <p className="text-xs text-slate-400 truncate">
              @{profile?.handle || formatAddress(address, 4)}
            </p>
          </div>
          {balance && (
            <span className="text-xs font-medium text-emerald-400">
              {balance} MAS
            </span>
          )}
        </button>
      )}
    </aside>
  );
}
