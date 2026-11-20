import type {
  Comment,
  DemoData,
  Post,
  Question,
  ViewState,
} from "../demo-types";
import { forumApi } from "./api";

const STORAGE = "punto_session_v1";
const guest = {
  id: "",
  username: "invitado",
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
) {
  let db = browserState();
  try {
    const session = JSON.parse(localStorage.getItem(STORAGE) ?? "null");
    if (typeof session?.currentUserId === "string")
      db.currentUserId = session.currentUserId;
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
      const { currentUserId, sessionToken } = db;
      localStorage.setItem(
        STORAGE,
        JSON.stringify({ currentUserId, sessionToken }),
      );
    } catch (error) {
      console.warn("Storage unavailable", error);
    }
  };
  const postId =
    routeId && (view === "postDetail" || view === "report")
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
    sort: "hot",
    tab:
      view === "communityRanking"
        ? "top"
        : view === "communityModeration"
          ? "mod"
          : "posts",
    composerType: "post",
    profileMenu: false,
    replyTo: null,
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
    let data = await forumApi.load(db.currentUserId, db.sessionToken, signal);
    const active =
      data.users.find((user) => user.id === db.currentUserId) ?? data.users[0];
    if (active && active.id !== db.currentUserId) {
      data = await forumApi.load(active.id, db.sessionToken, signal);
    }
    Object.assign(db, data, { currentUserId: active?.id ?? "" });
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
  async function reset(signal: AbortSignal) {
    db = browserState();
    await connect(signal);
  }
  return {
    get db() {
      return db;
    },
    ui,
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
    save,
    connect,
    reset,
  };
}

export type ScreenContext = ReturnType<typeof createScreenContext>;
export type ScreenRenderer = (context: ScreenContext) => string;
