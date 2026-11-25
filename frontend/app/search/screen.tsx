"use client";
import PuntoScreen from "../punto-screen";
import type { ScreenContext } from "../shared/state";
import { postCard, noContent } from "../shared/posts";
import { esc, cicon, ico } from "../shared/presentation";
import { matchUsers, userDirectoryHref, userList } from "../shared/people";

function searchView(context: ScreenContext) {
  const { ui, db, comm, user } = context;
  const q = ui.query.trim().toLocaleLowerCase("es-AR");
  const people = q ? matchUsers(db.users, q) : [];
  const ps = db.posts.filter(
    (p) =>
      !p.hidden &&
      [
        p.title,
        p.content,
        comm(p.communityId)?.name,
        user(p.authorId)?.username,
      ].some((x) => (x || "").toLocaleLowerCase("es-AR").includes(q)),
  );
  const cs = db.communities.filter((c) =>
    [c.name, c.description].some((x) => x.toLowerCase().includes(q)),
  );
  return `<div class="page-head"><div><h2>Resultados de búsqueda</h2><div class="page-subtitle">Resultados para “${esc(ui.query)}”.</div></div></div>
    ${people.length ? `<h3 class="section-mini">Usuarios</h3>${userList(people.slice(0, 5))}${people.length > 5 ? `<a class="btn btn-sm btn-outline user-directory-link" href="${esc(userDirectoryHref(ui.query))}">Ver todos los usuarios encontrados</a>` : ""}` : ""}
    ${cs.length ? `<h3 class="section-mini">Comunidades</h3><div class="card" style="padding:10px 17px;margin-bottom:22px">${cs.map((c) => `<button class="community-link" data-action="open-community" data-id="${c.id}">${cicon(c, 35)}<span>${esc(c.name)}</span><span class="foot-gap"></span>${ico("back", 14)}</button>`).join("")}</div>` : ""}
    <h3 class="section-mini">Publicaciones</h3><div class="feed-list">${ps.length ? ps.map((item) => postCard(context, item)).join("") : noContent("No encontramos publicaciones", "Probá con otro término de búsqueda.", "search")}</div>`;
}
export default function Screen({ query }: { query?: string }) {
  return <PuntoScreen view="search" renderScreen={searchView} query={query} />;
}
