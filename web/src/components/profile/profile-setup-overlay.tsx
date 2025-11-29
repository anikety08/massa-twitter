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
    <div 
      className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-y-auto"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Full Page Header */}
      <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 flex items-center justify-center">
                <span className="text-white font-bold text-xl">✓</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Create Your Profile
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Set up your on-chain identity to start using Massa Social
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {address && (
                <Badge className="bg-white/10 px-3 py-1.5 text-xs text-white border border-white/20">
                  {formatAddress(address, 6)}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-white/10"
                onClick={handleSwitchWallet}
              >
                Switch wallet
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Tips */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-indigo-500/10 p-6">
                <h3 className="text-base font-semibold text-sky-300 mb-4 flex items-center gap-2">
                  <span className="text-sky-400 text-lg">💡</span>
                  Quick Tips
                </h3>
                <ul className="space-y-4">
                  {tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm text-slate-200">
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-sky-400 flex-shrink-0" />
                      <span className="leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <span className="text-sky-400 font-semibold">🔗</span> Your profile is stored on the Massa blockchain, making it transparent, decentralized, and editable anytime.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-sky-500 border-t-transparent mb-4"></div>
                <p className="text-slate-400">Loading profile data...</p>
              </div>
            ) : (
              <ProfileForm profile={profile} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


