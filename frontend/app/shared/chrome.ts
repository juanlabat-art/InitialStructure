import type { ScreenContext } from "./state";
import { ico, esc, av, cicon, count } from "./presentation";

function navItem(
  context: ScreenContext,
  view: string,
  label: string,
  iconName: string,
  extra = "",
) {
  const { ui } = context;
  const active =
    ui.view === view ||
    (view === "communities" &&
      ["community", "communityRanking", "communityModeration", "ban"].includes(
        ui.view,
      ));
  return `<button class="nav-item ${active ? "active" : ""}" data-action="navigate" data-view="${view}"${active ? ' aria-current="page"' : ""}>${ico(iconName, 19)}<span>${label}</span>${extra}</button>`;
}

export function header(context: ScreenContext) {
  const { me, ui, totalKarma, db } = context;
  const u = me();
  return `<header class="topbar">
    <button class="logo" data-action="navigate" data-view="home"><span class="logo-symbol">${ico("sparkles", 22)}</span>punto<b>.</b></button>
    <div class="search-wrap">${ico("search", 19)}<input id="search" class="search-input" value="${esc(ui.query)}" aria-label="Buscar comunidades y posts" placeholder="Buscar posts y comunidades..." /><span class="search-shortcut">Enter ↵</span></div>
    <div class="top-actions">
    <button class="btn btn-primary create-top" aria-label="Crear publicación" data-action="compose">${ico("plus", 17)}<span>Crear post</span></button>
    <button class="icon-btn" title="Notificaciones" data-action="notifications">${ico("bell", 20)}<span class="notif-dot"></span></button>
    <button class="top-avatar" aria-label="Menú de cuenta" aria-expanded="${ui.profileMenu}" data-action="profile-menu">${av(u)}<span class="username" style="font-size:12px;font-weight:800">${esc(u.username)}</span>${ico("chevron", 13)}</button>
    </div>${
      ui.profileMenu
        ? `<div class="profile-menu"><div class="menu-user"><strong>@${esc(u.username)}</strong><span>${totalKarma(u.id)} karma · Cuenta de demostración</span></div>
     <button class="menu-item" data-action="navigate" data-view="profile">${ico("user", 16)} Mi perfil</button>
     <button class="menu-item" data-action="open-register">${ico("plus", 16)} Crear otra cuenta</button>
     <div style="height:1px;background:#eff0f5;margin:6px 5px"></div>
     ${db.users
       .slice(0, 5)
       .map(
         (other) =>
           `<button class="menu-item" data-action="switch-user" data-id="${other.id}">${av(other, "small")} Entrar como @${esc(other.username)} ${other.id === u.id ? "✓" : ""}</button>`,
       )
       .join("")}
     <button class="menu-item" data-action="reset-demo">${ico("settings", 16)} Reiniciar sesión local</button>
    </div>`
        : ""
    }</header>`;
}

export function sidebar(context: ScreenContext) {
  const { db, me, comm, ui } = context;
  const joined = db.memberships
    .filter((m) => m.userId === me().id)
    .map((m) => comm(m.communityId))
    .filter((c) => c !== undefined);
  return `<aside class="leftbar">
    <div class="nav-heading first">Menú</div>
    <nav class="primary-nav" aria-label="Navegación principal">
    ${navItem(context, "home", "Inicio", "home")}${navItem(context, "communities", "Explorar", "compass")}${navItem(context, "anonymous", "Anónimo", "mask", '<span class="nav-count">NEW</span>')}${navItem(context, "saved", "Guardados", "bookmark")}${navItem(context, "profile", "Mi perfil", "user")}
    </nav>
    <div class="side-rule"></div><div class="nav-heading">Mis comunidades</div>
    ${joined.map((c) => `<button class="community-link ${ui.view === "community" && ui.communityId === c.id ? "active" : ""}" data-action="open-community" data-id="${c.id}">${cicon(c)}<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">r/${esc(c.name)}</span></button>`).join("")}
    ${joined.length ? "" : '<p style="font-size:12px;color:#9fa1b2;padding:0 15px">Todavía no te uniste a comunidades.</p>'}
    <button class="sidebar-create" data-action="create-community">${ico("plus", 15)} Crear comunidad</button>
    <div class="left-footer"><b>punto. © ${new Date().getFullYear()}</b><br/>Ideas sin eco. Conversaciones con sentido.<br/>Proyecto escolar · Frontend demo</div>
  </aside>`;
}

export function rightbar(context: ScreenContext) {
  const { me, db, memberCount, totalKarma } = context;
  const u = me(),
    memberships = db.memberships.filter((m) => m.userId === u.id);
  return `<aside class="rightbar">
    <div class="card rightcard"><div class="right-head"><h3>✦ &nbsp;Comunidades en tendencia</h3><button data-action="navigate" data-view="communities">Ver todas</button></div>
    ${[...db.communities]
      .sort((a, b) => memberCount(b.id) - memberCount(a.id))
      .slice(0, 4)
      .map(
        (c) =>
          `<div class="trend-item">${cicon(c, 39)}<div><div class="trend-name">r/${esc(c.name)}</div><div class="trend-subs">${count(memberCount(c.id))} miembros</div></div><button class="trend-plus" data-action="open-community" data-id="${c.id}" aria-label="Abrir comunidad">${ico("plus", 19)}</button></div>`,
      )
      .join("")}
    </div><div class="card right-promo"><div class="promo-icon">${ico("mask", 22)}</div><h3>Sin nombres.<br/>Con respuestas.</h3><p>Hacé esa pregunta que nunca te animaste a hacer. Acá tu identidad no aparece.</p><button data-action="navigate" data-view="anonymous">Entrar al espacio anónimo ${ico("back", 13).replace("M12 19-7-7 7-7M5 12h14", "M12 5l7 7-7 7M19 12H5")}</button></div>
    <div class="card rightcard"><div class="right-head" style="margin-bottom:15px"><h3>Tu impacto</h3>${ico("award", 19)}</div><div class="right-userbox">${av(u)}<div><b>@${esc(u.username)}</b><small>Seguí compartiendo ideas</small></div></div><div class="stats-grid"><div><div class="stat-number">${totalKarma(u.id)}</div><div class="stat-label">Karma total</div></div><div><div class="stat-number">${memberships.length}</div><div class="stat-label">Comunidades</div></div></div></div>
  </aside>`;
}
