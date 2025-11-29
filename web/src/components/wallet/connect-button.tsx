"use client";

import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/state/wallet-store";
import { formatAddress } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

export function ConnectButton() {
  const provider = useWalletStore((state) => state.provider);
  const address = useWalletStore((state) => state.address);
  const isConnecting = useWalletStore((state) => state.isConnecting);
  const error = useWalletStore((state) => state.error);
  const connect = useWalletStore((state) => state.connect);
  const disconnect = useWalletStore((state) => state.disconnect);
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      if (provider) {
        await disconnect();
        toast.success("Wallet disconnected");
      } else {
        await connect();
        toast.success("Wallet connected successfully!");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect wallet";
      toast.error(message);
      console.error("Wallet connection error:", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Button 
        variant={provider ? "secondary" : "primary"} 
        onClick={handleClick} 
        disabled={busy || isConnecting}
        size="lg"
        className="min-w-[180px]"
      >
        {provider
          ? `Disconnect ${formatAddress(address)}`
          : isConnecting || busy
            ? "Connecting..."
            : "Connect Wallet"}
      </Button>
      {error && !provider && (
        <p className="text-xs text-red-400 max-w-[180px] text-right">
          {error}
        </p>
      )}
    </div>
  );
}


