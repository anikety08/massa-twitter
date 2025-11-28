"use client";

import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/state/wallet-store";
import { formatAddress } from "@/lib/utils";
import { useState } from "react";

export function ConnectButton() {
  const { provider, address, connect, disconnect, isConnecting } =
    useWalletStore((state) => ({
      provider: state.provider,
      address: state.address,
      connect: state.connect,
      disconnect: state.disconnect,
      isConnecting: state.isConnecting,
    }));
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      if (provider) {
        await disconnect();
      } else {
        await connect();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant={provider ? "secondary" : "primary"} onClick={handleClick} disabled={busy || isConnecting}>
      {provider
        ? `Disconnect ${formatAddress(address)}`
        : isConnecting || busy
          ? "Connecting..."
          : "Connect Massa Wallet"}
    </Button>
  );
}


