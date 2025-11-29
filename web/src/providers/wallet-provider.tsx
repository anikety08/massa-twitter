"use client";

import { ReactNode, useEffect, useRef } from "react";
import { useWalletStore } from "@/state/wallet-store";

type WalletProviderProps = {
  children: ReactNode;
};

export default function WalletProvider({ children }: WalletProviderProps) {
  const autoConnect = useWalletStore((state) => state.autoConnect);
  const hasAttemptedAutoConnect = useRef(false);

  useEffect(() => {
    // Only attempt auto-connect once on mount and only in browser
    if (typeof window !== "undefined" && !hasAttemptedAutoConnect.current) {
      hasAttemptedAutoConnect.current = true;
      // Use a small delay to ensure wallet extensions are loaded
      const timer = setTimeout(() => {
        autoConnect().catch(() => {
          // silent failure, user can connect manually
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  return <>{children}</>;
}


