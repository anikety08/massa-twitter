"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/state/wallet-store";
import { WalletIcon, VerifiedIcon, MessageIcon, HeartIcon } from "@/components/ui/icons";

export function WelcomeSection() {
  const connect = useWalletStore((state) => state.connect);
  const isConnecting = useWalletStore((state) => state.isConnecting);

  const handleConnect = async () => {
    try {
      await connect();
      toast.success("Wallet connected successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to connect wallet");
    }
  };

  const features = [
    {
      icon: <VerifiedIcon size={24} className="text-sky-400" />,
      title: "On-chain Identity",
      description: "Claim a unique handle that lives on the Massa blockchain",
    },
    {
      icon: <HeartIcon size={24} className="text-pink-400" />,
      title: "Decentralized Social",
      description: "Post, like, and follow without centralized control",
    },
    {
      icon: <MessageIcon size={24} className="text-green-400" />,
      title: "Direct Messages",
      description: "Message other users securely on-chain",
    },
  ];

  return (
    <div className="border-b border-white/10 p-6">
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-3">
            Welcome to Massa Social
          </h1>
          <p className="text-lg text-slate-300 max-w-lg mx-auto">
            The decentralized social network built on the Massa blockchain. 
            Connect your wallet to join the community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center text-center p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="p-3 rounded-full bg-white/10 mb-3">
                {feature.icon}
              </div>
              <h3 className="font-bold text-white mb-1">{feature.title}</h3>
              <p className="text-sm text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4">
          <Button
            size="lg"
            onClick={handleConnect}
            disabled={isConnecting}
            className="min-w-[250px] py-4 text-lg font-bold rounded-full"
          >
            <WalletIcon size={22} className="mr-2" />
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
          <p className="text-sm text-slate-400">
            Don't have a wallet?{" "}
            <a
              href="https://station.massa.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 underline"
            >
              Get MassaStation
            </a>
            {" "}or{" "}
            <a
              href="https://bearby.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 underline"
            >
              Bearby
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
