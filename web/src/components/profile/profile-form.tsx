"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
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
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
  const [handleValue, setHandleValue] = useState("");
  const [handleCheckDebounce, setHandleCheckDebounce] = useState<NodeJS.Timeout | null>(null);

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

  // Watch handle for availability checking
  const watchedHandle = form.watch("handle");
  useEffect(() => {
    setHandleValue(watchedHandle);
  }, [watchedHandle]);

  // Check handle availability
  const { data: existingProfile, isLoading: checkingHandle } = useQuery({
    queryKey: ["profile-by-handle", handleValue],
    queryFn: () => {
      if (!handleValue || handleValue.length < 3) return null;
      return socialClient.getProfileByHandle(handleValue.trim().toLowerCase());
    },
    enabled: Boolean(handleValue && handleValue.length >= 3 && !profile?.handle),
    retry: false,
  });

  const isHandleAvailable = useMemo(() => {
    if (!handleValue || handleValue.length < 3) return null;
    if (checkingHandle) return null;
    if (existingProfile) {
      // If it's the current user's profile, it's available
      return existingProfile.address === address;
    }
    return true; // No profile found, handle is available
  }, [handleValue, existingProfile, checkingHandle, address]);

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
      if (!address) {
        throw new Error("Wallet address not found.");
      }

      // Check if profile already exists for this wallet
      const existingProfile = await socialClient.getProfile(address);
      if (existingProfile && existingProfile.handle && existingProfile.displayName) {
        throw new Error("You already have a profile. Please update it instead of creating a new one.");
      }

      // Check handle availability before submitting
      const normalizedHandle = values.handle.trim().toLowerCase();
      if (normalizedHandle.length >= 3) {
        const existing = await socialClient.getProfileByHandle(normalizedHandle);
        if (existing && existing.address !== address) {
          throw new Error("This handle is already taken. Please choose another one.");
        }
      }

      toast.loading("Submitting transaction to blockchain...", { id: "profile-create" });
      
      try {
        const operationId = await socialClient.upsertProfile(provider, {
          handle: normalizedHandle,
          displayName: values.displayName.trim(),
          bio: values.bio?.trim() ?? "",
          avatarCid: values.avatarCid ?? "",
          bannerCid: values.bannerCid ?? "",
        });

        toast.loading("Waiting for transaction confirmation...", { id: "profile-create" });
        
        // Wait for transaction to be processed on blockchain
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        return operationId;
      } catch (error) {
        toast.dismiss("profile-create");
        throw error;
      }
    },
    onSuccess: async (operationId, variables) => {
      toast.success("Profile created successfully!", { id: "profile-create", duration: 3000 });
      
      if (!address) return;
      
      // Wait for blockchain to process
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // Aggressively fetch profile with retries
      let profileFound = false;
      let attempts = 0;
      const maxAttempts = 15;
      
      while (!profileFound && attempts < maxAttempts) {
        attempts++;
        try {
          const profile = await socialClient.getProfile(address);
          
          if (profile?.handle && profile?.displayName) {
            // Profile found! Set it in cache immediately
            queryClient.setQueryData(["profile", address], profile);
            queryClient.setQueryData(["profile-by-handle", profile.handle.toLowerCase()], profile);
            
            // Invalidate all profile queries
            await queryClient.invalidateQueries({ queryKey: ["profile"] });
            await queryClient.invalidateQueries({ queryKey: ["profile-by-handle"] });
            
            // Force immediate refetch
            await queryClient.refetchQueries({ queryKey: ["profile", address] });
            
            profileFound = true;
            toast.success("Profile loaded! Welcome to Massa Social!", { duration: 3000 });
            break;
          }
        } catch (error) {
          console.log(`Profile fetch attempt ${attempts} failed:`, error);
        }
        
        // Wait before next attempt
        if (!profileFound && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      if (!profileFound) {
        toast.error("Profile created but not detected. Please refresh the page.", { duration: 5000 });
      }
    },
    onError: (error) => {
      toast.dismiss("profile-create");
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Profile creation failed. Please try again.";
      
      // Check for specific contract errors
      if (errorMessage.includes("HANDLE_ALREADY_TAKEN") || errorMessage.includes("already taken")) {
        toast.error("This handle is already taken. Please choose another one.");
      } else {
        toast.error(errorMessage);
      }
      console.error("Profile creation error:", error);
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
  const watchedHandleDisplay = form.watch("handle") || "handle";
  const bioValue = form.watch("bio") ?? "";
  const bioCharacters = bioValue.length;

  const formErrors = form.formState.errors;
  
  // Determine if handle is valid for submission
  const canSubmitHandle = useMemo(() => {
    if (!handleValue || handleValue.length < 3) return false;
    if (checkingHandle) return false;
    if (isHandleAvailable === false) return false;
    return true;
  }, [handleValue, checkingHandle, isHandleAvailable]);

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="relative h-40 bg-gradient-to-r from-sky-600 to-indigo-600"
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
        <label 
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer z-10"
          style={{ pointerEvents: 'auto' }}
        >
          <div className="bg-black/70 rounded-full p-3 backdrop-blur-sm">
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
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
              <span className="text-white text-sm">Uploading...</span>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 sm:px-6 pb-6 pt-4">
        <div className="relative -mt-16 mb-5">
          <div className="relative inline-block">
            <Avatar
              cid={avatarCidValue}
              fallback={displayNameValue}
              size={96}
              className="border-4 border-slate-900 shadow-lg"
            />
            <label 
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer z-10"
              style={{ pointerEvents: 'auto' }}
            >
              <div className="bg-black/70 rounded-full p-2 backdrop-blur-sm">
                <ImageIcon size={18} className="text-white" />
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleUpload(event, "avatarCid")}
                disabled={uploading !== null}
              />
            </label>
            {uploading === "avatar" && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 z-20">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">{displayNameValue || "Your Name"}</h2>
          <p className="text-slate-400 text-sm">@{handleValue || "your_handle"}</p>
          {address && (
            <p className="text-xs text-slate-500 mt-1.5">
              {formatAddress(address, 8)}
            </p>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <label 
              htmlFor="handle-input"
              className="block text-sm font-semibold text-slate-200 mb-2"
            >
              Handle <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Input
                id="handle-input"
                placeholder="your_handle"
                maxLength={32}
                autoComplete="off"
                {...form.register("handle", {
                  onChange: (e) => {
                    form.setValue("handle", e.target.value);
                  }
                })}
                disabled={isPending}
                className={`bg-slate-800/70 border-white/20 text-white placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 h-11 text-base pr-20 ${
                  handleValue.length >= 3 && isHandleAvailable === false 
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                    : handleValue.length >= 3 && isHandleAvailable === true
                    ? 'border-green-500/50 focus:border-green-500'
                    : ''
                }`}
                style={{ pointerEvents: 'auto' }}
              />
              {handleValue.length >= 3 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkingHandle ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-sky-400 border-t-transparent"></div>
                  ) : isHandleAvailable === false ? (
                    <span className="text-red-400 text-xs font-medium flex items-center gap-1">
                      <span>✕</span>
                      <span className="hidden sm:inline">Taken</span>
                    </span>
                  ) : isHandleAvailable === true ? (
                    <span className="text-green-400 text-xs font-medium flex items-center gap-1">
                      <span>✓</span>
                      <span className="hidden sm:inline">Available</span>
                    </span>
                  ) : null}
                </div>
              )}
            </div>
            {formErrors.handle && (
              <p className="text-xs text-red-400 mt-1.5">{formErrors.handle.message}</p>
            )}
            {handleValue.length >= 3 && isHandleAvailable === false && !checkingHandle && (
              <p className="text-xs text-red-400 mt-1.5">
                This handle is already taken. Please choose another one.
              </p>
            )}
            {handleValue.length >= 3 && isHandleAvailable === true && !checkingHandle && (
              <p className="text-xs text-green-400 mt-1.5">
                Great! This handle is available.
              </p>
            )}
            {handleValue.length > 0 && handleValue.length < 3 && (
              <p className="text-xs text-slate-500 mt-1.5">Handle must be at least 3 characters.</p>
            )}
            {handleValue.length === 0 && (
              <p className="text-xs text-slate-500 mt-1.5">3-32 characters, no spaces. This will be your unique @handle.</p>
            )}
          </div>

          <div>
            <label 
              htmlFor="display-name-input"
              className="block text-sm font-semibold text-slate-200 mb-2"
            >
              Display Name <span className="text-red-400">*</span>
            </label>
            <Input
              id="display-name-input"
              placeholder="Your Name"
              maxLength={48}
              {...form.register("displayName")}
              disabled={isPending}
              className="bg-slate-800/70 border-white/20 text-white placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 h-11 text-base"
              style={{ pointerEvents: 'auto' }}
            />
            {formErrors.displayName && (
              <p className="text-xs text-red-400 mt-1.5">{formErrors.displayName.message}</p>
            )}
          </div>

          <div>
            <label 
              htmlFor="bio-input"
              className="block text-sm font-semibold text-slate-200 mb-2"
            >
              Bio <span className="text-slate-500 text-xs font-normal">(optional)</span>
            </label>
            <TextArea
              id="bio-input"
              rows={4}
              placeholder="Tell the world about yourself..."
              maxLength={280}
              {...form.register("bio")}
              disabled={isPending}
              className="bg-slate-800/70 border-white/20 text-white placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 resize-none text-base"
              style={{ pointerEvents: 'auto' }}
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-xs text-slate-500">Share a bit about yourself</p>
              <p className={`text-xs ${bioCharacters > 260 ? 'text-yellow-400' : 'text-slate-500'}`}>
                {bioCharacters}/280
              </p>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending || !provider || !canSubmitHandle || !form.formState.isValid}
            className="w-full rounded-full font-bold h-12 text-base shadow-lg shadow-sky-500/20 hover:shadow-xl hover:shadow-sky-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ pointerEvents: 'auto' }}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                Creating Profile...
              </span>
            ) : !canSubmitHandle && handleValue.length >= 3 ? (
              "Handle Not Available"
            ) : (
              profile ? "Update Profile" : "Create Profile"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
