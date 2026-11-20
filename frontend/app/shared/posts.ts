import type { ScreenContext } from "./state";
import { type Post } from "../demo-types";
import { ico, cicon, esc, dateLabel, count } from "./presentation";

export function sortPosts(context: ScreenContext, posts: Post[]) {
  const { ui, postPoints } = context;
  const arr = [...posts].filter((p) => !p.hidden);
  if (ui.sort === "new")
    return arr.sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
  if (ui.sort === "top") {
    const week = Date.now() - 7 * 86400000;
    return arr
      .filter((p) => new Date(p.createdAt).getTime() >= week)
      .sort((a, b) => postPoints(b) - postPoints(a));
  }
  return arr.sort(
    (a, b) =>
      postPoints(b) / ((Date.now() - Date.parse(b.createdAt)) / 3600000 + 2) -
      postPoints(a) / ((Date.now() - Date.parse(a.createdAt)) / 3600000 + 2),
  );
}

export function filters(context: ScreenContext) {
  const { ui } = context;
  return `<div class="filter-tabs">${[
    ["hot", "flame", "Hot"],
    ["new", "clock", "Nuevo"],
    ["top", "trending", "Top semanal"],
  ]
    .map(
      ([type, iconName, label]) =>
        `<button class="filter-tab ${ui.sort === type ? "active" : ""}" data-action="sort" data-value="${type}">${ico(iconName, 15)} ${label}</button>`,
    )
    .join("")}</div>`;
}

export function postCard(context: ScreenContext, p: Post) {
  const { comm, user, vote, db, me, canSee, postPoints, numberOfReplies } =
    context;
  const c = comm(p.communityId);
  if (!c) return "";
  const author = user(p.authorId),
    v = vote("post", p.id),
    saved = db.saved.some((s) => s.userId === me().id && s.postId === p.id),
    locked = p.blindMode && !canSee(p);
  return `<article class="card post-card">
    <div class="post-topline">${cicon(c)}<button class="comm" data-action="open-community" data-id="${c.id}">${esc(c.name)}</button><span class="dot">·</span><span class="post-date">por u/${esc(author?.username)}</span><span class="dot">·</span><span class="post-date">${dateLabel(p.createdAt)}</span><button class="post-more" data-action="open-post" data-id="${p.id}">${ico("dots", 17)}</button></div>
    <h3 class="post-title" data-action="open-post" data-id="${p.id}">${esc(p.title)}</h3>
    <p class="post-content">${esc(p.content)}</p>
    <div class="post-tags">${p.isQuestion ? `<span class="tag">${ico("message", 12)} Pregunta</span>` : ""}${p.blindMode ? `<span class="tag orange">${ico("lock", 12)} Opiná primero</span>` : ""}</div>
    ${locked ? `<div class="locked-banner"><span class="lock-square">${ico("lock", 17)}</span><div><b>Primero tu opinión, después las demás.</b><small>Respondé para desbloquear la conversación.</small></div><button class="btn btn-sm btn-primary" data-action="open-post" data-id="${p.id}">Responder</button></div>` : ""}
    <div class="post-footer"><button class="footer-pill ${v === 1 ? "on up" : ""}" data-action="vote-post" data-id="${p.id}" data-value="1" title="Votar a favor">${ico("arrowUp", 17)}</button><span style="font-size:12px;font-weight:850;color:var(--ink-secondary)">${count(postPoints(p))}</span><button class="footer-pill ${v === -1 ? "on down" : ""}" data-action="vote-post" data-id="${p.id}" data-value="-1" title="Votar en contra">${ico("arrowDown", 17)}</button>
    <button class="footer-pill" data-action="open-post" data-id="${p.id}">${ico("message", 16)} ${numberOfReplies(p.id)} comentarios</button><span class="foot-gap"></span><button class="footer-pill ${saved ? "on" : ""}" data-action="save-post" data-id="${p.id}">${ico("bookmark", 16)} ${saved ? "Guardado" : "Guardar"}</button><button class="footer-pill" data-action="report-post" data-id="${p.id}" title="Reportar">${ico("flag", 16)}</button></div>
  </article>`;
}

export function noContent(
  title: string,
  message: string,
  iconName = "message",
  action = "",
  actionName = "",
) {
  return `<div class="card blank"><div class="blank-icon">${ico(iconName, 32)}</div><h3>${esc(title)}</h3><p>${esc(message)}</p>${action ? `<button class="btn btn-primary btn-sm" data-action="${action}" ${actionName ? `data-view="${actionName}"` : ""}>Explorar comunidades</button>` : ""}</div>`;
}
