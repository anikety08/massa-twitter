"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { socialClient } from "@/lib/massa/client";
import { useWalletStore } from "@/state/wallet-store";
import { ConnectButton } from "@/components/wallet/connect-button";
import { ProfileForm } from "@/components/profile/profile-form";
import { PostComposer } from "@/components/feed/post-composer";
import { PostList } from "@/components/feed/post-list";
import { TrendingTopics } from "@/components/trending/trending-topics";
import { UserSearch } from "@/components/search/user-search";
import { MessagePanel } from "@/components/messages/message-panel";
import { Badge } from "@/components/ui/badge";

export function HomeShell() {
  const { address, balance } = useWalletStore((state) => ({
    address: state.address,
    balance: state.balance,
  }));

  const profileQuery = useQuery({
    queryKey: ["profile", address],
    queryFn: () => (address ? socialClient.getProfile(address) : null),
    enabled: Boolean(address),
  });

  const feedQuery = useQuery({
    queryKey: ["feed", address],
    queryFn: () => (address ? socialClient.listFeed(address, 20) : []),
    enabled: Boolean(address),
  });

  const recentPostsQuery = useQuery({
    queryKey: ["posts", "recent"],
    queryFn: () => socialClient.listRecentPosts(20),
  });

  const trendingQuery = useQuery({
    queryKey: ["topics"],
    queryFn: () => socialClient.listTrendingTopics(5),
  });

  const posts = useMemo(() => {
    if (address && feedQuery.data?.length) {
      return feedQuery.data;
    }
    return recentPostsQuery.data ?? [];
  }, [address, feedQuery.data, recentPostsQuery.data]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-gradient-to-r from-indigo-800/60 to-slate-900/60 p-6 shadow-2xl shadow-indigo-950/20 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-slate-400">
            WaveHack · Massa Buildnet
          </p>
          <h1 className="text-3xl font-semibold text-white">
            Decentralized social graph
          </h1>
          <p className="text-sm text-slate-300">
            Wallet-native identity, transparent feeds, and encrypted messages.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          {balance && (
            <Badge className="bg-white/10 px-4 py-1 text-sm text-white">
              Balance: {balance} MAS
            </Badge>
          )}
          <ConnectButton />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-6">
          <PostComposer
            avatarCid={profileQuery.data?.avatarCid}
            displayName={profileQuery.data?.displayName}
          />
          <PostList
            posts={posts}
            viewer={address}
            emptyLabel="No posts yet. Be the first to create one!"
          />
        </section>

        <aside className="space-y-6">
          {address ? (
            <ProfileForm profile={profileQuery.data} />
          ) : (
            <div className="rounded-3xl border border-white/5 bg-white/5 p-5 text-sm text-slate-300">
              Connect your wallet to claim a Massa-native username, bio, avatar,
              and banners that live on-chain.
            </div>
          )}
          <TrendingTopics topics={trendingQuery.data} />
          <UserSearch />
          <MessagePanel />
        </aside>
      </div>
    </div>
  );
}


