"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TextArea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { uploadMedia } from "@/lib/ipfs";
import { useWalletStore } from "@/state/wallet-store";
import { socialClient } from "@/lib/massa/client";

type PostComposerProps = {
  avatarCid?: string;
  displayName?: string;
};

export function PostComposer({ avatarCid, displayName }: PostComposerProps) {
  const queryClient = useQueryClient();
  const provider = useWalletStore((state) => state.provider);
  const address = useWalletStore((state) => state.address);
  const [content, setContent] = useState("");
  const [topicsInput, setTopicsInput] = useState("");
  const [mediaCid, setMediaCid] = useState<string>();
  const [uploading, setUploading] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!provider) {
        throw new Error("Connect your Massa wallet to post.");
      }
      if (!content.trim()) {
        throw new Error("Post content cannot be empty.");
      }
      const topics = topicsInput
        .split(",")
        .map((t) => t.trim())
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
      toast.success("Post submitted to Massa ✅");
      queryClient.invalidateQueries({ queryKey: ["posts", "recent"] });
      if (address) {
        queryClient.invalidateQueries({ queryKey: ["feed", address] });
        queryClient.invalidateQueries({ queryKey: ["posts", "user", address] });
      }
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
        error instanceof Error ? error.message : "Upload failed. Try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/60 p-6 shadow-xl backdrop-blur-sm">
      <div className="flex gap-4">
        <Avatar cid={avatarCid} fallback={displayName ?? "You"} size={52} className="border-2 border-white/20 shadow-md" />
        <div className="flex-1 space-y-4">
          <TextArea
            rows={4}
            placeholder="What's on your mind? Share it with the Massa community..."
            value={content}
            onChange={(event) => setContent(event.target.value)}
            disabled={mutation.isPending}
            className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-400 focus:border-sky-500/50"
          />
          <Input
            placeholder="Add topics (comma separated, e.g. massa, defi, web3)"
            value={topicsInput}
            onChange={(event) => setTopicsInput(event.target.value)}
            disabled={mutation.isPending}
            className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-400 focus:border-sky-500/50"
          />
          <div className="flex items-center gap-4 pt-2 border-t border-white/10">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 hover:bg-slate-700/50 transition-colors text-sm font-medium text-sky-300">
              {uploading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Uploading...
                </>
              ) : (
                <>
                  📎 Attach Media
                </>
              )}
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading || mutation.isPending}
              />
            </label>
            {mediaCid && (
              <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                ✓ Media: {mediaCid.slice(0, 12)}...
              </span>
            )}
            <div className="flex-1" />
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !provider || !content.trim()}
              size="lg"
              className="min-w-[120px]"
            >
              {mutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Posting...
                </>
              ) : (
                "Post"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


