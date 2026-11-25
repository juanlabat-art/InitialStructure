import type {
  AdminSelection,
  Comment,
  DemoData,
  ForumNotification,
  Post,
  Question,
  SiteRole,
  User,
  ViewState,
} from "../demo-types";
import { forumApi } from "./api";

const STORAGE = "punto_session_v1";
let newAccountId: string | null = null;

type Conversation = { id: string; kind: "post" | "anonymous" };
const pendingUnlocks = new Map<string, Conversation[]>();

function getPendingUnlocks(userId: string) {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(`vozero_unlocks_${userId}`) ?? "null");
    if (Array.isArray(stored)) {
      return stored.filter((item): item is Conversation =>
        item && ["post", "anonymous"].includes(item.kind) && /^[1-9]\d*$/.test(item.id),
      );
    }
  } catch {
    // Keep notices available in memory when browser storage is disabled.
  }
  return pendingUnlocks.get(userId) ?? [];
}

export function rememberUnlockedConversation(userId: string, conversation: Conversation) {
  const entries = getPendingUnlocks(userId);
  if (entries.some(({ id, kind }) => id === conversation.id && kind === conversation.kind)) return;
  const next = [...entries, conversation];
  pendingUnlocks.set(userId, next);
  try {
    localStorage.setItem(`vozero_unlocks_${userId}`, JSON.stringify(next));
  } catch {
    // The notice is still available in this tab.
  }
}

export function clearBrowserSession() {
  try {
    localStorage.removeItem(STORAGE);
  } catch {
    // The account session is closed independently of browser storage.
  }
}

export function showWelcomeForNewAccount(userId: string) {
  newAccountId = userId;
}

const guest: User = {
  id: "",
  username: "",
  email: "",
  karmaBase: 0,
  joinedAt: "2026-01-01T00:00:00Z",
  color: "",
};

export function createScreenContext(
  view: ViewState["view"],
  routeId?: string,
  query?: string,
  targetId?: string,
  adminSelection?: AdminSelection,
) {
  const db = browserState();
  let showWelcome = false;
  let unlockedConversations: Conversation[] | null = null;
  let votesToNextKarma: number | null = null;
  let siteRole: SiteRole | null = null;
  let adminEntries: Awaited<ReturnType<typeof forumApi.adminEntries>> | null = null;
  let adminError = "";
  let karma: Awaited<ReturnType<typeof forumApi.karma>> | null = null;
  let ranking: Awaited<ReturnType<typeof forumApi.ranking>> = [];
  try {
    const session = JSON.parse(localStorage.getItem(STORAGE) ?? "null");
    if (
      typeof session?.sessionToken === "string" &&
      /^[a-f0-9-]{36}$/.test(session.sessionToken)
    )
      db.sessionToken = session.sessionToken;
  } catch {
    // A fresh browser session also works when storage is unavailable.
  }
  const save = () => {
    try {
      const { sessionToken } = db;
      localStorage.setItem(
        STORAGE,
        JSON.stringify({ sessionToken }),
      );
    } catch (error) {
      console.warn("Storage unavailable", error);
    }
  };
  const postId =
    routeId && ["postDetail", "editPost", "report"].includes(view)
      ? (db.posts.find((p) => p.id === routeId)?.id ??
        db.posts.find((p) => p.id === "p" + routeId)?.id ??
        routeId)
      : null;
  const ui: ViewState = {
    view,
    communityId:
      routeId &&
      [
        "community",
        "communityRanking",
        "communityModeration",
        "ban",
        "newPost",
      ].includes(view)
        ? routeId
        : (db.posts.find((p) => p.id === postId)?.communityId ?? "c2"),
    postId,
    anonId: view === "anonDetail" ? (routeId ?? null) : null,
    profileUsername: view === "userProfile" ? (routeId ?? "").toLowerCase() : "",
    sort: "hot",
    tab:
      view === "communityRanking"
        ? "top"
        : view === "communityModeration"
          ? "mod"
          : "posts",
    composerType: "post",
    openMenu: null,
    replyTo: null,
    editingCommentId: null,
    query: query ?? "",
    reportId: view === "report" ? postId : null,
    banUserId: targetId ?? null,
  };
  const me = () => db.users.find((u) => u.id === db.currentUserId) ?? guest;
  const user = (uid: string | null) => db.users.find((u) => u.id === uid);
  const comm = (cid: string) => db.communities.find((c) => c.id === cid);
  const post = (pid: string | null) => db.posts.find((p) => p.id === pid);
  const membership = (uid: string | null, cid: string) =>
    db.memberships.find((m) => m.userId === uid && m.communityId === cid);
  const isMod = (cid: string) => membership(me().id, cid)?.role === "moderador";
  const banned = (uid: string | null, cid: string) =>
    db.bans.some(
      (b) =>
        b.userId === uid &&
        b.communityId === cid &&
        (!b.until || new Date(b.until) > new Date()),
    );
  const memberCount = (cid: string) =>
    (comm(cid)?.baseMembers || 0) +
    db.memberships.filter((m) => m.communityId === cid).length;
  const votesFor = (type: "post" | "comment", objectId: string) =>
    type === "post"
      ? db.postVotes.filter((v) => v.postId === objectId)
      : db.commentVotes.filter((v) => v.commentId === objectId);
  const vote = (type: "post" | "comment", objectId: string) =>
    votesFor(type, objectId).find((v) => v.userId === me().id)?.value ?? 0;
  const points = (item: Post | Comment, type: "post" | "comment") =>
    item.baseScore +
    votesFor(type, item.id).reduce((sum, v) => sum + v.value, 0);
  const postPoints = (p: Post) => points(p, "post");
  const commentPoints = (c: Comment) => points(c, "comment");
  const totalKarma = (uid: string) => user(uid)?.karmaBase ?? 0;
  const canSee = (p: Post) =>
    !p.blindMode ||
    p.authorId === me().id ||
    db.comments.some(
      (c) => c.postId === p.id && c.authorId === me().id && !c.deleted,
    );
  const anonUnlocked = (q: Question) =>
    !q.blindMode ||
    db.anonymousUnlocks.some(
      (x) => x.questionId === q.id && x.sessionToken === db.sessionToken,
    );
  const numberOfReplies = (pid: string) =>
    db.comments.filter((c) => c.postId === pid).length;
  const numberOfAnonAnswers = (qid: string) =>
    db.anonymousAnswers.filter((a) => a.questionId === qid).length;
  const notifications: ForumNotification[] = [];
  function browserState(): DemoData {
    return {
      version: 1,
      currentUserId: "",
      sessionToken: crypto.randomUUID(),
      users: [],
      posts: [],
      comments: [],
      communities: [],
      memberships: [],
      postVotes: [],
      commentVotes: [],
      saved: [],
      reports: [],
      bans: [],
      anonymousQuestions: [],
      anonymousAnswers: [],
      anonymousUnlocks: [],
    };
  }
  async function connect(signal: AbortSignal) {
    const { votesToNextKarma: remainingVotes, siteRole: currentRole, ...data } = await forumApi.load(db.sessionToken, signal);
    signal.throwIfAborted();
    Object.assign(db, data);
    votesToNextKarma = remainingVotes;
    siteRole = currentRole;
    if (adminSelection) {
      adminEntries = null;
      adminError = "";
      const adminOnly = adminSelection.section === "subadmins" || adminSelection.section === "usuarios";
      const allowed = siteRole === "admin" || (siteRole === "subadmin" && !adminOnly);
      if (allowed) {
        try {
          adminEntries = await forumApi.adminEntries(adminSelection, signal);
        } catch (error) {
          adminError = error instanceof Error ? error.message : "No se pudo cargar el panel de administración.";
        }
      }
    }
    if (view === "home" && newAccountId && db.currentUserId === newAccountId) {
      showWelcome = true;
      newAccountId = null;
    }
    if (view === "home" && db.currentUserId && unlockedConversations === null) {
      unlockedConversations = getPendingUnlocks(db.currentUserId);
      pendingUnlocks.delete(db.currentUserId);
      try {
        localStorage.removeItem(`vozero_unlocks_${db.currentUserId}`);
      } catch {
        // The notice can still be dismissed in this tab.
      }
    }
    if (view === "profile" || (view === "userProfile" && ui.profileUsername === me().username.toLowerCase())) {
      karma = db.currentUserId ? await forumApi.karma(db.currentUserId, signal) : null;
    }
    if (view === "communityRanking" && routeId && comm(routeId)) {
      ranking = await forumApi.ranking(routeId, signal);
    }
    if (
      ui.postId &&
      (!routeId || !db.posts.some((post) => post.id === ui.postId))
    ) {
      ui.postId = routeId ?? null;
      if (view === "report") ui.reportId = ui.postId;
    }
    const currentPost = post(ui.postId);
    if (currentPost) ui.communityId = currentPost.communityId;
    save();
  }
  return {
    get db() {
      return db;
    },
    ui,
    notifications,
    me,
    user,
    comm,
    post,
    membership,
    isMod,
    banned,
    memberCount,
    vote,
    postPoints,
    commentPoints,
    totalKarma,
    canSee,
    anonUnlocked,
    numberOfReplies,
    numberOfAnonAnswers,
    votesFor,
    connect,
    adminSelection,
    get siteRole() {
      return siteRole;
    },
    get adminEntries() {
      return adminEntries;
    },
    get adminError() {
      return adminError;
    },
    get showWelcome() {
      return showWelcome;
    },
    get unlockedConversations() {
      return unlockedConversations ?? [];
    },
    dismissUnlockedConversation(id: string, kind: string | undefined) {
      unlockedConversations = unlockedConversations?.filter((item) => item.id !== id || item.kind !== kind) ?? [];
    },
    get votesToNextKarma() {
      return votesToNextKarma;
    },
    get karma() {
      return karma;
    },
    get ranking() {
      return ranking;
    },
  };
}

export type ScreenContext = ReturnType<typeof createScreenContext>;
export type ScreenRenderer = (context: ScreenContext) => string;
