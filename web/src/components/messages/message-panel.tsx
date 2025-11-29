"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TextArea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { socialClient } from "@/lib/massa/client";
import { useWalletStore } from "@/state/wallet-store";
import { timestampToRelative, formatAddress } from "@/lib/utils";
import { SearchIcon, MessageIcon } from "@/components/ui/icons";

export function MessagePanel() {
  const queryClient = useQueryClient();
  const provider = useWalletStore((state) => state.provider);
  const address = useWalletStore((state) => state.address);
  const [peerHandle, setPeerHandle] = useState("");
  const [peerAddress, setPeerAddress] = useState<string>();
  const [peerName, setPeerName] = useState<string>();
  const [content, setContent] = useState("");

  const messagesQuery = useQuery({
    queryKey: ["messages", address, peerAddress],
    queryFn: () =>
      address && peerAddress
        ? socialClient.listMessages(address, peerAddress, 20)
        : [],
    enabled: Boolean(address && peerAddress),
    refetchInterval: 5000,
  });

  const resolvePeer = async () => {
    if (!peerHandle.trim()) return;
    const target = peerHandle.trim().startsWith("@")
      ? peerHandle.trim().slice(1)
      : peerHandle.trim();
    try {
      const profile = await socialClient.getProfileByHandle(target);
      if (!profile) {
        setPeerAddress(target);
        setPeerName(formatAddress(target, 6));
        return;
      }
      setPeerAddress(profile.address);
      setPeerName(profile.displayName || profile.handle);
      toast.success(`Now messaging ${profile.displayName || profile.handle}`);
    } catch {
      setPeerAddress(target);
      setPeerName(formatAddress(target, 6));
    }
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
      toast.success("Message sent!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Send failed.");
    },
  });

  if (!provider) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-8 text-center">
        <MessageIcon size={48} className="mx-auto text-slate-600 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Messages</h3>
        <p className="text-slate-400">
          Connect your wallet to send and receive direct messages.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
      <div className="border-b border-white/10 p-4">
        <h3 className="text-lg font-bold text-white mb-3">Direct Messages</h3>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              placeholder="Enter @handle or address"
              value={peerHandle}
              onChange={(event) => setPeerHandle(event.target.value)}
              onKeyDown={(e) => e.key === "Enter" && resolvePeer()}
              className="pl-10 bg-slate-800/50 border-white/10"
            />
          </div>
          <Button variant="secondary" onClick={resolvePeer}>
            Start
          </Button>
        </div>
      </div>

      {peerAddress && (
        <div className="border-b border-white/10 p-3 bg-slate-800/30">
          <div className="flex items-center gap-3">
            <Avatar fallback={peerName || "User"} size={36} />
            <div>
              <p className="font-bold text-white">{peerName}</p>
              <p className="text-xs text-slate-400">
                {formatAddress(peerAddress, 8)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="h-80 overflow-y-auto p-4 space-y-3">
        {messagesQuery.data?.map((message) => (
          <div
            key={message.messageId}
            className={`flex ${
              message.sender === address ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                message.sender === address
                  ? "bg-sky-500 text-white rounded-br-md"
                  : "bg-slate-700 text-white rounded-bl-md"
              }`}
            >
              <p className="text-[15px]">{message.content}</p>
              <p
                className={`mt-1 text-[11px] ${
                  message.sender === address
                    ? "text-sky-100/70"
                    : "text-slate-400"
                }`}
              >
                {timestampToRelative(message.createdAt)}
              </p>
            </div>
          </div>
        ))}
        {!messagesQuery.data?.length && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <MessageIcon size={40} className="text-slate-600 mb-3" />
            <p className="text-slate-400 text-sm">
              {peerAddress
                ? "No messages yet. Say hello!"
                : "Select a user to start messaging."}
            </p>
          </div>
        )}
      </div>

      {peerAddress && (
        <div className="border-t border-white/10 p-4">
          <div className="flex gap-2">
            <TextArea
              rows={2}
              placeholder="Write a message..."
              value={content}
              onChange={(event) => setContent(event.target.value)}
              disabled={sendMutation.isPending}
              className="flex-1 bg-slate-800/50 border-white/10 resize-none"
            />
            <Button
              onClick={() => sendMutation.mutate()}
              disabled={!content.trim() || sendMutation.isPending}
              className="self-end"
            >
              {sendMutation.isPending ? "..." : "Send"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
