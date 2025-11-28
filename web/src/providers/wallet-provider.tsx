"use client";

import { ReactNode, useEffect } from "react";
import { useWalletStore } from "@/state/wallet-store";

type WalletProviderProps = {
  children: ReactNode;
};

export default function WalletProvider({ children }: WalletProviderProps) {
  const autoConnect = useWalletStore((state) => state.autoConnect);

  useEffect(() => {
    autoConnect().catch(() => {
      // silent failure, user can connect manually
    });
  }, [autoConnect]);

  return <>{children}</>;
}


