"use client";
import PuntoScreen from "../../punto-screen";
import type { ScreenContext } from "../../shared/state";
import { noContent } from "../../shared/posts";
import { av, esc, dateLabel, ico, cicon } from "../../shared/presentation";

function commentsTree(
  context: ScreenContext,
  pid: string,
  parentId: string | null = null,
  depth = 0,
): string {
  const { db, commentPoints, user, vote, me, ui } = context;
  if (depth > 10) return "";
  const children = db.comments
    .filter((c) => c.postId === pid && c.parentId === parentId)
    .sort((a, b) => commentPoints(b) - commentPoints(a));
  return children
    .map((c) => {
      const author = user(c.authorId),
        v = vote("comment", c.id),
        mine = c.authorId === me().id;
      return `<div class="comment"><div class="comment-head">${av(author, "small")}<b>u/${esc(author?.username || "[eliminado]")}</b><span class="muted">· ${dateLabel(c.createdAt)}</span>${mine ? '<span class="tag green">Vos</span>' : ""}</div><div class="comment-body">${c.deleted ? "[eliminado]" : esc(c.text)}</div><div class="comment-actions"><button data-action="vote-comment" data-id="${c.id}" data-value="1" style="${v === 1 ? "color:var(--brand)" : ""}">${ico("arrowUp", 13)}</button><span style="font-size:11px;color:var(--ink-secondary);font-weight:800">${commentPoints(c)}</span><button data-action="vote-comment" data-id="${c.id}" data-value="-1" style="${v === -1 ? "color:var(--error)" : ""}">${ico("arrowDown", 13)}</button>${depth < 9 ? `<button data-action="reply-comment" data-id="${c.id}">${ico("message", 13)} Responder</button>` : ""}${mine && !c.deleted ? `<button data-action="delete-comment" data-id="${c.id}">${ico("trash", 13)} Eliminar</button>` : ""}</div>${ui.replyTo === c.id ? replyComposer(pid, c.id) : ""}${db.comments.some((x) => x.parentId === c.id) ? `<div class="comment-children">${commentsTree(context, pid, c.id, depth + 1)}</div>` : ""}</div>`;
    })
    .join("");
}

function replyComposer(pid: string, parentId: string | null = null) {
  return `<form class="reply-composer${parentId ? " is-reply" : ""}" data-form="comment"><input type="hidden" name="postId" value="${pid}"/><input type="hidden" name="parentId" value="${parentId || ""}"/><textarea name="text" maxlength="3000" required placeholder="${parentId ? "Escribí una respuesta..." : "¿Qué pensás sobre este post?"}"></textarea><div class="reply-actions">${parentId ? `<button class="btn btn-sm btn-outline" type="button" data-action="cancel-reply">Cancelar</button>` : ""}<button class="btn btn-sm btn-primary" type="submit">${ico("send", 14)} ${parentId ? "Responder" : "Comentar"}</button></div></form>`;
}

function postDetail(context: ScreenContext) {
  const {
    post,
    ui,
    comm,
    user,
    canSee,
    me,
    numberOfReplies,
    isMod,
    vote,
    postPoints,
    db,
    banned,
    membership,
  } = context;
  const p = post(ui.postId);
  if (!p)
    return noContent("Post no encontrado", "Es posible que se haya eliminado.");
  const c = comm(p.communityId);
  if (!c)
    return noContent("Comunidad no encontrada", "No existe esta comunidad.");
  const author = user(p.authorId),
    locked = !canSee(p),
    own = p.authorId === me().id;
  const num = numberOfReplies(p.id);
  return `<button class="back" data-action="open-community" data-id="${c.id}">${ico("back", 15)} Volver a ${esc(c.name)}</button>
  ${me().id && own ? `<div class="page-head"><button type="button" class="btn btn-sm btn-danger" data-action="delete-post" data-id="${p.id}">Eliminar publicación</button></div>` : ""}
  ${
    p.hidden && !isMod(c.id)
      ? noContent(
          "Publicación oculta",
          "Este post fue ocultado por moderación.",
          "eyeOff",
        )
      : `<article class="card detail-card"><div class="post-topline">${cicon(c)}<button class="comm" data-action="open-community" data-id="${c.id}">${esc(c.name)}</button><span class="dot">·</span><span class="post-date">u/${esc(author?.username)}</span><span class="dot">·</span><span class="post-date">${dateLabel(p.createdAt)}</span></div><h1>${esc(p.title)}</h1><p class="post-content">${esc(p.content)}</p><div class="post-tags">${p.isQuestion ? `<span class="tag">${ico("message", 12)} Pregunta</span>` : ""}${p.blindMode ? `<span class="tag orange">${ico("lock", 12)} Opiná primero</span>` : ""}${p.hidden ? '<span class="tag orange">Oculto por moderación</span>' : ""}</div>${p.blindMode ? `<div class="question-mode">${ico(locked ? "lock" : "unlock", 17)} ${locked ? "Primero respondé. Después vas a poder leer las respuestas de los demás." : "Opiniones desbloqueadas. Ya podés leer la conversación."}</div>` : ""}<div class="detail-toolbar"><button class="footer-pill ${vote("post", p.id) === 1 ? "on" : ""}" data-action="vote-post" data-id="${p.id}" data-value="1">${ico("arrowUp", 16)} ${postPoints(p)}</button><button class="footer-pill" data-action="vote-post" data-id="${p.id}" data-value="-1">${ico("arrowDown", 16)}</button><button class="footer-pill" data-action="save-post" data-id="${p.id}">${ico("bookmark", 16)} ${db.saved.some((s) => s.userId === me().id && s.postId === p.id) ? "Guardado" : "Guardar"}</button><button class="footer-pill" data-action="report-post" data-id="${p.id}">${ico("flag", 15)} Reportar</button>${isMod(c.id) ? `<button class="footer-pill" data-action="toggle-hide" data-id="${p.id}">${ico(p.hidden ? "eye" : "eyeOff", 16)} ${p.hidden ? "Mostrar" : "Ocultar"}</button>` : ""}</div></article>
  <div class="discussion-head"><h3>${num} comentarios</h3>${ico("message", 17)}</div>
  ${!own && banned(me().id, c.id) ? '<div class="notice">Estás baneado de esta comunidad y no podés comentar.</div>' : membership(me().id, c.id) ? replyComposer(p.id) : '<div class="notice">Tenés que unirte a la comunidad para publicar comentarios.</div>'}
  ${locked ? `<div class="answer-lock"><div class="biglock">${ico("lock", 28)}</div><h3>No leas lo que piensan todavía</h3><p>Para que ninguna respuesta influya en la tuya, esta discusión está bloqueada hasta que dejes tu comentario.</p><div class="fake-answer"></div><div class="fake-answer short"></div></div>` : num ? `<div class="card comment-tree">${commentsTree(context, p.id)}</div>` : noContent("Todavía no hay comentarios", "¡Sé la primera persona en participar!", "message")}`
  }`;
}
export default function Screen({ id }: { id: string }) {
  return <PuntoScreen view="postDetail" renderScreen={postDetail} id={id} />;
}
