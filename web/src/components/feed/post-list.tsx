"use client";

import type { Post } from "@/lib/massa/types";
import { PostCard } from "@/components/feed/post-card";

type PostListProps = {
  posts?: Post[];
  viewer?: string;
  emptyLabel?: string;
  onReply?: (post: Post) => void;
};

export function PostList({ posts, viewer, emptyLabel, onReply }: PostListProps) {
  if (!posts?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="text-5xl mb-4">📭</div>
        <h3 className="text-xl font-bold text-white mb-2">
          No posts yet
        </h3>
        <p className="text-slate-400 max-w-sm">
          {emptyLabel ?? "Be the first to share something with the community!"}
        </p>
      </div>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard
          key={`${post.id}-${post.createdAt}`}
          post={post}
          viewer={viewer}
          onReply={onReply}
        />
      ))}
    </div>
  );
}
