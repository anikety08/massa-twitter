"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { socialClient } from "@/lib/massa/client";
import { useWalletStore } from "@/state/wallet-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { SearchIcon, TrendingIcon } from "@/components/ui/icons";
import type { Profile, TopicStat } from "@/lib/massa/types";
import { topicToLabel } from "@/lib/utils";

export function RightSidebar() {
  const address = useWalletStore((state) => state.address);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const trendingQuery = useQuery<TopicStat[]>({
    queryKey: ["topics"],
    queryFn: () => socialClient.listTrendingTopics(5),
    retry: false,
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const profiles = await socialClient.searchProfiles(searchQuery.trim(), 5);
      setSearchResults(profiles);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <aside className="sticky top-0 h-screen w-[350px] space-y-4 overflow-y-auto border-l border-white/10 p-4">
      <form onSubmit={handleSearch} className="relative">
        <SearchIcon
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <Input
          type="text"
          placeholder="Search users"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-full bg-slate-800/80 border-white/10 py-3 pl-12 pr-4 text-white placeholder:text-slate-400 focus:border-sky-500/50 focus:bg-slate-900"
        />
      </form>

      {searchResults.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
          <h3 className="mb-3 font-bold text-white">Search Results</h3>
          <div className="space-y-3">
            {searchResults.map((profile) => (
              <div
                key={profile.address}
                className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/5 transition-colors"
              >
                <Avatar
                  cid={profile.avatarCid}
                  fallback={profile.displayName}
                  size={40}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">
                    {profile.displayName}
                  </p>
                  <p className="text-sm text-slate-400 truncate">
                    @{profile.handle}
                  </p>
                </div>
                <Button size="sm" variant="secondary" className="rounded-full">
                  View
                </Button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setSearchResults([])}
            className="mt-3 text-sm text-sky-400 hover:text-sky-300"
          >
            Clear results
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingIcon size={20} className="text-sky-400" />
          <h3 className="text-xl font-bold text-white">Trending</h3>
        </div>
        {trendingQuery.data && trendingQuery.data.length > 0 ? (
          <div className="space-y-4">
            {trendingQuery.data.map((topic, index) => (
              <div
                key={topic.topic}
                className="group cursor-pointer hover:bg-white/5 rounded-lg p-2 -mx-2 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    {index + 1} · Trending on Massa
                  </p>
                  <MoreOptionsButton />
                </div>
                <p className="font-bold text-white group-hover:text-sky-400 transition-colors">
                  {topicToLabel(topic.topic)}
                </p>
                <p className="text-sm text-slate-400">
                  {topic.score} {topic.score === 1 ? "post" : "posts"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            No trending topics yet. Start posting to create trends!
          </p>
        )}
        <button className="mt-4 text-sm text-sky-400 hover:text-sky-300 transition-colors">
          Show more
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <h3 className="mb-4 text-xl font-bold text-white">Who to follow</h3>
        <div className="space-y-4">
          <SuggestedUser
            name="Massa Labs"
            handle="massalabs"
            bio="Building the decentralized future"
          />
          <SuggestedUser
            name="Web3 Builder"
            handle="web3builder"
            bio="Shipping on-chain products"
          />
          <SuggestedUser
            name="DeFi Degen"
            handle="defidegen"
            bio="Exploring Massa DeFi"
          />
        </div>
        <button className="mt-4 text-sm text-sky-400 hover:text-sky-300 transition-colors">
          Show more
        </button>
      </div>

      <footer className="px-4 pb-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          Terms of Service · Privacy Policy · Cookie Policy · Accessibility
          <br />
          <br />
          Built on Massa Blockchain
        </p>
      </footer>
    </aside>
  );
}

function MoreOptionsButton() {
  return (
    <button className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-sky-500/10 hover:text-sky-400 transition-all">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
      </svg>
    </button>
  );
}

function SuggestedUser({ name, handle, bio }: { name: string; handle: string; bio: string }) {
  const provider = useWalletStore((state) => state.provider);

  return (
    <div className="flex items-start gap-3">
      <Avatar fallback={name} size={40} />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white truncate">{name}</p>
        <p className="text-sm text-slate-400 truncate">@{handle}</p>
      </div>
      <Button
        size="sm"
        variant="secondary"
        className="rounded-full text-sm font-bold"
        disabled={!provider}
      >
        Follow
      </Button>
    </div>
  );
}
