"use client";

import {
  Args,
  ArrayTypes,
  Mas,
  type Provider,
} from "@massalabs/massa-web3";
import {
  decodeMessages,
  decodePost,
  decodePosts,
  decodeProfile,
  decodeProfiles,
  decodeTopics,
} from "@/lib/massa/serializers";
import type {
  FollowStats,
  Message,
  MessageInput,
  Post,
  PostInput,
  Profile,
  ReplyInput,
  TopicStat,
  UpsertProfileInput,
} from "@/lib/massa/types";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MASSA_CONTRACT_ADDRESS ?? "";
const PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_MASSA_PUBLIC_API_URL ??
  "https://buildnet.massa.net/api/v2";

// Note: We use direct RPC calls for reading contracts since JsonRPCClient doesn't have readSC
// This avoids needing an account for read-only operations
const DEFAULT_MAX_GAS = BigInt(5_000_000);
const DEFAULT_FEE = Mas.fromString("0.01");

function assertContractAddress(): string {
  if (!CONTRACT_ADDRESS) {
    if (typeof window !== "undefined") {
      console.error("Missing NEXT_PUBLIC_MASSA_CONTRACT_ADDRESS environment variable.");
    }
    // Return empty string instead of throwing to prevent crashes
    return "";
  }
  return CONTRACT_ADDRESS;
}

async function readContract(
  func: string,
  args?: Args,
  caller?: string,
): Promise<Uint8Array> {
  const target = assertContractAddress();
  if (!target) {
    throw new Error("Contract address not configured. Please set NEXT_PUBLIC_MASSA_CONTRACT_ADDRESS.");
  }
  
  try {
    // Use direct RPC call to read smart contract
    // Massa API expects base64 encoded parameters
    const parameterBytes = args?.serialize() ?? new Uint8Array(0);
    const parameterBase64 = btoa(String.fromCharCode.apply(null, Array.from(parameterBytes)));
    
    const rpcResponse = await fetch(PUBLIC_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'read_sc_execution',
        params: {
          target_address: target,
          target_function: func,
          parameter: parameterBase64,
          caller_address: caller || target,
        }
      })
    });

    if (!rpcResponse.ok) {
      throw new Error(`HTTP error! status: ${rpcResponse.status}`);
    }

    const data = await rpcResponse.json();
    
    if (data.error) {
      // Check if it's a "not found" type error
      const errorMsg = data.error.message || data.error.toString();
      if (errorMsg.includes("not found") || errorMsg.includes("does not exist") || errorMsg.includes("empty")) {
        return new Uint8Array(0);
      }
      throw new Error(errorMsg);
    }
    
    if (!data.result || !data.result.output) {
      return new Uint8Array(0);
    }
    
    // Convert base64 output back to Uint8Array
    const outputBase64 = data.result.output;
    const binaryString = atob(outputBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes;
  } catch (error) {
    // If it's a "not found" error, that's expected for missing profiles
    if (error instanceof Error && (
      error.message.includes("not found") || 
      error.message.includes("No profile") ||
      error.message.includes("empty") ||
      error.message.includes("does not exist")
    )) {
      return new Uint8Array(0);
    }
    throw error;
  }
}

async function executeContract(
  provider: Provider,
  func: string,
  args?: Args,
): Promise<string> {
  const target = assertContractAddress();
  if (!target) {
    throw new Error("Contract address not configured. Please set NEXT_PUBLIC_MASSA_CONTRACT_ADDRESS.");
  }
  
  try {
    const operation = await provider.callSC({
      target,
      func,
      parameter: args?.serialize(),
      maxGas: DEFAULT_MAX_GAS,
      fee: DEFAULT_FEE,
    });

    // Wait for final execution with longer timeout for profile creation
    const timeout = func === "upsert_profile" ? 120_000 : 90_000;
    const pollInterval = func === "upsert_profile" ? 4_000 : 3_000;
    
    await operation.waitFinalExecution(timeout, pollInterval);
    
    // Additional wait to ensure state is updated on chain
    if (func === "upsert_profile") {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return operation.id;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Transaction failed";
    
    // Parse common contract errors
    if (errorMessage.includes("HANDLE_ALREADY_TAKEN")) {
      throw new Error("This handle is already taken. Please choose another one.");
    }
    if (errorMessage.includes("already taken") || errorMessage.includes("taken")) {
      throw new Error("This handle is already taken. Please choose another one.");
    }
    
    throw error;
  }
}

function toArgsFromProfile(input: UpsertProfileInput): Args {
  return new Args()
    .addString(input.handle)
    .addString(input.displayName)
    .addString(input.bio)
    .addString(input.avatarCid ?? "")
    .addString(input.bannerCid ?? "");
}

function sanitizeTopics(topics?: string[]): string[] {
  if (!topics) return [];
  const unique = new Set<string>();
  for (const topic of topics) {
    const normalized = topic.trim().toLowerCase();
    if (normalized.length && !unique.has(normalized) && unique.size < 5) {
      unique.add(normalized);
    }
  }
  return Array.from(unique);
}

function mediaCidOrEmpty(value?: string | null) {
  return value?.trim() ?? "";
}

export const socialClient = {
  async getProfile(address?: string): Promise<Profile | null> {
    try {
      if (!address) return null;
      const args = new Args().addString(address);
      const bytes = await readContract("get_profile", args);
      
      // Check if bytes are empty or invalid
      if (!bytes || bytes.length === 0) {
        return null;
      }
      
      const profile = decodeProfile(bytes);
      
      // Only return if profile has required fields (handle and displayName)
      if (profile && profile.handle && profile.handle.trim().length > 0 && 
          profile.displayName && profile.displayName.trim().length > 0) {
        return profile;
      }
      
      return null;
    } catch (error) {
      // Don't log errors for missing profiles - it's expected
      if (error instanceof Error && !error.message.includes("not found")) {
        console.error("Error fetching profile:", error);
      }
      return null;
    }
  },

  async getProfileByHandle(handle: string): Promise<Profile | null> {
    try {
      const args = new Args().addString(handle);
      const bytes = await readContract("get_profile_by_handle", args);
      return decodeProfile(bytes);
    } catch {
      return null;
    }
  },

  async searchProfiles(query: string, limit = 10): Promise<Profile[]> {
    const args = new Args()
      .addString(query)
      .addU32(BigInt(Math.min(limit, 50)));
    const bytes = await readContract("search_profiles", args);
    return decodeProfiles(bytes);
  },

  async upsertProfile(provider: Provider, input: UpsertProfileInput) {
    const operationId = await executeContract(
      provider,
      "upsert_profile",
      toArgsFromProfile({
        ...input,
        avatarCid: mediaCidOrEmpty(input.avatarCid),
        bannerCid: mediaCidOrEmpty(input.bannerCid),
      }),
    );
    return operationId;
  },

  async getFollowStats(
    target: string,
    viewer?: string,
  ): Promise<FollowStats> {
    const args = new Args().addString(target);
    args.addString(viewer ?? "");
    const bytes = await readContract("get_follow_stats", args);
    const decoded = new Args(bytes);
    return {
      followers: Number(decoded.nextU64()),
      following: Number(decoded.nextU64()),
      viewerFollows: decoded.nextBool(),
      viewerFollowedBy: decoded.nextBool(),
    };
  },

  async follow(provider: Provider, target: string) {
    const args = new Args().addString(target);
    return executeContract(provider, "follow", args);
  },

  async unfollow(provider: Provider, target: string) {
    const args = new Args().addString(target);
    return executeContract(provider, "unfollow", args);
  },

  async listRecentPosts(limit = 20): Promise<Post[]> {
    const args = new Args().addU32(BigInt(Math.min(limit, 50)));
    const bytes = await readContract("list_recent_posts", args);
    return decodePosts(bytes);
  },

  async listUserPosts(address: string, limit = 20): Promise<Post[]> {
    const args = new Args()
      .addString(address)
      .addU32(BigInt(Math.min(limit, 50)));
    const bytes = await readContract("list_posts_by_user", args);
    return decodePosts(bytes);
  },

  async listFeed(address: string, limit = 20): Promise<Post[]> {
    const args = new Args().addU32(BigInt(Math.min(limit, 60)));
    const bytes = await readContract("list_feed", args, address);
    return decodePosts(bytes);
  },

  async getPost(postId: number): Promise<Post> {
    const args = new Args().addU64(BigInt(postId));
    const bytes = await readContract("get_post", args);
    return decodePost(bytes);
  },

  async listReplies(parentId: number, limit = 20): Promise<Post[]> {
    const args = new Args()
      .addU64(BigInt(parentId))
      .addU32(BigInt(Math.min(limit, 50)));
    const bytes = await readContract("list_replies", args);
    return decodePosts(bytes);
  },

  async listTrendingTopics(limit = 10): Promise<TopicStat[]> {
    const args = new Args().addU32(BigInt(Math.min(limit, 25)));
    const bytes = await readContract("list_trending_topics", args);
    return decodeTopics(bytes);
  },

  async createPost(provider: Provider, input: PostInput) {
    const args = new Args()
      .addString(input.content)
      .addString(mediaCidOrEmpty(input.mediaCid))
      .addArray(sanitizeTopics(input.topics), ArrayTypes.STRING);
    const operationId = await executeContract(provider, "create_post", args);
    return operationId;
  },

  async createReply(provider: Provider, input: ReplyInput) {
    const args = new Args()
      .addU64(BigInt(input.parentId))
      .addString(input.content)
      .addString(mediaCidOrEmpty(input.mediaCid))
      .addArray(sanitizeTopics(input.topics), ArrayTypes.STRING);
    return executeContract(provider, "create_reply", args);
  },

  async reactToPost(provider: Provider, postId: number, reaction: string) {
    const args = new Args()
      .addU64(BigInt(postId))
      .addString(reaction);
    return executeContract(provider, "react_to_post", args);
  },

  async sendMessage(provider: Provider, input: MessageInput) {
    const args = new Args()
      .addString(input.peer)
      .addString(input.content)
      .addString(mediaCidOrEmpty(input.mediaCid));
    return executeContract(provider, "send_message", args);
  },

  async listMessages(address: string, peer: string, limit = 25): Promise<Message[]> {
    const args = new Args()
      .addString(peer)
      .addU32(BigInt(Math.min(limit, 100)));
    const bytes = await readContract("list_messages", args, address);
    return decodeMessages(bytes);
  },
};

