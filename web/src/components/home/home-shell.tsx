"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { socialClient } from "@/lib/massa/client";
import { useWalletStore } from "@/state/wallet-store";
import { ConnectButton } from "@/components/wallet/connect-button";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileSetupOverlay } from "@/components/profile/profile-setup-overlay";
import { PostComposer } from "@/components/feed/post-composer";
import { PostList } from "@/components/feed/post-list";
import { TrendingTopics } from "@/components/trending/trending-topics";
import { UserSearch } from "@/components/search/user-search";
import { MessagePanel } from "@/components/messages/message-panel";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function HomeShell() {
  const { address, balance, error } = useWalletStore((state) => ({
    address: state.address,
    balance: state.balance,
    error: state.error,
  }));

  const isAuthenticated = Boolean(address);

  const profileQuery = useQuery({
    queryKey: ["profile", address],
    queryFn: () => (address ? socialClient.getProfile(address) : null),
    enabled: isAuthenticated,
  });

  const feedQuery = useQuery({
    queryKey: ["feed", address],
    queryFn: () => (address ? socialClient.listFeed(address, 20) : []),
    enabled: isAuthenticated,
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
    if (isAuthenticated && feedQuery.data?.length) {
      return feedQuery.data;
    }
    return recentPostsQuery.data ?? [];
  }, [isAuthenticated, feedQuery.data, recentPostsQuery.data]);

  const hasProfile = Boolean(
    profileQuery.data?.handle && profileQuery.data?.displayName,
  );

  // Force profile onboarding right after a wallet connects.
  const needsProfileSetup =
    isAuthenticated &&
    profileQuery.isFetched &&
    !profileQuery.isFetching &&
    !hasProfile;

  const connectHighlights = [
    "Claim a unique on-chain username.",
    "Upload your avatar + banner over IPFS.",
    "Post, follow, and DM directly from your wallet.",
  ];

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
          {isAuthenticated && balance && (
            <Badge className="bg-white/10 px-4 py-1 text-sm text-white">
              Balance: {balance} MAS
            </Badge>
          )}
          {!isAuthenticated && (
            <Badge className="bg-white/5 px-4 py-1 text-sm text-white/80">
              Wallet disconnected
            </Badge>
          )}
          <ConnectButton />
          {error && (
            <p className="text-xs text-rose-300">
              {error}. Try another wallet or refresh.
            </p>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-6">
          {isAuthenticated ? (
            <>
              <PostComposer
                avatarCid={profileQuery.data?.avatarCid}
                displayName={profileQuery.data?.displayName}
              />
              <PostList
                posts={posts}
                viewer={address}
                emptyLabel="No posts yet. Be the first to create one!"
              />
            </>
          ) : (
            <>
              <Card className="space-y-4 bg-gradient-to-br from-slate-900/70 to-indigo-900/70">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                  Step 1 · Connect wallet
                </p>
                <h2 className="text-2xl font-semibold text-white">
                  You&apos;re one click away from the Massa social layer
                </h2>
                <p className="text-sm text-slate-300">
                  Link MassaStation, Bearby, or any compatible wallet to secure
                  your identity and start posting on-chain.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <ConnectButton />
                  <span className="text-xs text-slate-500">
                    No wallet? Install MassaStation first.
                  </span>
                </div>
                <ul className="space-y-2 text-sm text-slate-200">
                  {connectHighlights.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
              <PostList
                posts={posts}
                viewer={undefined}
                emptyLabel="The feed is warming up. Connect your wallet to follow more people."
              />
            </>
          )}
        </section>

        <aside className="space-y-6">
          {isAuthenticated ? (
            <ProfileForm profile={profileQuery.data} />
          ) : (
            <Card className="text-sm text-slate-300">
              Connect your wallet to claim a Massa-native username, bio, avatar,
              and banner that live entirely on-chain.
            </Card>
          )}
          <TrendingTopics topics={trendingQuery.data} />
          <UserSearch />
          <MessagePanel />
        </aside>
      </div>

      <ProfileSetupOverlay
        open={needsProfileSetup}
        profile={profileQuery.data}
        isLoading={profileQuery.isPending}
      />
    </div>
  );
}

