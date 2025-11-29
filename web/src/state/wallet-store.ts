"use client";

import { create } from "zustand";
import type { Provider, Network } from "@massalabs/massa-web3";
import { Mas } from "@massalabs/massa-web3";
import { getWallets, type Wallet } from "@massalabs/wallet-provider";
import type { ListenerCtrl } from "@massalabs/wallet-provider/dist/esm/wallet/types";

type WalletState = {
  wallet?: Wallet;
  provider?: Provider;
  address?: string;
  network?: Network;
  balance?: string;
  isConnecting: boolean;
  error?: string;
  listeners?: {
    account?: ListenerCtrl;
    network?: ListenerCtrl;
  };
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  autoConnect: () => Promise<void>;
};

const isBrowser = () => typeof window !== "undefined";

async function safeGetWallets(delay = 50): Promise<Wallet[]> {
  if (!isBrowser()) {
    return [];
  }
  try {
    return await getWallets(delay);
  } catch {
    return [];
  }
}

export const useWalletStore = create<WalletState>((set, get) => ({
  isConnecting: false,
  async connect() {
    set({ isConnecting: true, error: undefined });
    try {
      // Wait a bit for wallets to be available
      const wallets = await safeGetWallets(100);
      
      if (wallets.length === 0) {
        const errorMsg = "No Massa wallet detected. Please install MassaStation or Bearby wallet extension.";
        set({ error: errorMsg });
        throw new Error(errorMsg);
      }

      const preferred =
        wallets.find((wallet) => wallet.enabled()) ?? wallets[0];
      if (!preferred) {
        const errorMsg = "No enabled wallet found. Please enable your Massa wallet extension.";
        set({ error: errorMsg });
        throw new Error(errorMsg);
      }

      const connected = await preferred.connect();
      if (!connected) {
        const errorMsg = "Wallet connection was rejected. Please try again.";
        set({ error: errorMsg });
        throw new Error(errorMsg);
      }

      await hydrateFromWallet(preferred, set, get);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to connect wallet.";
      set({ error: message });
      throw error;
    } finally {
      set({ isConnecting: false });
    }
  },
  async disconnect() {
    const { wallet, listeners } = get();
    listeners?.account?.unsubscribe();
    listeners?.network?.unsubscribe();
    if (wallet) {
      try {
        await wallet.disconnect();
      } catch {
        // ignore
      }
    }
    set({
      wallet: undefined,
      provider: undefined,
      address: undefined,
      balance: undefined,
      network: undefined,
      listeners: undefined,
    });
  },
  async refreshBalance() {
    const { provider } = get();
    if (!provider) return;
    const balance = await provider.balance(true);
    set({ balance: Mas.toString(balance, 4) });
  },
  async autoConnect() {
    // Only run in browser environment
    if (!isBrowser()) {
      return;
    }
    
    try {
      const wallets = await safeGetWallets(100);
      for (const wallet of wallets) {
        try {
          if (wallet.enabled() && (await wallet.connected())) {
            await hydrateFromWallet(wallet, set, get);
            return;
          }
        } catch {
          // continue trying other wallets
        }
      }
    } catch (error) {
      // Silent failure for auto-connect
      console.debug("Auto-connect failed:", error);
    }
  },
}));

async function hydrateFromWallet(
  wallet: Wallet,
  set: (updater: Partial<WalletState>) => void,
  get: () => WalletState,
) {
  const previous = get().listeners;
  previous?.account?.unsubscribe();
  previous?.network?.unsubscribe();

  const accounts = await wallet.accounts();
  if (!accounts.length) {
    throw new Error("No accounts found in this wallet.");
  }
  const provider = accounts[0];
  const currentAddress = provider.address;
  const balance = await provider.balance(true);
  const network = await wallet.networkInfos();

  // Check if address changed to prevent unnecessary updates
  const existingAddress = get().address;
  if (existingAddress === currentAddress) {
    // Address hasn't changed, just update balance and network
    set({
      balance: Mas.toString(balance, 4),
      network,
    });
    return;
  }

  let isHydrating = false;
  // Check if listenAccountChanges is available before calling it
  let accountListener: ListenerCtrl | undefined;
  if (typeof wallet.listenAccountChanges === 'function') {
    try {
      accountListener = wallet.listenAccountChanges(async (address) => {
        // Prevent infinite loops by checking if we're already hydrating
        if (isHydrating) {
          return;
        }
        
        if (!address) {
          set({
            provider: undefined,
            address: undefined,
            balance: undefined,
          });
          return;
        }
        
        // Only re-hydrate if address actually changed
        const currentState = get();
        if (currentState.address === address) {
          return;
        }
        
        isHydrating = true;
        try {
          await hydrateFromWallet(wallet, set, get);
        } finally {
          isHydrating = false;
        }
      });
    } catch (error) {
      // If listenAccountChanges throws an error, continue without the listener
      console.warn("Account change listener not available:", error);
      accountListener = undefined;
    }
  }

  // Check if listenNetworkChanges is available before calling it
  let networkListener: ListenerCtrl | undefined;
  if (typeof wallet.listenNetworkChanges === 'function') {
    try {
      networkListener = wallet.listenNetworkChanges((nextNetwork) => {
        set({ network: nextNetwork });
      });
    } catch (error) {
      // If listenNetworkChanges throws an error, continue without the listener
      console.warn("Network change listener not available:", error);
      networkListener = undefined;
    }
  }

  set({
    wallet,
    provider,
    address: currentAddress,
    balance: Mas.toString(balance, 4),
    network,
    listeners: {
      account: accountListener,
      network: networkListener,
    },
  });
}

