import {
  Args,
  ArrayTypes,
  type Serializable as MassaSerializable,
  type DeserializedResult,
} from "@massalabs/massa-web3";
import type {
  Message,
  Post,
  Profile,
  TopicStat,
} from "@/lib/massa/types";

class ProfileSerde implements MassaSerializable<ProfileSerde> {
  address = "";
  handle = "";
  displayName = "";
  bio = "";
  avatarCid = "";
  bannerCid = "";
  createdAt = 0;
  updatedAt = 0;

  serialize(): Uint8Array {
    return new Args()
      .addString(this.address)
      .addString(this.handle)
      .addString(this.displayName)
      .addString(this.bio)
      .addString(this.avatarCid)
      .addString(this.bannerCid)
      .addU64(BigInt(this.createdAt))
      .addU64(BigInt(this.updatedAt))
      .serialize();
  }

  deserialize(data: Uint8Array, offset: number): DeserializedResult<ProfileSerde> {
    const args = new Args(data, offset);
    this.address = args.nextString();
    this.handle = args.nextString();
    this.displayName = args.nextString();
    this.bio = args.nextString();
    this.avatarCid = args.nextString();
    this.bannerCid = args.nextString();
    this.createdAt = Number(args.nextU64());
    this.updatedAt = Number(args.nextU64());
    return { instance: this, offset: args.getOffset() };
  }

  toProfile(): Profile {
    return {
      address: this.address,
      handle: this.handle,
      displayName: this.displayName,
      bio: this.bio,
      avatarCid: this.avatarCid,
      bannerCid: this.bannerCid,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

class PostSerde implements MassaSerializable<PostSerde> {
  id = 0;
  author = "";
  content = "";
  mediaCid = "";
  topics: string[] = [];
  parentId = 0;
  isReply = false;
  likeCount = 0;
  replyCount = 0;
  createdAt = 0;

  serialize(): Uint8Array {
    return new Args()
      .addU64(BigInt(this.id))
      .addString(this.author)
      .addString(this.content)
      .addString(this.mediaCid)
      .addArray(this.topics, ArrayTypes.STRING)
      .addU64(BigInt(this.parentId))
      .addBool(this.isReply)
      .addU32(this.likeCount)
      .addU32(this.replyCount)
      .addU64(BigInt(this.createdAt))
      .serialize();
  }

  deserialize(data: Uint8Array, offset: number): DeserializedResult<PostSerde> {
    const args = new Args(data, offset);
    this.id = Number(args.nextU64());
    this.author = args.nextString();
    this.content = args.nextString();
    this.mediaCid = args.nextString();
    this.topics = args.nextArray<string>(ArrayTypes.STRING);
    this.parentId = Number(args.nextU64());
    this.isReply = args.nextBool();
    this.likeCount = Number(args.nextU32());
    this.replyCount = Number(args.nextU32());
    this.createdAt = Number(args.nextU64());
    return { instance: this, offset: args.getOffset() };
  }

  toPost(): Post {
    return {
      id: this.id,
      author: this.author,
      content: this.content,
      mediaCid: this.mediaCid,
      topics: this.topics,
      parentId: this.parentId,
      isReply: this.isReply,
      likeCount: this.likeCount,
      replyCount: this.replyCount,
      createdAt: this.createdAt,
    };
  }
}

class TopicStatSerde implements MassaSerializable<TopicStatSerde> {
  topic = "";
  score = 0;

  serialize(): Uint8Array {
    return new Args().addString(this.topic).addU64(BigInt(this.score)).serialize();
  }

  deserialize(data: Uint8Array, offset: number): DeserializedResult<TopicStatSerde> {
    const args = new Args(data, offset);
    this.topic = args.nextString();
    this.score = Number(args.nextU64());
    return { instance: this, offset: args.getOffset() };
  }

  toTopic(): TopicStat {
    return {
      topic: this.topic,
      score: this.score,
    };
  }
}

class MessageSerde implements MassaSerializable<MessageSerde> {
  conversationId = "";
  messageId = 0;
  sender = "";
  recipient = "";
  content = "";
  mediaCid = "";
  createdAt = 0;

  serialize(): Uint8Array {
    return new Args()
      .addString(this.conversationId)
      .addU64(BigInt(this.messageId))
      .addString(this.sender)
      .addString(this.recipient)
      .addString(this.content)
      .addString(this.mediaCid)
      .addU64(BigInt(this.createdAt))
      .serialize();
  }

  deserialize(data: Uint8Array, offset: number): DeserializedResult<MessageSerde> {
    const args = new Args(data, offset);
    this.conversationId = args.nextString();
    this.messageId = Number(args.nextU64());
    this.sender = args.nextString();
    this.recipient = args.nextString();
    this.content = args.nextString();
    this.mediaCid = args.nextString();
    this.createdAt = Number(args.nextU64());
    return { instance: this, offset: args.getOffset() };
  }

  toMessage(): Message {
    return {
      conversationId: this.conversationId,
      messageId: this.messageId,
      sender: this.sender,
      recipient: this.recipient,
      content: this.content,
      mediaCid: this.mediaCid,
      createdAt: this.createdAt,
    };
  }
}

export function decodeProfile(bytes: Uint8Array): Profile {
  const serde = new ProfileSerde();
  serde.deserialize(bytes, 0);
  return serde.toProfile();
}

export function decodeProfiles(bytes: Uint8Array): Profile[] {
  const args = new Args(bytes);
  const serialized = args.nextSerializableObjectArray(ProfileSerde);
  return serialized.map((serde) => serde.toProfile());
}

export function decodePost(bytes: Uint8Array): Post {
  const serde = new PostSerde();
  serde.deserialize(bytes, 0);
  return serde.toPost();
}

export function decodePosts(bytes: Uint8Array): Post[] {
  const args = new Args(bytes);
  const serialized = args.nextSerializableObjectArray(PostSerde);
  return serialized.map((serde) => serde.toPost());
}

export function decodeTopics(bytes: Uint8Array): TopicStat[] {
  const args = new Args(bytes);
  const serialized = args.nextSerializableObjectArray(TopicStatSerde);
  return serialized.map((serde) => serde.toTopic());
}

export function decodeMessages(bytes: Uint8Array): Message[] {
  const args = new Args(bytes);
  const serialized = args.nextSerializableObjectArray(MessageSerde);
  return serialized.map((serde) => serde.toMessage());
}


