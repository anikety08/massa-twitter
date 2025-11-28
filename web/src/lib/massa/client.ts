"use client";

import {
  Args,
  ArrayTypes,
  JsonRPCClient,
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

const publicClient = new JsonRPCClient(PUBLIC_API_URL);
const DEFAULT_MAX_GAS = BigInt(5_000_000);
const DEFAULT_FEE = Mas.fromString("0.01");

function assertContractAddress(): string {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "Missing NEXT_PUBLIC_MASSA_CONTRACT_ADDRESS environment variable.",
    );
  }
  return CONTRACT_ADDRESS;
}

async function readContract(
  func: string,
  args?: Args,
  caller?: string,
): Promise<Uint8Array> {
  const target = assertContractAddress();
  const response = await publicClient.readSC({
    target,
    func,
    parameter: args?.serialize(),
    caller,
  });

  if (response.info.error) {
    throw new Error(response.info.error);
  }
  return response.value;
}

async function executeContract(
  provider: Provider,
  func: string,
  args?: Args,
): Promise<string> {
  const target = assertContractAddress();
  const operation = await provider.callSC({
    target,
    func,
    parameter: args?.serialize(),
    maxGas: DEFAULT_MAX_GAS,
    fee: DEFAULT_FEE,
  });

  await operation.waitFinalExecution(90_000, 3_000);
  return operation.id;
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
      const args = address ? new Args().addString(address) : undefined;
      const bytes = await readContract("get_profile", args);
      return decodeProfile(bytes);
    } catch {
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
      .addU32(Math.min(limit, 50));
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
    const args = new Args().addU32(Math.min(limit, 50));
    const bytes = await readContract("list_recent_posts", args);
    return decodePosts(bytes);
  },

  async listUserPosts(address: string, limit = 20): Promise<Post[]> {
    const args = new Args()
      .addString(address)
      .addU32(Math.min(limit, 50));
    const bytes = await readContract("list_posts_by_user", args);
    return decodePosts(bytes);
  },

  async listFeed(address: string, limit = 20): Promise<Post[]> {
    const args = new Args().addU32(Math.min(limit, 60));
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
      .addU32(Math.min(limit, 50));
    const bytes = await readContract("list_replies", args);
    return decodePosts(bytes);
  },

  async listTrendingTopics(limit = 10): Promise<TopicStat[]> {
    const args = new Args().addU32(Math.min(limit, 25));
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
      .addU32(Math.min(limit, 100));
    const bytes = await readContract("list_messages", args, address);
    return decodeMessages(bytes);
  },
};

