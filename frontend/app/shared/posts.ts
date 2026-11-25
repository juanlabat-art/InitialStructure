import type { ScreenContext } from "./state";
import { type Post } from "../demo-types";
import { ico, cicon, esc, relativeTime, count, userProfileLink } from "./presentation";

export function sortPosts(context: ScreenContext, posts: Post[], sort = context.ui.sort) {
  const { postPoints } = context;
  const arr = [...new Map(posts.filter((p) => !p.hidden).map((p) => [p.id, p])).values()];
  const now = Date.now();
  const recentFirst = (a: Post, b: Post) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || Number(b.id) - Number(a.id);
  if (sort === "new")
    return arr.sort(recentFirst);
  if (sort === "top") {
    const week = now - 7 * 86400000;
    return arr
      .filter((p) => new Date(p.createdAt).getTime() >= week)
      .sort((a, b) => postPoints(b) - postPoints(a) || recentFirst(a, b));
  }
  const hotScore = (p: Post) => postPoints(p) / (Math.max(0, now - Date.parse(p.createdAt)) / 3600000 + 2);
  return arr.sort((a, b) => hotScore(b) - hotScore(a) || recentFirst(a, b));
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

export function postDate(p: Post) {
  return relativeTime(p.createdAt, "post-date");
}

export function editedPostBadge(p: Post) {
  return p.editedAt
    ? `<time class="tag post-edited" datetime="${esc(p.editedAt)}">${ico("edit", 12)} Editado</time>`
    : "";
}

export function postActions(context: ScreenContext, p: Post) {
  const userId = context.me().id;
  if (!userId || p.authorId !== userId || p.deleted) return "";
  return `<details class="post-options" name="post-options">
    <summary class="post-more" aria-label="Opciones de publicación">${ico("dots", 18)}</summary>
    <div class="post-options-panel">
      ${p.hidden ? "" : `<button type="button" class="menu-item" data-action="edit-post" data-id="${p.id}">${ico("edit", 15)} Editar publicación</button>`}
      <button type="button" class="menu-item post-option-delete" data-action="delete-post" data-id="${p.id}">${ico("trash", 15)} Eliminar publicación</button>
    </div>
  </details>`;
}

export function savePostButton(context: ScreenContext, p: Post) {
  const saved = context.db.saved.some((s) => s.userId === context.me().id && s.postId === p.id);
  return `<button type="button" class="footer-pill${saved ? " on saved-post" : ""}" data-action="save-post" data-id="${p.id}" aria-pressed="${saved}">${ico("bookmark", 16)} ${saved ? "Guardado" : "Guardar"}</button>`;
}

export function reportPostButton(context: ScreenContext, p: Post, withLabel = false) {
  if (p.deleted || p.authorId === context.me().id) return "";
  return `<button type="button" class="footer-pill" data-action="report-post" data-id="${p.id}" aria-label="Reportar publicación" title="Reportar publicación">${ico("flag", 16)}${withLabel ? " Reportar" : ""}</button>`;
}

export function postCard(context: ScreenContext, p: Post) {
  const { comm, user, vote, canSee, postPoints, numberOfReplies } =
    context;
  const c = comm(p.communityId);
  if (!c) return "";
  if (p.deleted) {
    return `<article class="card post-card">
      <div class="post-topline">${cicon(c)}<button class="comm" data-action="open-community" data-id="${c.id}">${esc(c.name)}</button>${postDate(p)}</div>
      <button class="post-title deleted-content" data-action="open-post" data-id="${p.id}">Publicación eliminada</button>
      <div class="post-footer"><button class="footer-pill" data-action="open-post" data-id="${p.id}">${ico("message", 16)} ${numberOfReplies(p.id)} comentarios</button></div>
    </article>`;
  }
  const author = user(p.authorId),
    v = vote("post", p.id),
    locked = p.blindMode && !canSee(p);
  return `<article class="card post-card">
    <div class="post-topline">${cicon(c)}<button class="comm" data-action="open-community" data-id="${c.id}">${esc(c.name)}</button><span class="dot">·</span>${userProfileLink(author, { prefix: "por " })}<span class="dot">·</span>${postDate(p)}${postActions(context, p)}</div>
    <h3 class="post-title" data-action="open-post" data-id="${p.id}">${esc(p.title)}</h3>
    <p class="post-content">${esc(p.content)}</p>
    <div class="post-tags">${editedPostBadge(p)}${p.isQuestion ? `<span class="tag">${ico("message", 12)} Pregunta</span>` : ""}${locked ? `<span class="tag orange">${ico("lock", 12)} Opiná primero</span>` : ""}</div>
    ${locked ? `<div class="locked-banner"><span class="lock-square">${ico("lock", 17)}</span><div><b>Primero tu opinión, después las demás.</b><small>Respondé para desbloquear la conversación.</small></div><button class="btn btn-sm btn-primary" data-action="open-post" data-id="${p.id}">Responder</button></div>` : ""}
    <div class="post-footer"><button class="footer-pill ${v === 1 ? "on up" : ""}" data-action="vote-post" data-id="${p.id}" data-value="1" title="Votar a favor">${ico("arrowUp", 17)}</button><span style="font-size:12px;font-weight:850;color:var(--ink-secondary)">${count(postPoints(p))}</span><button class="footer-pill ${v === -1 ? "on down" : ""}" data-action="vote-post" data-id="${p.id}" data-value="-1" title="Votar en contra">${ico("arrowDown", 17)}</button>
    <button class="footer-pill" data-action="open-post" data-id="${p.id}">${ico("message", 16)} ${numberOfReplies(p.id)} comentarios</button><span class="foot-gap"></span>${savePostButton(context, p)}${reportPostButton(context, p)}</div>
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
