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
      const wallets = await safeGetWallets();
      const preferred =
        wallets.find((wallet) => wallet.enabled()) ?? wallets[0];
      if (!preferred) {
        throw new Error("No Massa-compatible wallet detected.");
      }

      const connected = await preferred.connect();
      if (!connected) {
        throw new Error("Wallet connection rejected.");
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
    const wallets = await safeGetWallets();
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
  const balance = await provider.balance(true);
  const network = await wallet.networkInfos();

  const accountListener = wallet.listenAccountChanges(async (address) => {
    if (!address) {
      set({
        provider: undefined,
        address: undefined,
        balance: undefined,
      });
      return;
    }
    await hydrateFromWallet(wallet, set, get);
  });

  const networkListener = wallet.listenNetworkChanges((nextNetwork) => {
    set({ network: nextNetwork });
  });

  set({
    wallet,
    provider,
    address: provider.address,
    balance: Mas.toString(balance, 4),
    network,
    listeners: {
      account: accountListener,
      network: networkListener,
    },
  });
}

