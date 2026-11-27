import type { AnonymousCategory } from "./shared/anonymous-categories";

export interface User {
  id: string;
  username: string;
  email: string;
  karmaBase: number;
  joinedAt: string;
  lastConnectedAt?: string;
  color: string;
  description?: string;
  siteRole?: SiteRole;
  photoVersion?: string;
  profileVisible?: boolean;
}
export interface Community {
  bannerVersion?: string;
  id: string;
  name: string;
  description: string;
  creatorId: string;
  nsfw: boolean;
  baseMembers: number;
  bg: string;
  createdAt: string;
  photoVersion?: string;
}

export type PhotoTarget = "usuarios" | "comunidades" | "banners";
export interface Question {
  id: string;
  title: string;
  content: string;
  blindMode: boolean;
  createdAt: string;
}
export interface AnonymousQuestion extends Question {
  category: AnonymousCategory;
  mine?: boolean;
}
export interface Post extends Question {
  photoVersion?: string;
  editedAt?: string;
  deleted?: boolean;
  communityId: string;
  authorId: string;
  baseScore: number;
  isQuestion: boolean;
  hidden: boolean;
}
export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  text: string;
  createdAt: string;
  editedAt?: string;
  baseScore: number;
  deleted: boolean;
}
export interface ForumNotification {
  commentId: number | null;
  postId: string;
  author: string;
  title: string;
  isReply: boolean;
  read: boolean;
  createdAt: string;
}
interface Vote {
  userId: string;
  value: number;
  createdAt: string;
}
interface SavedPost {
  userId: string;
  postId: string;
  createdAt: string;
}
export interface DemoData {
  version: 1;
  currentUserId: string;
  users: User[];
  communities: Community[];
  memberships: {
    userId: string;
    communityId: string;
    role: "miembro" | "moderador";
    joinedAt: string;
    pinned?: boolean;
  }[];
  posts: Post[];
  comments: Comment[];
  postVotes: (Vote & { postId: string })[];
  commentVotes: (Vote & { commentId: string })[];
  saved: SavedPost[];
  reports: (SavedPost & { id: string; reason: string })[];
  reportedComments?: string[];
  bans: {
    id: string;
    communityId: string;
    userId: string;
    moderatorId: string;
    reason: string;
    until: string | null;
  }[];
  anonymousQuestions: AnonymousQuestion[];
  anonymousAnswers: {
    id: string;
    questionId: string;
    text: string;
    createdAt: string;
    mine?: boolean;
  }[];
  anonymousUnlocks: { questionId: string; sessionToken: string }[];
  sessionToken: string;
}

export type HeaderMenu = "profile" | "notifications";
export type SiteRole = "usuario" | "subadmin" | "admin";
export type AdminContentSection = "posts" | "comentarios" | "preguntas" | "respuestas";
export type AdminSection = AdminContentSection | "subadmins" | "usuarios";

export interface AdminSelection {
  section: AdminSection;
  page: number;
  query: string;
}

export interface ViewState {
  view:
    | "home"
    | "communities"
    | "community"
    | "postDetail"
    | "anonymous"
    | "anonDetail"
    | "profile"
    | "users"
    | "userProfile"
    | "admin"
    | "saved"
    | "search"
    | "newPost"
    | "editPost"
    | "newAnonymous"
    | "newCommunity"
    | "login"
    | "register"
    | "report"
    | "ban"
    | "communityRanking"
    | "communityModeration";
  communityId: string;
  postId: string | null;
  anonId: string | null;
  profileUsername: string;
  sort: string;
  tab: string;
  composerType: string;
  openMenu: HeaderMenu | null;
  replyTo: string | null;
  editingCommentId: string | null;
  query: string;
  reportId: string | null;
  banUserId: string | null;
}
