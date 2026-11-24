"use client";
import PuntoScreen from "../../punto-screen";
import type { ScreenContext } from "../../shared/state";
import { noContent, sortPosts, filters, postCard } from "../../shared/posts";
import { esc, ico, count } from "../../shared/presentation";

export function communityDetail(
  context: ScreenContext,
  renderTab?: (context: ScreenContext, id: string) => string,
) {
  const { comm, ui, membership, me, banned, db, memberCount, isMod } = context;
  const c = comm(ui.communityId);
  if (!c)
    return noContent("Comunidad no encontrada", "No existe esta comunidad.");
  const joined = membership(me().id, c.id),
    blocked = banned(me().id, c.id),
    posts = sortPosts(
      context,
      db.posts.filter((p) => p.communityId === c.id),
    );
  return `<button class="back" data-action="navigate" data-view="communities">${ico("back", 15)} Volver a explorar</button><div class="community-cover"></div><div class="community-profile"><div class="community-profile-top"><span class="community-profile-icon" style="background:${esc(c.bg)}">${c.emoji}</span><div class="community-profile-title"><h1>${esc(c.name)}</h1><small>${count(memberCount(c.id))} miembros · Comunidad</small></div><button class="btn ${joined ? "btn-light" : "btn-primary"} btn-sm" data-action="${joined ? "leave" : "join"}" data-id="${c.id}" ${blocked ? 'disabled title="Baneado"' : ""}>${blocked ? "Acceso restringido" : joined ? `${ico("check", 14)} Miembro` : `${ico("plus", 14)} Unirme`}</button></div><p class="community-profile-desc">${esc(c.description)}</p><div class="community-tools"><span>${ico("calendar", 14)} Creada ${new Date(c.createdAt).toLocaleDateString("es-AR", { month: "short", year: "numeric" })}</span>${isMod(c.id) ? '<span class="tag green">Sos moderador/a</span>' : ""}${me().id && c.creatorId === me().id ? `<button type="button" class="btn btn-sm btn-danger" data-action="delete-community" data-id="${c.id}">Eliminar comunidad</button>` : ""}${c.nsfw ? '<span class="tag orange">NSFW</span>' : ""}${joined ? `<button class="btn btn-sm btn-outline" data-action="compose" style="margin-left:auto">${ico("plus", 13)} Publicar acá</button>` : ""}</div></div>
  <div class="page-head"><div style="display:flex;gap:8px;flex-wrap:wrap">${[["posts", "Publicaciones"], ["top", "Top usuarios"], ...(isMod(c.id) ? [["mod", "Moderación"]] : [])].map(([key, label]) => `<button class="btn btn-sm ${ui.tab === key ? "btn-primary" : "btn-light"}" data-action="community-tab" data-value="${key}">${label}</button>`).join("")}</div>${ui.tab === "posts" ? filters(context) : ""}</div>
  ${renderTab ? renderTab(context, c.id) : `<div class="feed-list">${posts.length ? posts.map((item) => postCard(context, item)).join("") : noContent("Todavía no hay publicaciones", "Podés ser la primera persona en publicar.", "message")}</div>`}`;
}
export default function Screen({ id }: { id: string }) {
  return (
    <PuntoScreen view="community" renderScreen={communityDetail} id={id} />
  );
}
