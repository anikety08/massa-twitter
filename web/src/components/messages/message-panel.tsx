"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TextArea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { socialClient } from "@/lib/massa/client";
import { useWalletStore } from "@/state/wallet-store";
import { timestampToRelative } from "@/lib/utils";

export function MessagePanel() {
  const queryClient = useQueryClient();
  const provider = useWalletStore((state) => state.provider);
  const address = useWalletStore((state) => state.address);
  const [peerHandle, setPeerHandle] = useState("");
  const [peerAddress, setPeerAddress] = useState<string>();
  const [content, setContent] = useState("");

  const messagesQuery = useQuery({
    queryKey: ["messages", address, peerAddress],
    queryFn: () =>
      address && peerAddress
        ? socialClient.listMessages(address, peerAddress, 20)
        : [],
    enabled: Boolean(address && peerAddress),
  });

  const resolvePeer = async () => {
    if (!peerHandle.trim()) return;
    const target = peerHandle.trim().startsWith("@")
      ? peerHandle.trim().slice(1)
      : peerHandle.trim();
    const profile = await socialClient.getProfileByHandle(target);
    if (!profile) {
      setPeerAddress(target);
      return;
    }
    setPeerAddress(profile.address);
    toast.success(`Messaging ${profile.displayName}`);
  };

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!provider) throw new Error("Connect wallet to send messages.");
      if (!peerAddress) throw new Error("Select a recipient first.");
      if (!content.trim()) throw new Error("Message cannot be empty.");
      await socialClient.sendMessage(provider, {
        peer: peerAddress,
        content: content.trim(),
      });
    },
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({
        queryKey: ["messages", address, peerAddress],
      });
      toast.success("Message sent.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Send failed.");
    },
  });

  return (
    <div className="rounded-3xl border border-white/5 bg-white/5 p-5">
      <h3 className="text-sm font-semibold text-slate-200">Direct messages</h3>
      <div className="mt-3 flex gap-2">
        <Input
          placeholder="@handle or address"
          value={peerHandle}
          onChange={(event) => setPeerHandle(event.target.value)}
        />
        <Button variant="secondary" onClick={resolvePeer}>
          Open
        </Button>
      </div>

      <div className="mt-4 h-64 space-y-3 overflow-y-auto rounded-2xl border border-white/5 bg-black/10 p-4">
        {messagesQuery.data?.map((message) => (
          <div
            key={message.messageId}
            className={`flex ${
              message.sender === address ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                message.sender === address
                  ? "bg-sky-500/20 text-sky-50"
                  : "bg-white/10 text-slate-200"
              }`}
            >
              <p>{message.content}</p>
              <p className="mt-1 text-[10px] text-slate-400">
                {timestampToRelative(message.createdAt)}
              </p>
            </div>
          </div>
        ))}
        {!messagesQuery.data?.length && (
          <p className="text-xs text-slate-500">
            {peerAddress
              ? "Say hi and be the first to message."
              : "Select a recipient to start a conversation."}
          </p>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <TextArea
          rows={3}
          placeholder="Encrypted message"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={sendMutation.isPending}
        />
        <Button
          onClick={() => sendMutation.mutate()}
          disabled={!provider || sendMutation.isPending}
        >
          {sendMutation.isPending ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}


