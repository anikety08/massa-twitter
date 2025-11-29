"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TextArea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ImageIcon, EmojiIcon } from "@/components/ui/icons";
import { uploadMedia } from "@/lib/ipfs";
import { useWalletStore } from "@/state/wallet-store";
import { socialClient } from "@/lib/massa/client";

type PostComposerProps = {
  avatarCid?: string;
  displayName?: string;
  onSuccess?: () => void;
};

export function PostComposer({ avatarCid, displayName, onSuccess }: PostComposerProps) {
  const queryClient = useQueryClient();
  const provider = useWalletStore((state) => state.provider);
  const address = useWalletStore((state) => state.address);
  const [content, setContent] = useState("");
  const [topicsInput, setTopicsInput] = useState("");
  const [mediaCid, setMediaCid] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [showTopics, setShowTopics] = useState(false);

  const charLimit = 280;
  const charCount = content.length;
  const isOverLimit = charCount > charLimit;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!provider) {
        throw new Error("Connect your Massa wallet to post.");
      }
      if (!content.trim()) {
        throw new Error("Post content cannot be empty.");
      }
      if (isOverLimit) {
        throw new Error(`Post is ${charCount - charLimit} characters over limit.`);
      }
      const topics = topicsInput
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean);
      await socialClient.createPost(provider, {
        content: content.trim(),
        mediaCid,
        topics,
      });
    },
    onSuccess: () => {
      setContent("");
      setTopicsInput("");
      setMediaCid(undefined);
      setShowTopics(false);
      toast.success("Post submitted to Massa!");
      queryClient.invalidateQueries({ queryKey: ["posts", "recent"] });
      if (address) {
        queryClient.invalidateQueries({ queryKey: ["feed", address] });
        queryClient.invalidateQueries({ queryKey: ["posts", "user", address] });
      }
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to post.");
    },
  });

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadMedia(file);
      setMediaCid(result.cid);
      toast.success("Media uploaded via IPFS");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Upload failed. Try again."
      );
    } finally {
      setUploading(false);
    }
  };

  if (!provider) {
    return null;
  }

  return (
    <div className="p-4">
      <div className="flex gap-3">
        <Avatar
          cid={avatarCid}
          fallback={displayName ?? "You"}
          size={48}
          className="border-2 border-white/20"
        />
        <div className="flex-1 space-y-3">
          <TextArea
            rows={3}
            placeholder="What's happening?"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            disabled={mutation.isPending}
            className="w-full resize-none border-0 bg-transparent text-xl text-white placeholder:text-slate-500 focus:ring-0 p-0"
          />

          {showTopics && (
            <input
              type="text"
              placeholder="Add hashtags (e.g. massa, defi, web3)"
              value={topicsInput}
              onChange={(event) => setTopicsInput(event.target.value)}
              disabled={mutation.isPending}
              className="w-full bg-transparent border-0 text-sky-400 placeholder:text-slate-500 focus:ring-0 p-0 text-sm"
            />
          )}

          {mediaCid && (
            <div className="relative">
              <div className="rounded-2xl bg-slate-800 border border-white/10 p-3 flex items-center gap-3">
                <div className="h-16 w-16 rounded-lg bg-slate-700 flex items-center justify-center">
                  <ImageIcon size={24} className="text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Media attached</p>
                  <p className="text-xs text-slate-400">{mediaCid.slice(0, 20)}...</p>
                </div>
                <button
                  onClick={() => setMediaCid(undefined)}
                  className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div className="flex items-center gap-1">
              <label className="cursor-pointer p-2 rounded-full hover:bg-sky-500/10 text-sky-400 transition-colors">
                <ImageIcon size={20} />
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading || mutation.isPending}
                />
              </label>
              <button
                type="button"
                onClick={() => setShowTopics(!showTopics)}
                className={`p-2 rounded-full hover:bg-sky-500/10 transition-colors ${
                  showTopics ? "text-sky-400" : "text-sky-400/60"
                }`}
                title="Add hashtags"
              >
                <span className="text-lg font-bold">#</span>
              </button>
              <button
                type="button"
                className="p-2 rounded-full hover:bg-sky-500/10 text-sky-400/60 transition-colors"
                title="Add emoji"
              >
                <EmojiIcon size={20} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              {charCount > 0 && (
                <div className="flex items-center gap-2">
                  <div
                    className={`relative h-6 w-6 ${
                      isOverLimit ? "text-red-400" : charCount > charLimit * 0.8 ? "text-yellow-400" : "text-sky-400"
                    }`}
                  >
                    <svg className="h-6 w-6 -rotate-90" viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        opacity="0.2"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={`${Math.min(charCount / charLimit, 1) * 62.83} 62.83`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  {isOverLimit && (
                    <span className="text-sm text-red-400 font-medium">
                      -{charCount - charLimit}
                    </span>
                  )}
                </div>
              )}
              <Button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || !content.trim() || isOverLimit}
                className="rounded-full px-5 font-bold"
              >
                {mutation.isPending ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
