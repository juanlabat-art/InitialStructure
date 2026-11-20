export interface User {
  id: string;
  username: string;
  email: string;
  karmaBase: number;
  joinedAt: string;
  color: string;
}
export interface Community {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  nsfw: boolean;
  baseMembers: number;
  emoji: string;
  bg: string;
  createdAt: string;
}
export interface Question {
  id: string;
  title: string;
  content: string;
  blindMode: boolean;
  createdAt: string;
}
export interface Post extends Question {
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
  baseScore: number;
  deleted: boolean;
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
  }[];
  posts: Post[];
  comments: Comment[];
  postVotes: (Vote & { postId: string })[];
  commentVotes: (Vote & { commentId: string })[];
  saved: SavedPost[];
  reports: (SavedPost & { id: string; reason: string })[];
  bans: {
    id: string;
    communityId: string;
    userId: string;
    moderatorId: string;
    reason: string;
    until: string | null;
  }[];
  anonymousQuestions: Question[];
  anonymousAnswers: {
    id: string;
    questionId: string;
    text: string;
    createdAt: string;
  }[];
  anonymousUnlocks: { questionId: string; sessionToken: string }[];
  sessionToken: string;
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
    | "saved"
    | "search"
    | "newPost"
    | "newAnonymous"
    | "newCommunity"
    | "register"
    | "report"
    | "ban"
    | "communityRanking"
    | "communityModeration";
  communityId: string;
  postId: string | null;
  anonId: string | null;
  sort: string;
  tab: string;
  composerType: string;
  profileMenu: boolean;
  replyTo: string | null;
  query: string;
  reportId: string | null;
  banUserId: string | null;
}
