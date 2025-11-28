import {
  Args,
  Result,
  Serializable,
  bytesToString,
  stringToBytes,
} from '@massalabs/as-types';
import { Storage, Context, generateEvent } from '@massalabs/massa-as-sdk';

const PROFILE_KEY_PREFIX = 'profile:';
const HANDLE_KEY_PREFIX = 'handle:';
const POST_KEY_PREFIX = 'post:';
const POST_COUNTER_KEY = 'counter:post';
const REPLY_COUNTER_KEY = 'counter:reply';
const USER_POST_INDEX_PREFIX = 'user:post:';
const REPLY_INDEX_PREFIX = 'reply:index:';
const FOLLOW_KEY_PREFIX = 'follow:';
const FOLLOWERS_COUNT_PREFIX = 'followers:';
const FOLLOWING_COUNT_PREFIX = 'following:';
const TOPIC_KEY_PREFIX = 'topic:';
const REACTION_KEY_PREFIX = 'reaction:';
const REACTION_COUNT_PREFIX = 'reaction:count:';
const MESSAGE_COUNTER_PREFIX = 'message:counter:';
const MESSAGE_KEY_PREFIX = 'message:';
const CONVERSATION_PREFIX = 'conversation:';

const SUPPORTED_REACTIONS: string[] = ['like', 'love', 'fire', 'wow'];
const MAX_TOPICS = 5;
const MAX_TOPIC_LENGTH = 32;
const MAX_POST_LENGTH = 560;
const MAX_BIO_LENGTH = 280;
const MAX_DISPLAY_NAME_LENGTH = 48;
const MAX_MEDIA_CID_LENGTH = 128;
const MAX_HANDLE_LENGTH = 32;
const MIN_HANDLE_LENGTH = 3;

class Profile implements Serializable {
  constructor(
    public address: string = '',
    public handle: string = '',
    public displayName: string = '',
    public bio: string = '',
    public avatarCid: string = '',
    public bannerCid: string = '',
    public createdAt: u64 = 0,
    public updatedAt: u64 = 0,
  ) {}

  serialize(): StaticArray<u8> {
    return new Args()
      .add(this.address)
      .add(this.handle)
      .add(this.displayName)
      .add(this.bio)
      .add(this.avatarCid)
      .add(this.bannerCid)
      .add(this.createdAt)
      .add(this.updatedAt)
      .serialize();
  }

  deserialize(data: StaticArray<u8>, offset: i32): Result<i32> {
    const args = new Args(data, offset);
    this.address = args.mustNext<string>('profile.address');
    this.handle = args.mustNext<string>('profile.handle');
    this.displayName = args.mustNext<string>('profile.displayName');
    this.bio = args.mustNext<string>('profile.bio');
    this.avatarCid = args.mustNext<string>('profile.avatarCid');
    this.bannerCid = args.mustNext<string>('profile.bannerCid');
    this.createdAt = args.mustNext<u64>('profile.createdAt');
    this.updatedAt = args.mustNext<u64>('profile.updatedAt');
    return new Result<i32>(args.offset);
  }
}

class Post implements Serializable {
  constructor(
    public id: u64 = 0,
    public author: string = '',
    public content: string = '',
    public mediaCid: string = '',
    public topics: string[] = [],
    public parentId: u64 = 0,
    public isReply: bool = false,
    public likeCount: u32 = 0,
    public replyCount: u32 = 0,
    public createdAt: u64 = 0,
  ) {}

  serialize(): StaticArray<u8> {
    return new Args()
      .add(this.id)
      .add(this.author)
      .add(this.content)
      .add(this.mediaCid)
      .add<Array<string>, string>(this.topics)
      .add(this.parentId)
      .add(this.isReply)
      .add(this.likeCount)
      .add(this.replyCount)
      .add(this.createdAt)
      .serialize();
  }

  deserialize(data: StaticArray<u8>, offset: i32): Result<i32> {
    const args = new Args(data, offset);
    this.id = args.mustNext<u64>('post.id');
    this.author = args.mustNext<string>('post.author');
    this.content = args.mustNext<string>('post.content');
    this.mediaCid = args.mustNext<string>('post.mediaCid');
    this.topics = args.mustNext<Array<string>>('post.topics');
    this.parentId = args.mustNext<u64>('post.parentId');
    this.isReply = args.mustNext<bool>('post.isReply');
    this.likeCount = args.mustNext<u32>('post.likeCount');
    this.replyCount = args.mustNext<u32>('post.replyCount');
    this.createdAt = args.mustNext<u64>('post.createdAt');
    return new Result<i32>(args.offset);
  }
}

class Message implements Serializable {
  constructor(
    public conversationId: string = '',
    public messageId: u64 = 0,
    public sender: string = '',
    public recipient: string = '',
    public content: string = '',
    public mediaCid: string = '',
    public createdAt: u64 = 0,
  ) {}

  serialize(): StaticArray<u8> {
    return new Args()
      .add(this.conversationId)
      .add(this.messageId)
      .add(this.sender)
      .add(this.recipient)
      .add(this.content)
      .add(this.mediaCid)
      .add(this.createdAt)
      .serialize();
  }

  deserialize(data: StaticArray<u8>, offset: i32): Result<i32> {
    const args = new Args(data, offset);
    this.conversationId = args.mustNext<string>('message.conversation');
    this.messageId = args.mustNext<u64>('message.id');
    this.sender = args.mustNext<string>('message.sender');
    this.recipient = args.mustNext<string>('message.recipient');
    this.content = args.mustNext<string>('message.content');
    this.mediaCid = args.mustNext<string>('message.mediaCid');
    this.createdAt = args.mustNext<u64>('message.createdAt');
    return new Result<i32>(args.offset);
  }
}

class Pointer {
  constructor(public id: u64 = 0, public createdAt: u64 = 0) {}
}

class TopicStat implements Serializable {
  constructor(public topic: string = '', public score: u64 = 0) {}

  serialize(): StaticArray<u8> {
    return new Args().add(this.topic).add(this.score).serialize();
  }

  deserialize(data: StaticArray<u8>, offset: i32): Result<i32> {
    const args = new Args(data, offset);
    this.topic = args.mustNext<string>('topic');
    this.score = args.mustNext<u64>('score');
    return new Result<i32>(args.offset);
  }
}

function callerAddress(): string {
  return Context.caller().toString();
}

function now(): u64 {
  return Context.timestamp();
}

function keyBytes(key: string): StaticArray<u8> {
  return stringToBytes(key);
}

function hasKey(key: string): bool {
  return Storage.has<StaticArray<u8>>(keyBytes(key));
}

function setBytes(key: string, value: StaticArray<u8>): void {
  Storage.set<StaticArray<u8>>(keyBytes(key), value);
}

function getBytes(key: string): StaticArray<u8> {
  return Storage.get<StaticArray<u8>>(keyBytes(key));
}

function deleteKey(key: string): void {
  if (hasKey(key)) {
    Storage.del<StaticArray<u8>>(keyBytes(key));
  }
}

function setArgs(key: string, args: Args): void {
  setBytes(key, args.serialize());
}

function getArgs(key: string): Args {
  return new Args(getBytes(key));
}

function getU64(key: string, fallback: u64 = 0): u64 {
  if (!hasKey(key)) {
    return fallback;
  }
  return getArgs(key).mustNext<u64>('u64');
}

function setU64(key: string, value: u64): void {
  setArgs(key, new Args().add(value));
}

function incrementCounter(key: string): u64 {
  const next = getU64(key) + 1;
  setU64(key, next);
  return next;
}

function setStringValue(key: string, value: string): void {
  setArgs(key, new Args().add(value));
}

function getStringValue(key: string): string {
  return getArgs(key).mustNext<string>('string');
}

function normalizeHandle(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  assert(
    trimmed.length >= MIN_HANDLE_LENGTH && trimmed.length <= MAX_HANDLE_LENGTH,
    'INVALID_HANDLE_LENGTH',
  );
  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.charCodeAt(i);
    const isLetter =
      (code >= 97 && code <= 122) || (code >= 48 && code <= 57) || code === 95;
    const extraAllowed = code === 46 || code === 45;
    assert(isLetter || extraAllowed, 'INVALID_HANDLE_CHAR');
  }
  return trimmed;
}

function sanitizeSizedText(
  value: string,
  limit: i32,
  field: string,
): string {
  const trimmed = value.trim();
  assert(trimmed.length <= limit, `${field}_TOO_LONG`);
  return trimmed;
}

function sanitizeOptionalCid(value: string): string {
  const trimmed = value.trim();
  assert(trimmed.length <= MAX_MEDIA_CID_LENGTH, 'CID_TOO_LONG');
  return trimmed;
}

function profileKey(address: string): string {
  return PROFILE_KEY_PREFIX + address;
}

function handleKey(handle: string): string {
  return HANDLE_KEY_PREFIX + handle;
}

function postKey(id: u64): string {
  return POST_KEY_PREFIX + id.toString();
}

function userPostIndexKey(address: string, id: u64): string {
  return USER_POST_INDEX_PREFIX + address + ':' + id.toString();
}

function replyIndexKey(parentId: u64, replyId: u64): string {
  return REPLY_INDEX_PREFIX + parentId.toString() + ':' + replyId.toString();
}

function followKey(follower: string, target: string): string {
  return FOLLOW_KEY_PREFIX + follower + ':' + target;
}

function followersCountKey(address: string): string {
  return FOLLOWERS_COUNT_PREFIX + address;
}

function followingCountKey(address: string): string {
  return FOLLOWING_COUNT_PREFIX + address;
}

function topicKey(topic: string): string {
  return TOPIC_KEY_PREFIX + topic;
}

function reactionKey(postId: u64, address: string): string {
  return REACTION_KEY_PREFIX + postId.toString() + ':' + address;
}

function reactionCountKey(postId: u64, reaction: string): string {
  return (
    REACTION_COUNT_PREFIX + postId.toString() + ':' + reaction.toLowerCase()
  );
}

function conversationKey(a: string, b: string): string {
  return a < b
    ? CONVERSATION_PREFIX + a + ':' + b
    : CONVERSATION_PREFIX + b + ':' + a;
}

function messageCounterKey(conversationId: string): string {
  return MESSAGE_COUNTER_PREFIX + conversationId;
}

function messageKey(conversationId: string, messageId: u64): string {
  return MESSAGE_KEY_PREFIX + conversationId + ':' + messageId.toString();
}

function ensureProfile(address: string): Profile {
  assert(hasKey(profileKey(address)), 'PROFILE_NOT_FOUND');
  return loadProfile(address);
}

function loadProfile(address: string): Profile {
  const profile = new Profile();
  profile.deserialize(getBytes(profileKey(address)), 0).expect('PROFILE_DECODE');
  return profile;
}

function storeProfile(profile: Profile): void {
  setBytes(profileKey(profile.address), profile.serialize());
}

function loadPost(id: u64): Post {
  assert(hasKey(postKey(id)), 'POST_NOT_FOUND');
  const post = new Post();
  post.deserialize(getBytes(postKey(id)), 0).expect('POST_DECODE');
  return post;
}

function storePost(post: Post): void {
  setBytes(postKey(post.id), post.serialize());
}

function normalizeTopics(input: string[]): string[] {
  const sanitized = new Array<string>();
  for (let i = 0; i < input.length && sanitized.length < MAX_TOPICS; i++) {
    const topic = input[i].trim().toLowerCase();
    if (topic.length === 0 || topic.length > MAX_TOPIC_LENGTH) {
      continue;
    }
    if (sanitized.indexOf(topic) === -1) {
      sanitized.push(topic);
    }
  }
  return sanitized;
}

function updateTopicScores(topics: string[]): void {
  for (let i = 0; i < topics.length; i++) {
    const key = topicKey(topics[i]);
    setU64(key, getU64(key) + 1);
  }
}

function indexUserPost(address: string, postId: u64, createdAt: u64): void {
  setArgs(userPostIndexKey(address, postId), new Args().add(postId).add(createdAt));
}

function indexReply(parentId: u64, replyId: u64, createdAt: u64): void {
  setArgs(replyIndexKey(parentId, replyId), new Args().add(replyId).add(createdAt));
}

function toggleFollow(
  follower: string,
  target: string,
  shouldFollow: bool,
): bool {
  const key = followKey(follower, target);
  const already = hasKey(key);
  if (shouldFollow) {
    if (!already) {
      setArgs(key, new Args().add(true));
      setU64(followersCountKey(target), getU64(followersCountKey(target)) + 1);
      setU64(followingCountKey(follower), getU64(followingCountKey(follower)) + 1);
      return true;
    }
    return false;
  }

  if (already) {
    deleteKey(key);
    const followerCount = getU64(followersCountKey(target));
    setU64(followersCountKey(target), followerCount > 0 ? followerCount - 1 : 0);

    const followingCount = getU64(followingCountKey(follower));
    setU64(followingCountKey(follower), followingCount > 0 ? followingCount - 1 : 0);
    return true;
  }
  return false;
}

function serializeProfiles(profiles: Array<Profile>): StaticArray<u8> {
  const args = new Args();
  args.addSerializableObjectArray<Profile>(profiles);
  return args.serialize();
}

function serializePosts(posts: Array<Post>): StaticArray<u8> {
  const args = new Args();
  args.addSerializableObjectArray<Post>(posts);
  return args.serialize();
}

function serializeMessages(messages: Array<Message>): StaticArray<u8> {
  const args = new Args();
  args.addSerializableObjectArray<Message>(messages);
  return args.serialize();
}

function serializeTopicStats(stats: Array<TopicStat>): StaticArray<u8> {
  const args = new Args();
  args.addSerializableObjectArray<TopicStat>(stats);
  return args.serialize();
}

function loadPointers(prefix: string): Array<Pointer> {
  const keys = Storage.getKeys(keyBytes(prefix));
  const pointers = new Array<Pointer>();
  for (let i = 0; i < keys.length; i++) {
    const keyStr = bytesToString(keys[i]);
    const pointerArgs = getArgs(keyStr);
    const id = pointerArgs.mustNext<u64>('pointer.id');
    const createdAt = pointerArgs.mustNext<u64>('pointer.createdAt');
    pointers.push(new Pointer(id, createdAt));
  }
  return pointers;
}

function sortPointersDesc(pointers: Array<Pointer>): void {
  pointers.sort((a: Pointer, b: Pointer): i32 => {
    if (a.createdAt == b.createdAt) {
      return a.id > b.id ? -1 : 1;
    }
    return a.createdAt > b.createdAt ? -1 : 1;
  });
}

function takePostsFromPointers(
  pointers: Array<Pointer>,
  limit: u32,
): Array<Post> {
  sortPointersDesc(pointers);
  const posts = new Array<Post>();
  const pointerLen = <u32>pointers.length;
  const capped = limit < pointerLen ? limit : pointerLen;
  const count = <i32>capped;
  for (let i = 0; i < count; i++) {
    posts.push(loadPost(pointers[i].id));
  }
  return posts;
}

function sanitizePostContent(input: string): string {
  const trimmed = input.trim();
  assert(trimmed.length > 0, 'EMPTY_POST');
  assert(trimmed.length <= MAX_POST_LENGTH, 'POST_TOO_LONG');
  return trimmed;
}

function clampLimit(value: u32, fallback: u32 = 20, max: u32 = 100): u32 {
  if (value === 0) {
    return fallback;
  }
  return value > max ? max : value;
}

function normalizeReaction(raw: string): string {
  const lowered = raw.trim().toLowerCase();
  assert(lowered.length > 0, 'REACTION_REQUIRED');
  assert(
    SUPPORTED_REACTIONS.indexOf(lowered) !== -1,
    'REACTION_NOT_SUPPORTED',
  );
  return lowered;
}

function sanitizeMessageContent(input: string): string {
  const trimmed = input.trim();
  assert(trimmed.length > 0, 'EMPTY_MESSAGE');
  assert(trimmed.length <= MAX_POST_LENGTH, 'MESSAGE_TOO_LONG');
  return trimmed;
}

function adjustReactionCounters(post: Post, reaction: string, delta: i32): void {
  const key = reactionCountKey(post.id, reaction);
  const current = getU64(key);
  const absolute = delta >= 0 ? <u64>delta : <u64>-delta;
  if (delta >= 0) {
    setU64(key, current + absolute);
    post.likeCount += <u32>absolute;
  } else {
    const next = current > absolute ? current - absolute : 0;
    setU64(key, next);
    post.likeCount = post.likeCount > <u32>absolute
      ? post.likeCount - <u32>absolute
      : 0;
  }
}

function getFollowingAddresses(address: string): Array<string> {
  const prefix = FOLLOW_KEY_PREFIX + address + ':';
  const keys = Storage.getKeys(keyBytes(prefix));
  const following = new Array<string>();
  for (let i = 0; i < keys.length; i++) {
    const keyStr = bytesToString(keys[i]);
    if (keyStr.length <= prefix.length) {
      continue;
    }
    following.push(keyStr.substring(prefix.length));
  }
  return following;
}

function arrayContains(list: Array<string>, value: string): bool {
  return list.indexOf(value) !== -1;
}

function feedForAuthors(authors: Array<string>, limit: u32): Array<Post> {
  const posts = new Array<Post>();
  const latest = getU64(POST_COUNTER_KEY, 0);
  let cursor = latest;
  const cap = <i32>limit;
  while (cursor > 0 && posts.length < cap) {
    if (hasKey(postKey(cursor))) {
      const post = loadPost(cursor);
      if (arrayContains(authors, post.author)) {
        posts.push(post);
      }
    }
    cursor -= u64(1);
  }
  return posts;
}

function collectTrendingTopics(limit: u32): Array<TopicStat> {
  const keys = Storage.getKeys(keyBytes(TOPIC_KEY_PREFIX));
  const stats = new Array<TopicStat>();
  for (let i = 0; i < keys.length; i++) {
    const keyStr = bytesToString(keys[i]);
    if (!keyStr.startsWith(TOPIC_KEY_PREFIX)) {
      continue;
    }
    const topic = keyStr.substring(TOPIC_KEY_PREFIX.length);
    const score = getU64(keyStr);
    stats.push(new TopicStat(topic, score));
  }
  stats.sort((a: TopicStat, b: TopicStat): i32 => {
    if (a.score == b.score) {
      return a.topic < b.topic ? -1 : 1;
    }
    return a.score > b.score ? -1 : 1;
  });
  const statLen = <u32>stats.length;
  const capped = limit < statLen ? limit : statLen;
  const view = new Array<TopicStat>();
  for (let i = 0; i < <i32>capped; i++) {
    view.push(stats[i]);
  }
  return view;
}

function searchProfilesByHandle(query: string, limit: u32): Array<Profile> {
  const normalized = query.trim().toLowerCase();
  const keys = Storage.getKeys(keyBytes(HANDLE_KEY_PREFIX));
  const profiles = new Array<Profile>();
  const limitInt = <i32>limit;
  for (let i = 0; i < keys.length && profiles.length < limitInt; i++) {
    const keyStr = bytesToString(keys[i]);
    if (!keyStr.startsWith(HANDLE_KEY_PREFIX)) {
      continue;
    }
    const handle = keyStr.substring(HANDLE_KEY_PREFIX.length);
    if (normalized.length > 0 && handle.indexOf(normalized) === -1) {
      continue;
    }
    const owner = getStringValue(keyStr);
    if (!hasKey(profileKey(owner))) {
      continue;
    }
    profiles.push(loadProfile(owner));
  }
  return profiles;
}

export function upsert_profile(binary: StaticArray<u8>): void {
  const args = new Args(binary);
  const handleInput = args.mustNext<string>('handle');
  const displayNameInput = args.mustNext<string>('displayName');
  const bioInput = args.mustNext<string>('bio');
  const avatarCidInput = args.mustNext<string>('avatarCid');
  const bannerCidInput = args.mustNext<string>('bannerCid');

  const caller = callerAddress();
  const handle = normalizeHandle(handleInput);
  const displayName = sanitizeSizedText(
    displayNameInput,
    MAX_DISPLAY_NAME_LENGTH,
    'DISPLAY_NAME',
  );
  const bio = sanitizeSizedText(bioInput, MAX_BIO_LENGTH, 'BIO');
  const avatarCid = sanitizeOptionalCid(avatarCidInput);
  const bannerCid = sanitizeOptionalCid(bannerCidInput);

  let profile: Profile;
  const exists = hasKey(profileKey(caller));
  if (exists) {
    profile = loadProfile(caller);
    if (profile.handle != handle) {
      deleteKey(handleKey(profile.handle));
    }
  } else {
    profile = new Profile();
    profile.address = caller;
    profile.createdAt = now();
  }

  if (!exists || profile.handle != handle) {
    if (hasKey(handleKey(handle))) {
      const currentOwner = getStringValue(handleKey(handle));
      assert(currentOwner === caller, 'HANDLE_ALREADY_TAKEN');
    }
  }

  profile.handle = handle;
  profile.displayName = displayName;
  profile.bio = bio;
  profile.avatarCid = avatarCid;
  profile.bannerCid = bannerCid;
  profile.updatedAt = now();

  storeProfile(profile);
  setStringValue(handleKey(handle), caller);

  generateEvent(`profile:${caller}:updated`);
}

export function get_profile(binary: StaticArray<u8>): StaticArray<u8> {
  let address = callerAddress();
  if (binary.length > 0) {
    const args = new Args(binary);
    const provided = args.mustNext<string>('address');
    if (provided.length > 0) {
      address = provided;
    }
  }
  return ensureProfile(address).serialize();
}

export function get_profile_by_handle(
  binary: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binary);
  const handle = normalizeHandle(args.mustNext<string>('handle'));
  assert(hasKey(handleKey(handle)), 'HANDLE_UNKNOWN');
  const address = getStringValue(handleKey(handle));
  return ensureProfile(address).serialize();
}

export function search_profiles(binary: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binary);
  const query = args.mustNext<string>('query');
  const limit = clampLimit(args.mustNext<u32>('limit'), 10, 50);
  return serializeProfiles(searchProfilesByHandle(query, limit));
}

export function follow(binary: StaticArray<u8>): void {
  const args = new Args(binary);
  const target = args.mustNext<string>('target');
  const caller = callerAddress();
  assert(target != caller, 'CANNOT_FOLLOW_SELF');
  ensureProfile(caller);
  ensureProfile(target);
  const changed = toggleFollow(caller, target, true);
  assert(changed, 'ALREADY_FOLLOWING');
  generateEvent(`follow:${caller}:${target}`);
}

export function unfollow(binary: StaticArray<u8>): void {
  const args = new Args(binary);
  const target = args.mustNext<string>('target');
  const caller = callerAddress();
  const changed = toggleFollow(caller, target, false);
  assert(changed, 'NOT_FOLLOWING');
  generateEvent(`unfollow:${caller}:${target}`);
}

export function get_follow_stats(
  binary: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binary);
  const target = args.mustNext<string>('target');
  let viewer = '';
  if (args.offset < binary.length) {
    viewer = args.mustNext<string>('viewer');
  }
  const viewerAddr = viewer.length > 0 ? viewer : callerAddress();
  ensureProfile(target);
  const followers = getU64(followersCountKey(target));
  const following = getU64(followingCountKey(target));
  const viewerFollows = hasKey(followKey(viewerAddr, target));
  const viewerFollowedBy = hasKey(followKey(target, viewerAddr));
  return new Args()
    .add(followers)
    .add(following)
    .add(viewerFollows)
    .add(viewerFollowedBy)
    .serialize();
}

export function create_post(binary: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binary);
  const content = sanitizePostContent(args.mustNext<string>('content'));
  const mediaCid = sanitizeOptionalCid(args.mustNext<string>('mediaCid'));
  const topicsResult = args.nextStringArray();
  const topics = normalizeTopics(
    topicsResult.isOk() ? topicsResult.unwrap() : [],
  );
  const caller = callerAddress();
  ensureProfile(caller);
  const id = incrementCounter(POST_COUNTER_KEY);
  const timestamp = now();
  const post = new Post(
    id,
    caller,
    content,
    mediaCid,
    topics,
    0,
    false,
    0,
    0,
    timestamp,
  );
  storePost(post);
  indexUserPost(caller, id, timestamp);
  if (topics.length > 0) {
    updateTopicScores(topics);
  }
  generateEvent(`post:${id.toString()}:created`);
  return new Args().add(id).serialize();
}

export function create_reply(binary: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binary);
  const parentId = args.mustNext<u64>('parentId');
  const content = sanitizePostContent(args.mustNext<string>('content'));
  const mediaCid = sanitizeOptionalCid(args.mustNext<string>('mediaCid'));
  const topicsResult = args.nextStringArray();
  const topics = normalizeTopics(
    topicsResult.isOk() ? topicsResult.unwrap() : [],
  );
  const caller = callerAddress();
  ensureProfile(caller);
  const parent = loadPost(parentId);
  const id = incrementCounter(POST_COUNTER_KEY);
  const timestamp = now();
  const reply = new Post(
    id,
    caller,
    content,
    mediaCid,
    topics,
    parent.id,
    true,
    0,
    0,
    timestamp,
  );
  storePost(reply);
  parent.replyCount += 1;
  storePost(parent);
  indexUserPost(caller, id, timestamp);
  indexReply(parent.id, id, timestamp);
  generateEvent(`reply:${parent.id.toString()}:${id.toString()}`);
  return new Args().add(id).serialize();
}

export function react_to_post(binary: StaticArray<u8>): void {
  const args = new Args(binary);
  const postId = args.mustNext<u64>('postId');
  const reaction = normalizeReaction(args.mustNext<string>('reaction'));
  const caller = callerAddress();
  const post = loadPost(postId);
  const key = reactionKey(postId, caller);
  if (hasKey(key)) {
    const existing = getStringValue(key);
    if (existing == reaction) {
      deleteKey(key);
      adjustReactionCounters(post, reaction, -1);
      storePost(post);
      return;
    }
    adjustReactionCounters(post, existing, -1);
  }
  setStringValue(key, reaction);
  adjustReactionCounters(post, reaction, 1);
  storePost(post);
  generateEvent(`reaction:${postId.toString()}:${reaction}`);
}

export function get_post(binary: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binary);
  const postId = args.mustNext<u64>('postId');
  return loadPost(postId).serialize();
}

export function list_recent_posts(
  binary: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binary);
  const limit = clampLimit(args.mustNext<u32>('limit'), 10, 50);
  const posts = new Array<Post>();
  const latest = getU64(POST_COUNTER_KEY, 0);
  let cursor = latest;
  const cap = <i32>limit;
  while (cursor > 0 && posts.length < cap) {
    if (hasKey(postKey(cursor))) {
      posts.push(loadPost(cursor));
    }
    cursor -= u64(1);
  }
  return serializePosts(posts);
}

export function list_posts_by_user(
  binary: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binary);
  const address = args.mustNext<string>('address');
  const limit = clampLimit(args.mustNext<u32>('limit'), 10, 50);
  const pointers = loadPointers(USER_POST_INDEX_PREFIX + address + ':');
  return serializePosts(takePostsFromPointers(pointers, limit));
}

export function list_replies(binary: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binary);
  const parentId = args.mustNext<u64>('parentId');
  const limit = clampLimit(args.mustNext<u32>('limit'), 10, 50);
  loadPost(parentId);
  const pointers = loadPointers(REPLY_INDEX_PREFIX + parentId.toString() + ':');
  return serializePosts(takePostsFromPointers(pointers, limit));
}

export function list_trending_topics(
  binary: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binary);
  const limit = clampLimit(args.mustNext<u32>('limit'), 5, 25);
  return serializeTopicStats(collectTrendingTopics(limit));
}

export function list_feed(binary: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binary);
  const limit = clampLimit(args.mustNext<u32>('limit'), 20, 60);
  const caller = callerAddress();
  ensureProfile(caller);
  const authors = getFollowingAddresses(caller);
  if (!arrayContains(authors, caller)) {
    authors.push(caller);
  }
  return serializePosts(feedForAuthors(authors, limit));
}

export function send_message(binary: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binary);
  const peer = args.mustNext<string>('peer');
  const content = sanitizeMessageContent(args.mustNext<string>('content'));
  const mediaCid = sanitizeOptionalCid(args.mustNext<string>('mediaCid'));
  const caller = callerAddress();
  assert(peer != caller, 'INVALID_RECIPIENT');
  ensureProfile(caller);
  ensureProfile(peer);
  const convoId = conversationKey(caller, peer);
  const messageId = incrementCounter(messageCounterKey(convoId));
  const message = new Message(
    convoId,
    messageId,
    caller,
    peer,
    content,
    mediaCid,
    now(),
  );
  setBytes(messageKey(convoId, messageId), message.serialize());
  generateEvent(`message:${convoId}:${messageId.toString()}`);
  return new Args().add(messageId).serialize();
}

export function list_messages(binary: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binary);
  const peer = args.mustNext<string>('peer');
  const limit = clampLimit(args.mustNext<u32>('limit'), 20, 100);
  const caller = callerAddress();
  ensureProfile(caller);
  ensureProfile(peer);
  const convoId = conversationKey(caller, peer);
  const latest = getU64(messageCounterKey(convoId), 0);
  let cursor = latest;
  const cap = <i32>limit;
  const messages = new Array<Message>();
  while (cursor > 0 && messages.length < cap) {
    const key = messageKey(convoId, cursor);
    if (hasKey(key)) {
      const message = new Message();
      message.deserialize(getBytes(key), 0).expect('MESSAGE_DECODE');
      messages.push(message);
    }
    cursor -= u64(1);
  }
  return serializeMessages(messages);
}

