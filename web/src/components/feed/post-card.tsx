"use client";

import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { socialClient } from "@/lib/massa/client";
import type { Post } from "@/lib/massa/types";
import { timestampToRelative, mediaFromCid, formatAddress } from "@/lib/utils";
import { useWalletStore } from "@/state/wallet-store";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  HeartIcon,
  CommentIcon,
  RetweetIcon,
  ShareIcon,
  MoreIcon,
  BookmarkIcon,
} from "@/components/ui/icons";

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
      toast.success("Liked!");
      queryClient.invalidateQueries({ queryKey: ["posts", "recent"] });
      queryClient.invalidateQueries({ queryKey: ["posts", "user", post.author] });
      if (address) {
        queryClient.invalidateQueries({ queryKey: ["feed", address] });
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to react right now."
      );
    },
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <article className="border-b border-white/10 px-4 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer">
      <div className="flex gap-3">
        <Avatar
          cid={undefined}
          fallback={post.author}
          size={48}
          className="border border-white/10"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1 min-w-0">
              <span className="font-bold text-white truncate hover:underline">
                {formatAddress(post.author, 8)}
              </span>
              <span className="text-slate-500 truncate">
                @{formatAddress(post.author, 4)}
              </span>
              <span className="text-slate-500 flex-shrink-0">·</span>
              <span className="text-slate-500 hover:underline flex-shrink-0">
                {timestampToRelative(post.createdAt)}
              </span>
            </div>
            <button className="p-2 -m-2 rounded-full hover:bg-sky-500/10 hover:text-sky-400 text-slate-500 transition-colors">
              <MoreIcon size={18} />
            </button>
          </div>

          <div className="mt-1">
            <p className="text-[15px] leading-relaxed text-white whitespace-pre-wrap break-words">
              {post.content}
            </p>
          </div>

          {post.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {post.topics.map((topic) => (
                <span
                  key={topic}
                  className="text-sky-400 hover:underline cursor-pointer"
                >
                  #{topic}
                </span>
              ))}
            </div>
          )}

          {post.mediaCid && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
              <Image
                src={mediaFromCid(post.mediaCid)}
                alt="Post media"
                width={800}
                height={450}
                className="h-auto w-full object-cover max-h-[500px]"
              />
            </div>
          )}

          <div className="flex items-center justify-between mt-3 max-w-md -ml-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReply?.(post);
              }}
              className="group flex items-center gap-1"
            >
              <div className="p-2 rounded-full group-hover:bg-sky-500/10 transition-colors">
                <CommentIcon size={18} className="text-slate-500 group-hover:text-sky-400" />
              </div>
              <span className="text-sm text-slate-500 group-hover:text-sky-400">
                {post.replyCount > 0 && formatNumber(post.replyCount)}
              </span>
            </button>

            <button
              type="button"
              className="group flex items-center gap-1"
              disabled={!provider}
            >
              <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
                <RetweetIcon size={18} className="text-slate-500 group-hover:text-green-400" />
              </div>
              <span className="text-sm text-slate-500 group-hover:text-green-400">
                0
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                reactionMutation.mutate();
              }}
              disabled={reactionMutation.isPending || !provider}
              className="group flex items-center gap-1"
            >
              <div className="p-2 rounded-full group-hover:bg-pink-500/10 transition-colors">
                <HeartIcon
                  size={18}
                  className={`${
                    post.likeCount > 0 ? "text-pink-500" : "text-slate-500"
                  } group-hover:text-pink-500`}
                  filled={post.likeCount > 0}
                />
              </div>
              <span
                className={`text-sm ${
                  post.likeCount > 0 ? "text-pink-500" : "text-slate-500"
                } group-hover:text-pink-500`}
              >
                {post.likeCount > 0 && formatNumber(post.likeCount)}
              </span>
            </button>

            <button
              type="button"
              className="group flex items-center gap-1"
            >
              <div className="p-2 rounded-full group-hover:bg-sky-500/10 transition-colors">
                <BookmarkIcon size={18} className="text-slate-500 group-hover:text-sky-400" />
              </div>
            </button>

            <button
              type="button"
              className="group flex items-center gap-1"
            >
              <div className="p-2 rounded-full group-hover:bg-sky-500/10 transition-colors">
                <ShareIcon size={18} className="text-slate-500 group-hover:text-sky-400" />
              </div>
            </button>
          </div>

          {viewer === post.author && (
            <Badge className="mt-2 bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs">
              Your Post
            </Badge>
          )}
        </div>
      </div>
    </article>
  );
}
