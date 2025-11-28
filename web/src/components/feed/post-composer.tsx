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
  const { provider, address } = useWalletStore((state) => ({
    provider: state.provider,
    address: state.address,
  }));
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
    <div className="glass-panel p-6">
      <div className="flex gap-4">
        <Avatar cid={avatarCid} fallback={displayName ?? "You"} size={48} />
        <div className="flex-1 space-y-3">
          <TextArea
            rows={3}
            placeholder="Share something with Massa..."
            value={content}
            onChange={(event) => setContent(event.target.value)}
            disabled={mutation.isPending}
          />
          <Input
            placeholder="Topics (comma separated, e.g. massa, defi, wasm)"
            value={topicsInput}
            onChange={(event) => setTopicsInput(event.target.value)}
            disabled={mutation.isPending}
          />
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-sky-300">
              {uploading ? "Uploading…" : "Attach media"}
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
            {mediaCid && (
              <span className="text-xs text-slate-400">
                Linked CID: {mediaCid.slice(0, 8)}…
              </span>
            )}
            <div className="flex-1" />
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !provider}
            >
              {mutation.isPending ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


