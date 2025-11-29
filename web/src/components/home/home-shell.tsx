"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { socialClient } from "@/lib/massa/client";
import { useWalletStore } from "@/state/wallet-store";
import { Sidebar } from "@/components/layout/sidebar";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { ProfileSetupOverlay } from "@/components/profile/profile-setup-overlay";
import { PostComposer } from "@/components/feed/post-composer";
import { PostList } from "@/components/feed/post-list";
import { MessagePanel } from "@/components/messages/message-panel";
import { ProfileForm } from "@/components/profile/profile-form";
import { WelcomeSection } from "@/components/home/welcome-section";
import type { Post } from "@/lib/massa/types";

export function HomeShell() {
  const address = useWalletStore((state) => state.address);
  const [activeTab, setActiveTab] = useState("home");

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

  const recentPostsQuery = useQuery<Post[]>({
    queryKey: ["posts", "recent"],
    queryFn: () => socialClient.listRecentPosts(20),
    retry: false,
  });

  const posts = useMemo(() => {
    if (isAuthenticated && feedQuery.data?.length) {
      return feedQuery.data;
    }
    return recentPostsQuery.data ?? [];
  }, [isAuthenticated, feedQuery.data, recentPostsQuery.data]);

  const hasProfile = Boolean(
    profileQuery.data?.handle && profileQuery.data?.displayName
  );

  const needsProfileSetup =
    isAuthenticated &&
    profileQuery.isFetched &&
    !profileQuery.isFetching &&
    !hasProfile;

  const renderMainContent = () => {
    switch (activeTab) {
      case "messages":
        return (
          <div className="min-h-screen">
            <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl px-4 py-3">
              <h1 className="text-xl font-bold text-white">Messages</h1>
            </header>
            <div className="p-4">
              <MessagePanel />
            </div>
          </div>
        );
      case "profile":
        return (
          <div className="min-h-screen">
            <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl px-4 py-3">
              <h1 className="text-xl font-bold text-white">Profile</h1>
              <p className="text-sm text-slate-400">@{profileQuery.data?.handle || "your-handle"}</p>
            </header>
            <div className="p-4">
              <ProfileForm profile={profileQuery.data} />
            </div>
          </div>
        );
      case "explore":
        return (
          <div className="min-h-screen">
            <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl px-4 py-3">
              <h1 className="text-xl font-bold text-white">Explore</h1>
            </header>
            <div className="p-4">
              <PostList
                posts={recentPostsQuery.data ?? []}
                viewer={address}
                emptyLabel="No posts to explore yet. Be the first to post!"
              />
            </div>
          </div>
        );
      case "notifications":
        return (
          <div className="min-h-screen">
            <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl px-4 py-3">
              <h1 className="text-xl font-bold text-white">Notifications</h1>
            </header>
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-6xl mb-4">🔔</div>
              <h2 className="text-2xl font-bold text-white mb-2">Nothing to see here — yet</h2>
              <p className="text-slate-400 max-w-sm">
                When someone likes or replies to your posts, you'll see it here.
              </p>
            </div>
          </div>
        );
      case "bookmarks":
        return (
          <div className="min-h-screen">
            <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl px-4 py-3">
              <h1 className="text-xl font-bold text-white">Bookmarks</h1>
            </header>
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-6xl mb-4">🔖</div>
              <h2 className="text-2xl font-bold text-white mb-2">Save posts for later</h2>
              <p className="text-slate-400 max-w-sm">
                Bookmark posts to easily find them again in the future.
              </p>
            </div>
          </div>
        );
      case "compose":
        return (
          <div className="min-h-screen">
            <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl px-4 py-3 flex items-center gap-4">
              <button
                onClick={() => setActiveTab("home")}
                className="text-white hover:bg-white/10 p-2 rounded-full transition-colors"
              >
                ←
              </button>
              <h1 className="text-xl font-bold text-white">Create Post</h1>
            </header>
            <div className="p-4">
              <PostComposer
                avatarCid={profileQuery.data?.avatarCid}
                displayName={profileQuery.data?.displayName}
                onSuccess={() => setActiveTab("home")}
              />
            </div>
          </div>
        );
      default:
        return (
          <div className="min-h-screen">
            <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
              <div className="flex border-b border-white/10">
                <button className="flex-1 py-4 text-center font-bold text-white relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-16 after:h-1 after:bg-sky-500 after:rounded-full">
                  For you
                </button>
                <button className="flex-1 py-4 text-center text-slate-400 hover:bg-white/5 transition-colors">
                  Following
                </button>
              </div>
            </header>
            {isAuthenticated ? (
              <>
                <div className="border-b border-white/10">
                  <PostComposer
                    avatarCid={profileQuery.data?.avatarCid}
                    displayName={profileQuery.data?.displayName}
                  />
                </div>
                <PostList
                  posts={posts}
                  viewer={address}
                  emptyLabel="No posts in your feed yet. Follow someone or create your first post!"
                />
              </>
            ) : (
              <>
                <WelcomeSection />
                <PostList
                  posts={posts}
                  viewer={undefined}
                  emptyLabel="Connect your wallet to see posts and join the community!"
                />
              </>
            )}
          </div>
        );
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-[1300px]">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        profile={profileQuery.data}
      />

      <main className="flex-1 border-r border-white/10 min-w-0">
        {renderMainContent()}
      </main>

      <RightSidebar />

      <ProfileSetupOverlay
        open={needsProfileSetup}
        profile={profileQuery.data}
        isLoading={profileQuery.isPending}
      />
    </div>
  );
}
