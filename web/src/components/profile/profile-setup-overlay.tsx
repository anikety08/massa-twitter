"use client";

import { useMemo } from "react";
import { ProfileForm } from "@/components/profile/profile-form";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatAddress } from "@/lib/utils";
import type { Profile } from "@/lib/massa/types";
import { useWalletStore } from "@/state/wallet-store";

type ProfileSetupOverlayProps = {
  profile?: Profile | null;
  open: boolean;
  isLoading?: boolean;
};

export function ProfileSetupOverlay({
  profile,
  open,
  isLoading,
}: ProfileSetupOverlayProps) {
  const address = useWalletStore((state) => state.address);
  const disconnect = useWalletStore((state) => state.disconnect);

  const tips = useMemo(
    () => [
      "Pick a unique @handle between 3-32 characters.",
      "Upload an avatar so people can recognize you across the graph.",
      "Share a short bio that lives on-chain with your wallet identity.",
    ],
    [],
  );

  if (!open) return null;

  const handleSwitchWallet = () => {
    void disconnect();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-10 backdrop-blur-2xl">
      <div className="glass-panel relative w-full max-w-2xl space-y-6 p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
              On-chain identity
            </p>
            <h2 className="text-2xl font-semibold text-white">
              Claim your Massa profile
            </h2>
            <p className="text-sm text-slate-300">
              Set a unique name, avatar, and bio so friends know it&apos;s you.
              You can update everything later, but you need a profile to start
              posting.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <Avatar
              cid={profile?.avatarCid}
              fallback={profile?.displayName ?? "You"}
              size={64}
            />
            {address && (
              <Badge className="bg-white/10 px-4 py-1 text-xs text-white">
                {formatAddress(address)}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-300"
              onClick={handleSwitchWallet}
            >
              Switch wallet
            </Button>
          </div>
        </div>

        <ul className="space-y-1 rounded-3xl border border-white/5 bg-black/20 p-4 text-xs text-slate-300">
          {tips.map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <span className="mt-[2px] h-1.5 w-1.5 rounded-full bg-sky-400" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>

        {isLoading ? (
          <div className="rounded-3xl border border-white/5 bg-white/5 p-6 text-sm text-slate-400">
            Loading profile data…
          </div>
        ) : (
          <ProfileForm profile={profile} />
        )}

        <p className="text-center text-xs text-slate-500">
          Stored on Massa · Transparent · Editable anytime
        </p>
      </div>
    </div>
  );
}


