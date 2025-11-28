"use client";

import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { socialClient } from "@/lib/massa/client";
import type { Post } from "@/lib/massa/types";
import { timestampToRelative, mediaFromCid, topicToLabel } from "@/lib/utils";
import { useWalletStore } from "@/state/wallet-store";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type PostCardProps = {
  post: Post;
  viewer?: string;
  onReply?: (post: Post) => void;
};

export function PostCard({ post, viewer, onReply }: PostCardProps) {
  const queryClient = useQueryClient();
  const { provider, address } = useWalletStore((state) => ({
    provider: state.provider,
    address: state.address,
  }));

  const reactionMutation = useMutation({
    mutationFn: async () => {
      if (!provider) {
        throw new Error("Connect a wallet to react.");
      }
      return socialClient.reactToPost(provider, post.id, "like");
    },
    onSuccess: () => {
      toast.success("Reaction submitted.");
      queryClient.invalidateQueries({ queryKey: ["posts", "recent"] });
      queryClient.invalidateQueries({ queryKey: ["posts", "user", post.author] });
      if (address) {
        queryClient.invalidateQueries({ queryKey: ["feed", address] });
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to react right now.",
      );
    },
  });

  return (
    <article className="rounded-3xl border border-white/5 bg-white/5 p-5 shadow-lg shadow-indigo-950/20 backdrop-blur">
      <div className="flex gap-4">
        <Avatar
          cid={undefined}
          fallback={post.author}
          size={44}
          className="border border-white/10"
        />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="font-semibold text-white">{post.author}</span>
            <span>·</span>
            <span>{timestampToRelative(post.createdAt)}</span>
          </div>
          <p className="text-base leading-relaxed text-slate-100">
            {post.content}
          </p>
          {post.mediaCid && (
            <div className="overflow-hidden rounded-3xl border border-white/10">
              <Image
                src={mediaFromCid(post.mediaCid)}
                alt="post media"
                width={800}
                height={450}
                className="h-auto w-full object-cover"
              />
            </div>
          )}
          {post.topics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.topics.map((topic) => (
                <Badge key={topic}>{topicToLabel(topic)}</Badge>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-slate-300 transition hover:text-sky-300"
              onClick={() => reactionMutation.mutate()}
              disabled={reactionMutation.isPending}
            >
              <span role="img" aria-label="like">
                💙
              </span>
              {post.likeCount}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-slate-300 transition hover:text-sky-300"
              onClick={() => onReply?.(post)}
            >
              💬 {post.replyCount}
            </button>
            {viewer === post.author && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">
                You
              </span>
            )}
          </div>
        </div>
      </div>
      {provider && onReply && (
        <div className="mt-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-sky-300"
            onClick={() => onReply(post)}
          >
            Reply
          </Button>
        </div>
      )}
    </article>
  );
}


