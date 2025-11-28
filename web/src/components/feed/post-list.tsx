"use client";

import type { Post } from "@/lib/massa/types";
import { PostCard } from "@/components/feed/post-card";

type PostListProps = {
  posts?: Post[];
  viewer?: string;
  emptyLabel?: string;
};

export function PostList({ posts, viewer, emptyLabel }: PostListProps) {
  if (!posts?.length) {
    return (
      <div className="rounded-3xl border border-white/5 bg-white/5 p-8 text-center text-sm text-slate-400">
        {emptyLabel ?? "No activity yet."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={`${post.id}-${post.createdAt}`} post={post} viewer={viewer} />
      ))}
    </div>
  );
}


