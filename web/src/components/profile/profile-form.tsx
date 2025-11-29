"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { uploadMedia } from "@/lib/ipfs";
import { mediaFromCid, formatAddress } from "@/lib/utils";
import { useWalletStore } from "@/state/wallet-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { socialClient } from "@/lib/massa/client";
import type { Profile } from "@/lib/massa/types";
import { ImageIcon } from "@/components/ui/icons";

const profileSchema = z.object({
  handle: z.string().trim().min(3).max(32),
  displayName: z.string().trim().min(2).max(48),
  bio: z.string().trim().max(280).optional(),
  avatarCid: z.string().optional(),
  bannerCid: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

type ProfileFormProps = {
  profile?: Profile | null;
};

export function ProfileForm({ profile }: ProfileFormProps) {
  const queryClient = useQueryClient();
  const provider = useWalletStore((state) => state.provider);
  const address = useWalletStore((state) => state.address);
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      handle: profile?.handle ?? "",
      displayName: profile?.displayName ?? "",
      bio: profile?.bio ?? "",
      avatarCid: profile?.avatarCid ?? "",
      bannerCid: profile?.bannerCid ?? "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        handle: profile.handle ?? "",
        displayName: profile.displayName ?? "",
        bio: profile.bio ?? "",
        avatarCid: profile.avatarCid ?? "",
        bannerCid: profile.bannerCid ?? "",
      });
    }
  }, [profile, form]);

  const { mutateAsync: upsertProfile, isPending } = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (!provider) {
        throw new Error("Connect a wallet to update your profile.");
      }
      await socialClient.upsertProfile(provider, {
        handle: values.handle,
        displayName: values.displayName,
        bio: values.bio ?? "",
        avatarCid: values.avatarCid ?? "",
        bannerCid: values.bannerCid ?? "",
      });
    },
    onSuccess: () => {
      toast.success("Profile updated!");
      queryClient.invalidateQueries({ queryKey: ["profile", address] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Profile update failed.");
    },
  });

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    field: "avatarCid" | "bannerCid"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(field === "avatarCid" ? "avatar" : "banner");
    try {
      const result = await uploadMedia(file);
      form.setValue(field, result.cid);
      toast.success("Image uploaded!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to upload image."
      );
    } finally {
      setUploading(null);
      event.target.value = "";
    }
  };

  const onSubmit = (values: ProfileFormValues) => {
    upsertProfile(values);
  };

  const avatarCidValue = form.watch("avatarCid");
  const bannerCidValue = form.watch("bannerCid");
  const displayNameValue = form.watch("displayName") || "Your Name";
  const handleValue = form.watch("handle") || "handle";
  const bioValue = form.watch("bio") ?? "";
  const bioCharacters = bioValue.length;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden"
    >
      <div
        className="relative h-32 bg-gradient-to-r from-sky-600 to-indigo-600"
        style={
          bannerCidValue
            ? {
                backgroundImage: `url(${mediaFromCid(bannerCidValue)})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
          <div className="bg-black/50 rounded-full p-3">
            <ImageIcon size={24} className="text-white" />
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleUpload(event, "bannerCid")}
            disabled={uploading !== null}
          />
        </label>
        {uploading === "banner" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="text-white animate-pulse">Uploading...</span>
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        <div className="relative -mt-12 mb-4">
          <div className="relative inline-block">
            <Avatar
              cid={avatarCidValue}
              fallback={displayNameValue}
              size={80}
              className="border-4 border-slate-900"
            />
            <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
              <ImageIcon size={20} className="text-white" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleUpload(event, "avatarCid")}
                disabled={uploading !== null}
              />
            </label>
            {uploading === "avatar" && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                <span className="text-white text-xs animate-pulse">...</span>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-bold text-white">{displayNameValue}</h2>
          <p className="text-slate-400">@{handleValue}</p>
          {address && (
            <p className="text-xs text-slate-500 mt-1">
              {formatAddress(address, 8)}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Handle
            </label>
            <Input
              placeholder="your_handle"
              maxLength={32}
              autoComplete="off"
              {...form.register("handle")}
              disabled={isPending}
              className="bg-slate-800/50 border-white/10"
            />
            <p className="text-xs text-slate-500 mt-1">3-32 characters, no spaces</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Display Name
            </label>
            <Input
              placeholder="Your Name"
              maxLength={48}
              {...form.register("displayName")}
              disabled={isPending}
              className="bg-slate-800/50 border-white/10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Bio
            </label>
            <TextArea
              rows={3}
              placeholder="Tell the world about yourself"
              maxLength={280}
              {...form.register("bio")}
              disabled={isPending}
              className="bg-slate-800/50 border-white/10 resize-none"
            />
            <p className="text-xs text-slate-500 mt-1">{bioCharacters}/280</p>
          </div>

          <Button
            type="submit"
            disabled={isPending || !provider}
            className="w-full rounded-full font-bold"
          >
            {isPending ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </div>
    </form>
  );
}
