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
import { mediaFromCid } from "@/lib/utils";
import { useWalletStore } from "@/state/wallet-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { socialClient } from "@/lib/massa/client";
import type { Profile } from "@/lib/massa/types";

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
  const { provider, address } = useWalletStore((state) => ({
    provider: state.provider,
    address: state.address,
  }));
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
    form.reset({
      handle: profile?.handle ?? "",
      displayName: profile?.displayName ?? "",
      bio: profile?.bio ?? "",
      avatarCid: profile?.avatarCid ?? "",
      bannerCid: profile?.bannerCid ?? "",
    });
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
      toast.success("Profile updated on Massa ✨");
      queryClient.invalidateQueries({ queryKey: ["profile", address] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Profile update failed.");
    },
  });

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    field: "avatarCid" | "bannerCid",
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(field === "avatarCid" ? "avatar" : "banner");
    try {
      const result = await uploadMedia(file);
      form.setValue(field, result.cid);
      toast.success("Media uploaded via IPFS");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to upload media.",
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
  const displayNameValue = form.watch("displayName") || "You";
  const bioValue = form.watch("bio") ?? "";
  const bioCharacters = bioValue.length;

  const helperText = useMemo(
    () => ({
      handle: "Letters, numbers, dashes, underscores (3-32 chars).",
      displayName: "Shown across feeds and messages.",
      bio: `${bioCharacters}/280 characters`,
      banner: bannerCidValue ? "Uploaded" : "Optional 1600x400 image.",
    }),
    [bioCharacters, bannerCidValue],
  );

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-white/5 p-4 md:flex-row md:items-center">
        <Avatar cid={avatarCidValue} fallback={displayNameValue} size={72} />
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Profile preview
          </p>
          <p className="text-base font-semibold text-white">{displayNameValue}</p>
          <p className="text-sm text-slate-300">
            {address ? `Connected as ${address}` : "Connect wallet to personalize"}
          </p>
        </div>
        <label className="block cursor-pointer text-xs font-semibold text-sky-300">
          {uploading === "avatar" ? "Uploading…" : "Upload avatar"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleUpload(event, "avatarCid")}
            disabled={uploading !== null}
          />
        </label>
      </div>

      <label className="space-y-2 text-sm text-white/80">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Unique handle
        </span>
        <Input
          placeholder="@handle"
          maxLength={32}
          autoComplete="off"
          {...form.register("handle")}
          disabled={isPending}
        />
        <span className="text-xs text-slate-500">{helperText.handle}</span>
      </label>

      <label className="space-y-2 text-sm text-white/80">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Display name
        </span>
        <Input
          placeholder="Display name"
          maxLength={48}
          {...form.register("displayName")}
          disabled={isPending}
        />
        <span className="text-xs text-slate-500">{helperText.displayName}</span>
      </label>

      <label className="space-y-2 text-sm text-white/80">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Bio
        </span>
        <TextArea
          rows={4}
          placeholder="Tell the Massa community who you are"
          maxLength={280}
          {...form.register("bio")}
          disabled={isPending}
        />
        <span className="text-xs text-slate-500">{helperText.bio}</span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Banner
          </p>
          <p className="mt-1 text-sm text-slate-300">
            {helperText.banner}
          </p>
          <label className="mt-3 inline-flex cursor-pointer text-xs font-semibold text-sky-300">
            {uploading === "banner" ? "Uploading…" : "Upload banner"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleUpload(event, "bannerCid")}
              disabled={uploading !== null}
            />
          </label>
        </div>
        <div
          className={`flex h-32 items-center justify-center rounded-2xl border border-white/5 ${
            bannerCidValue ? "bg-cover bg-center" : "border-dashed bg-black/10"
          }`}
          style={
            bannerCidValue
              ? { backgroundImage: `url(${mediaFromCid(bannerCidValue)})` }
              : undefined
          }
        >
          {!bannerCidValue && (
            <span className="text-xs text-slate-500">Banner preview</span>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isPending || !provider}>
        {isPending ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}


