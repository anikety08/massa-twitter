"use client";

import { useState } from "react";
import { socialClient } from "@/lib/massa/client";
import type { Profile } from "@/lib/massa/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { SearchIcon } from "@/components/ui/icons";
import { useWalletStore } from "@/state/wallet-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function UserSearch() {
  const provider = useWalletStore((state) => state.provider);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: async (targetAddress: string) => {
      if (!provider) throw new Error("Connect wallet to follow.");
      return socialClient.follow(provider, targetAddress);
    },
    onSuccess: () => {
      toast.success("Followed!");
      queryClient.invalidateQueries({ queryKey: ["follow"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to follow.");
    },
  });

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const profiles = await socialClient.searchProfiles(query.trim(), 10);
      setResults(profiles);
    } catch {
      toast.error("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
      <h3 className="text-lg font-bold text-white mb-3">Search Users</h3>
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="relative">
          <SearchIcon
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            placeholder="Search by handle or address"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-10 bg-slate-800/50 border-white/10"
          />
        </div>
        <Button
          type="submit"
          variant="secondary"
          disabled={isSearching}
          className="w-full"
        >
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </form>

      {results.length > 0 && (
        <div className="mt-4 space-y-3">
          {results.map((profile) => (
            <div
              key={profile.address}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
              <Avatar
                cid={profile.avatarCid}
                fallback={profile.displayName}
                size={44}
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">
                  {profile.displayName}
                </p>
                <p className="text-sm text-slate-400 truncate">
                  @{profile.handle}
                </p>
                {profile.bio && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {profile.bio}
                  </p>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full font-bold"
                onClick={() => followMutation.mutate(profile.address)}
                disabled={followMutation.isPending || !provider}
              >
                Follow
              </Button>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && query && !isSearching && (
        <p className="mt-4 text-center text-sm text-slate-400">
          No users found for "{query}"
        </p>
      )}
    </div>
  );
}
