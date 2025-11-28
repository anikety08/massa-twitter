"use client";

import { useState } from "react";
import { socialClient } from "@/lib/massa/client";
import type { Profile } from "@/lib/massa/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const profiles = await socialClient.searchProfiles(query.trim(), 5);
      setResults(profiles);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="rounded-3xl border border-white/5 bg-white/5 p-5">
      <form onSubmit={handleSearch} className="space-y-3">
        <Input
          placeholder="Search by handle or address"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button type="submit" variant="secondary" disabled={isSearching}>
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </form>
      <div className="mt-4 space-y-3 text-sm text-slate-300">
        {results.map((profile) => (
          <div
            key={profile.address}
            className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-3 py-2"
          >
            <div>
              <p className="font-semibold text-white">@{profile.handle}</p>
              <p className="text-xs text-slate-400">{profile.displayName}</p>
            </div>
            <Link href={`/profile/${profile.handle}`}>
              <Button variant="ghost" size="sm">
                View
              </Button>
            </Link>
          </div>
        ))}
        {!results.length && (
          <p className="text-xs text-slate-500">
            {query
              ? "No users found. Try another handle."
              : "Try searching for @massa"}
          </p>
        )}
      </div>
    </div>
  );
}


