"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { uploadMedia } from "@/lib/ipfs";
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
    }
  };

  const onSubmit = (values: ProfileFormValues) => {
    upsertProfile(values);
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
    >
      <div className="flex items-center gap-4">
        <Avatar
          cid={form.watch("avatarCid")}
          fallback={profile?.displayName ?? "You"}
          size={64}
        />
        <div>
          <p className="text-sm text-slate-300">
            {address ? `Connected as ${address}` : "Connect wallet to personalize"}
          </p>
          <label className="mt-2 block cursor-pointer text-xs font-semibold text-sky-300">
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
      </div>

      <Input
        placeholder="@handle"
        {...form.register("handle")}
        disabled={isPending}
      />
      <Input
        placeholder="Display name"
        {...form.register("displayName")}
        disabled={isPending}
      />
      <TextArea
        rows={4}
        placeholder="Bio"
        {...form.register("bio")}
        disabled={isPending}
      />

      <div className="flex flex-wrap gap-3">
        <div>
          <p className="text-xs text-slate-400">Banner</p>
          <label className="mt-1 block cursor-pointer text-xs font-semibold text-sky-300">
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
      </div>

      <Button type="submit" disabled={isPending || !provider}>
        {isPending ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}


