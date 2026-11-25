"use client";
import PuntoScreen from "../../../punto-screen";
import { communityDetail } from "../screen";
import type { ScreenContext } from "../../../shared/state";
import { av, esc } from "../../../shared/presentation";
import { noContent } from "../../../shared/posts";

function moderation(context: ScreenContext, cid: string) {
  const { isMod, db, user } = context;
  if (!isMod(cid))
    return noContent(
      "Acceso restringido",
      "Solo los moderadores pueden administrar esta comunidad.",
      "shield",
    );
  const ps = db.posts.filter(
    (p) =>
      p.communityId === cid && !p.deleted &&
      (p.hidden || db.reports.some((r) => r.postId === p.id)),
  );
  const members = db.memberships.filter((m) => m.communityId === cid);
  return `<h3>Reportes de publicaciones</h3><div class="card" style="padding:13px 18px;margin-bottom:19px">${ps.length ? `<table class="moderation-table"><thead><tr><th>Publicación</th><th>Reportes</th><th>Acción</th></tr></thead><tbody>${ps.map((p) => `<tr><td><button data-action="open-post" data-id="${p.id}" style="text-align:left;font-weight:750">${esc(p.title.slice(0, 58))}</button></td><td class="report-count">${db.reports.filter((r) => r.postId === p.id).length}</td><td><button class="btn btn-sm ${p.hidden ? "btn-light" : "btn-danger"}" data-action="toggle-hide" data-id="${p.id}">${p.hidden ? "Mostrar" : "Ocultar"}</button></td></tr>`).join("")}</tbody></table>` : '<p class="muted" style="padding:8px">No hay reportes pendientes.</p>'}</div>
    <h3>Administrar miembros</h3><div class="card" style="padding:10px 20px">${members
      .map((m) => {
        const u = user(m.userId);
        if (!u) return "";
        return `<div class="rank-item">${av(u, "small")}<div><span class="rank-user">u/${esc(u.username)}</span><div class="post-date">${m.role}</div></div><span class="foot-gap"></span>${m.role !== "moderador" ? `<button class="btn btn-sm btn-outline" data-action="promote" data-id="${u.id}" data-community="${cid}">Hacer mod</button><button class="btn btn-sm btn-danger" data-action="ban-modal" data-id="${u.id}">Banear</button>` : '<span class="tag green">Moderador</span>'}</div>`;
      })
      .join("")}</div>`;
}

function renderScreen(context: ScreenContext) {
  return communityDetail(context, moderation);
}

export default function Screen({ id }: { id: string }) {
  return (
    <PuntoScreen
      view="communityModeration"
      id={id}
      renderScreen={renderScreen}
    />
  );
}
