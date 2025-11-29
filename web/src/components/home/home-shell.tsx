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
  const address = useWalletStore((state) => state.address);
  const balance = useWalletStore((state) => state.balance);
  const error = useWalletStore((state) => state.error);

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
    retry: false,
    onError: (error) => {
      console.error("Failed to load recent posts:", error);
    },
  });

  const trendingQuery = useQuery({
    queryKey: ["topics"],
    queryFn: () => socialClient.listTrendingTopics(5),
    retry: false,
    onError: (error) => {
      console.error("Failed to load trending topics:", error);
    },
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6 lg:px-8">
      <header className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-slate-950/80 p-6 md:p-8 shadow-2xl shadow-indigo-950/30 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              M
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                Massa Social
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-white bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Decentralized Social Network
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-300 max-w-md">
            Connect your wallet to join the on-chain social layer. Post, follow, and message directly from your Massa wallet.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          {isAuthenticated && balance && (
            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-4 py-1.5 text-sm font-medium">
              💰 {balance} MAS
            </Badge>
          )}
          {!isAuthenticated && (
            <Badge className="bg-slate-800/50 text-slate-400 border border-slate-700/50 px-4 py-1.5 text-sm">
              ⚠️ Not Connected
            </Badge>
          )}
          <ConnectButton />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-6 min-w-0">
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
              <Card className="space-y-6 bg-gradient-to-br from-slate-900/80 via-indigo-950/50 to-slate-900/80 border-white/10 p-8 shadow-xl">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                      1
                    </div>
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                      Get Started
                    </p>
                  </div>
                  <h2 className="text-3xl font-bold text-white">
                    Join the Decentralized Social Network
                  </h2>
                  <p className="text-base text-slate-300 leading-relaxed">
                    Connect your Massa wallet to create your on-chain identity and start interacting with the community.
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <ConnectButton />
                    <div className="flex-1" />
                  </div>
                  <p className="text-xs text-slate-400">
                    💡 Don&apos;t have a wallet? <a href="https://station.massa.net/" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 underline">Install MassaStation</a> or <a href="https://bearby.io/" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 underline">Bearby</a>
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
                  {connectHighlights.map((item, index) => (
                    <div key={item} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-sky-500/20 to-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sky-400 text-sm">✓</span>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
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
            <Card className="text-sm text-slate-300 bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-white/10 p-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-white mb-2">Create Your Profile</h3>
                <p>
                  Connect your wallet to claim a Massa-native username, bio, avatar,
                  and banner that live entirely on-chain.
                </p>
              </div>
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

