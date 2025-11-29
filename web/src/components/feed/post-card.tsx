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
  const provider = useWalletStore((state) => state.provider);
  const address = useWalletStore((state) => state.address);

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
    <article className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-800/40 p-6 shadow-lg shadow-indigo-950/20 backdrop-blur-sm hover:border-white/20 transition-all duration-200">
      <div className="flex gap-4">
        <Avatar
          cid={undefined}
          fallback={post.author}
          size={48}
          className="border-2 border-white/20 shadow-md"
        />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-bold text-white">{post.author}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">{timestampToRelative(post.createdAt)}</span>
          </div>
          <p className="text-base leading-relaxed text-slate-100">
            {post.content}
          </p>
          {post.mediaCid && (
            <div className="overflow-hidden rounded-xl border border-white/10 shadow-md">
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
                <Badge key={topic} className="bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  #{topicToLabel(topic)}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex items-center gap-6 pt-2 border-t border-white/10">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-300 transition-all hover:text-sky-400 hover:bg-sky-500/10 disabled:opacity-50"
              onClick={() => reactionMutation.mutate()}
              disabled={reactionMutation.isPending || !provider}
            >
              <span role="img" aria-label="like" className="text-lg">
                {reactionMutation.isPending ? "⏳" : "❤️"}
              </span>
              <span className="font-medium">{post.likeCount}</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-300 transition-all hover:text-sky-400 hover:bg-sky-500/10"
              onClick={() => onReply?.(post)}
            >
              <span className="text-lg">💬</span>
              <span className="font-medium">{post.replyCount}</span>
            </button>
            {viewer === post.author && (
              <span className="ml-auto rounded-full bg-gradient-to-r from-sky-500/20 to-indigo-500/20 border border-sky-500/30 px-3 py-1 text-xs font-medium text-sky-300">
                Your Post
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


