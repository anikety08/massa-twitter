export type Profile = {
  address: string;
  handle: string;
  displayName: string;
  bio: string;
  avatarCid: string;
  bannerCid: string;
  createdAt: number;
  updatedAt: number;
};

export type Post = {
  id: number;
  author: string;
  content: string;
  mediaCid: string;
  topics: string[];
  parentId: number;
  isReply: boolean;
  likeCount: number;
  replyCount: number;
  createdAt: number;
};

export type FollowStats = {
  followers: number;
  following: number;
  viewerFollows: boolean;
  viewerFollowedBy: boolean;
};

export type TopicStat = {
  topic: string;
  score: number;
};

export type Message = {
  conversationId: string;
  messageId: number;
  sender: string;
  recipient: string;
  content: string;
  mediaCid: string;
  createdAt: number;
};

export type UpsertProfileInput = {
  handle: string;
  displayName: string;
  bio: string;
  avatarCid: string;
  bannerCid: string;
};

export type PostInput = {
  content: string;
  mediaCid?: string;
  topics?: string[];
};

export type ReplyInput = PostInput & {
  parentId: number;
};

export type MessageInput = {
  peer: string;
  content: string;
  mediaCid?: string;
};


