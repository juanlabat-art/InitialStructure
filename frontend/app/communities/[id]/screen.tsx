"use client";
import PuntoScreen from "../../punto-screen";
import { backToHome } from "../../shared/chrome";
import type { ScreenContext } from "../../shared/state";
import { noContent, sortPosts, filters, postCard } from "../../shared/posts";
import { photoEditor } from "../../shared/photos";
import { cicon, esc, ico, count } from "../../shared/presentation";

export function communityDetail(
  context: ScreenContext,
  renderTab?: (context: ScreenContext, id: string) => string,
) {
  const { comm, ui, membership, me, banned, db, memberCount, isMod } = context;
  const navigation = `<div class="community-nav">
    ${backToHome()}
    <button type="button" class="back" data-action="navigate" data-view="communities">${ico("back", 15)} Volver a explorar</button>
  </div>`;
  const c = comm(ui.communityId);
  if (!c)
    return navigation + noContent("Comunidad no encontrada", "No existe esta comunidad.");
  const joined = membership(me().id, c.id),
    blocked = banned(me().id, c.id),
    posts = sortPosts(
      context,
      db.posts.filter((p) => p.communityId === c.id),
    );
  return `${navigation}
  <div class="community-cover"></div>
  <div class="community-profile">
    <div class="community-profile-top">
      ${cicon(c, 67, "community-profile-icon")}
      <div class="community-profile-title">
        <h1>${esc(c.name)}</h1>
        <div class="community-profile-meta">
          <small>${count(memberCount(c.id))} miembros</small>
          ${joined ? `<span class="tag green">${ico("check", 14)} Miembro</span>` : ""}
        </div>
      </div>
      <button type="button" class="btn btn-sm ${joined ? "btn-outline" : "btn-primary"}" data-action="${joined ? "leave" : "join"}" data-id="${c.id}" ${blocked ? "disabled" : ""}>
        ${blocked ? "Acceso restringido" : joined ? "Abandonar comunidad" : `${ico("plus", 14)} Unirme`}
      </button>
    </div>
    <p class="community-profile-desc">${esc(c.description)}</p>
    <div class="community-tools"><span>${ico("calendar", 14)} Creada en ${new Date(c.createdAt).toLocaleDateString("es-AR", { month: "short", year: "numeric" })}</span>${isMod(c.id) ? '<span class="tag green">Sos moderador/a</span>' : ""}${me().id && c.creatorId === me().id ? `<button type="button" class="btn btn-sm btn-danger" data-action="delete-community" data-id="${c.id}">Eliminar comunidad</button>` : ""}${c.nsfw ? '<span class="tag orange">NSFW</span>' : ""}</div>
    ${isMod(c.id) ? `<details class="profile-editor">
      <summary class="btn btn-sm btn-outline">${ico("edit", 15)} Editar foto</summary>
      ${photoEditor("comunidades", c.id, Boolean(c.photoVersion))}
    </details>` : ""}
  </div>
  <div class="page-head"><div class="community-tabs">${[["posts", "Publicaciones"], ["top", "Top usuarios"], ...(isMod(c.id) ? [["mod", "Moderación"]] : [])].map(([key, label]) => `<button class="btn btn-sm ${ui.tab === key ? "btn-primary" : "btn-light"}" data-action="community-tab" data-value="${key}">${label}</button>`).join("")}</div></div>
  ${ui.tab === "posts" ? `<div class="page-head community-post-actions">
    ${filters(context)}
    ${joined && !blocked ? `<button type="button" class="btn btn-primary community-publish" data-action="compose">${ico("plus", 18)} Publicar acá</button>` : ""}
  </div>` : ""}
  ${renderTab ? renderTab(context, c.id) : `<div class="feed-list">${posts.length ? posts.map((item) => postCard(context, item)).join("") : noContent("Todavía no hay publicaciones", "Podés ser la primera persona en publicar.", "message")}</div>`}`;
}
export default function Screen({ id }: { id: string }) {
  return (
    <PuntoScreen view="community" renderScreen={communityDetail} id={id} />
  );
}
