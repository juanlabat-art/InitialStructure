import type { ScreenContext } from "./state";
import { ico, esc, av, cicon, count, relativeTime, karmaProgress, siteRoleLabels } from "./presentation";
import { sessionTimer } from "./session-timer";

export const MAX_PINNED_COMMUNITIES = 3;

function isCommunityView(view: ScreenContext["ui"]["view"]) {
  return ["community", "communityRanking", "communityModeration", "ban"].includes(view);
}

function navItem(
  context: ScreenContext,
  view: string,
  label: string,
  iconName: string,
) {
  const { ui } = context;
  const active =
    ui.view === view ||
    (view === "communities" && isCommunityView(ui.view)) ||
    (view === "users" && ui.view === "userProfile");
  return `<button class="nav-item ${active ? "active" : ""}" data-action="navigate" data-view="${view}" aria-label="${label}" title="${label}"${active ? ' aria-current="page"' : ""}>${ico(iconName, 19)}<span>${label}</span></button>`;
}

function brandButton() {
  return '<button class="logo" data-action="navigate" data-view="home" aria-label="VoZero"><img class="logo-symbol" src="/vozero-logo.jpg" alt="" width="38" height="38" /><span class="logo-text">VoZero</span></button>';
}

export function isPinned(context: ScreenContext, communityId: string) {
  const userId = context.me().id;
  return context.db.memberships.some((m) => m.userId === userId && m.communityId === communityId && m.pinned);
}

/** Botón con texto para fijar o desfijar una comunidad (solo para miembros). */
export function pinButton(context: ScreenContext, communityId: string, name: string) {
  const pinned = isPinned(context, communityId);
  return `<button type="button" class="btn btn-sm ${pinned ? "btn-light" : "btn-outline"} pin-toggle" data-action="toggle-pin" data-id="${communityId}" aria-pressed="${pinned}" aria-label="${pinned ? "Desfijar" : "Fijar"} ${esc(name)}">${ico("pin", 14)} ${pinned ? "Fijada" : "Fijar"}</button>`;
}

export function backToHome() {
  return `<button type="button" class="back" data-action="navigate" data-view="home">${ico("home", 15)} Volver al inicio</button>`;
}

export function profileActions(context: ScreenContext) {
  return `<a class="menu-item" href="/myprofile/edit">${ico("edit", 16)} Editar perfil</a>
    ${context.siteRole === "admin" ? "" : `<button type="button" class="menu-item menu-item-danger" data-action="delete-account">${ico("trash", 16)} Eliminar cuenta</button>`}`;
}

export function hasUnreadNotifications(context: ScreenContext) {
  return Boolean(context.me().id) && context.notifications.some((notification) => !notification.read);
}

export function notificationsContent(context: ScreenContext) {
  if (!context.me().id) {
    return '<button class="menu-item" data-action="open-login">Iniciá sesión para ver tus notificaciones</button>';
  }
  if (!context.notifications.length) {
    return '<p class="notifications-empty">No tenés notificaciones.</p>';
  }
  return `<ul class="notifications-list">${context.notifications.map((notification) => notification.commentId === null
    ? `<li><a class="menu-item notification-item" href="${esc("/admin?" + new URLSearchParams({ seccion: "posts", q: notification.title.slice(0, 100) }))}">
      <span>La publicación <strong>${esc(notification.title)}</strong> llegó a 5 reportes.</span>
      <small>${relativeTime(notification.createdAt)}</small>
    </a></li>`
    : `
    <li><button class="menu-item notification-item" data-action="open-post" data-id="${notification.postId}">
      <span><strong>@${esc(notification.author)}</strong> ${notification.isReply ? "respondió a tu comentario en" : "comentó tu publicación"} <strong>${esc(notification.title)}</strong>.</span>
      <small>${relativeTime(notification.createdAt)}</small>
    </button></li>`).join("")}</ul>`;
}

export function header(context: ScreenContext) {
  const { me, ui, totalKarma } = context;
  const u = me();
  return `<header class="topbar">
    <div class="topbar-start">
      <button type="button" class="icon-btn sidebar-toggle" data-action="toggle-sidebar" aria-controls="site-sidebar" aria-label="Abrir menú lateral">${ico("menu", 22)}</button>
      ${brandButton()}
    </div>
    <div class="search-wrap">${ico("search", 19)}<input id="search" class="search-input" value="${esc(ui.view === "users" ? "" : ui.query)}" aria-label="Buscar publicaciones, comunidades y usuarios" placeholder="Buscar en VoZero..." /><span class="search-shortcut">Enter ↵</span></div>
    <div class="top-actions">
    ${ui.view === "home" || isCommunityView(ui.view) ? "" : `<button class="btn btn-primary create-top" aria-label="Crear publicación" data-action="compose">${ico("plus", 17)}<span>Crear post</span></button>`}
    <button class="icon-btn" aria-label="${hasUnreadNotifications(context) ? "Notificaciones nuevas" : "Notificaciones"}" title="Notificaciones" aria-expanded="${ui.openMenu === "notifications"}" aria-controls="notifications-menu" data-menu-trigger="notifications" data-action="notifications">${ico("bell", 20)}<span class="notif-dot" aria-hidden="true"${hasUnreadNotifications(context) ? "" : " hidden"}></span></button>
    ${sessionTimer(u.id)}
    <button class="top-avatar" aria-label="Menú de cuenta" aria-expanded="${ui.openMenu === "profile"}" aria-controls="profile-menu" data-menu-trigger="profile" data-action="profile-menu">
      ${av(u)}<span class="username" style="font-size:12px;font-weight:800">${esc(u.username)}</span>
      ${ico("dots", 18)}
    </button>
    </div>
    <div class="profile-menu" id="profile-menu" data-header-menu="profile"${ui.openMenu === "profile" ? "" : " hidden"}>
      <div class="menu-user"><strong>@${esc(u.username)}</strong><span>${siteRoleLabels[context.siteRole ?? "usuario"]} · ${totalKarma(u.id)} karma</span></div>
           <a class="menu-item" href="/myprofile/edit">${ico("edit", 16)} Editar perfil</a>
           ${context.siteRole === "admin" || context.siteRole === "subadmin" ? `<button class="menu-item" data-action="navigate" data-view="admin">${ico("shield", 16)} Administración</button>` : ""}
           <button class="menu-item" data-action="logout">Cerrar sesión</button>
    </div>
    <section class="profile-menu notifications-menu" id="notifications-menu" aria-labelledby="notifications-title" data-header-menu="notifications"${ui.openMenu === "notifications" ? "" : " hidden"}>
      <h2 id="notifications-title">Notificaciones</h2>
      <div data-notification-list>${notificationsContent(context)}</div>
    </section>
    </header>`;
}

export function sidebar(context: ScreenContext) {
  const { db, me, comm, ui } = context;
  const mine = db.memberships.filter((m) => m.userId === me().id);
  const pinnedIds = new Set(mine.filter((m) => m.pinned).map((m) => m.communityId));
  const joined = mine
    .map((m) => comm(m.communityId))
    .filter((c) => c !== undefined);
  const pinned = joined.filter((c) => pinnedIds.has(c.id));
  const others = joined.filter((c) => !pinnedIds.has(c.id));
  const row = (c: (typeof joined)[number]) => {
    const isPinned = pinnedIds.has(c.id);
    const label = `${isPinned ? "Desfijar" : "Fijar"} ${esc(c.name)}`;
    return `<div class="community-row${isPinned ? " is-pinned" : ""}">
      <button class="community-link ${ui.view === "community" && ui.communityId === c.id ? "active" : ""}" data-action="open-community" data-id="${c.id}">${cicon(c)}<span>${esc(c.name)}</span></button>
      <button type="button" class="pin-btn" data-action="toggle-pin" data-id="${c.id}" aria-pressed="${isPinned}" aria-label="${label}" title="${isPinned ? "Desfijar" : "Fijar"}">${ico("pin", 15)}</button>
    </div>`;
  };
  return `<aside class="leftbar" id="site-sidebar" aria-label="Menú lateral">
    <div class="sidebar-brand">
      <button type="button" class="icon-btn sidebar-collapse" data-action="collapse-sidebar" aria-controls="site-sidebar" aria-expanded="true" aria-label="Contraer menú lateral" title="Contraer menú lateral">${ico("menu", 20)}</button>
      ${brandButton()}
      <button type="button" class="icon-btn sidebar-close" data-action="close-sidebar" aria-label="Cerrar menú lateral">${ico("x", 20)}</button>
    </div>
    <div class="sidebar-content">
      <nav class="primary-nav" aria-label="Navegación principal">
        ${navItem(context, "home", "Inicio", "home")}${navItem(context, "communities", "Explorar", "compass")}${navItem(context, "users", "Usuarios", "users")}${navItem(context, "anonymous", "Anónimo", "mask")}${navItem(context, "saved", "Guardados", "bookmark")}${navItem(context, "profile", "Mi perfil", "user")}
      </nav>
      <div class="sidebar-communities">
        <div class="side-rule"></div>
        ${pinned.length ? `<div class="nav-heading">${ico("pin", 11)} Fijadas · ${pinned.length}/${MAX_PINNED_COMMUNITIES}</div>${pinned.map(row).join("")}` : ""}
        ${others.length || !pinned.length ? '<div class="nav-heading">Mis comunidades</div>' : ""}
        ${others.map(row).join("")}
        ${joined.length ? "" : '<p style="font-size:12px;color:var(--muted);padding:0 15px">Todavía no te uniste a comunidades.</p>'}
        <button class="sidebar-create" data-action="create-community">${ico("plus", 15)} Crear comunidad</button>
      </div>
      <div class="left-footer"><b>VoZero © ${new Date().getFullYear()}</b></div>
    </div>
  </aside>`;
}

export function rightbar(context: ScreenContext) {
  const { me, db, ui, memberCount, membership, totalKarma, votesToNextKarma } = context;
  const u = me(),
    memberships = db.memberships.filter((m) => m.userId === u.id);
  const currentCommunityId = isCommunityView(ui.view) ? ui.communityId : undefined;
  const trending = [...db.communities]
    .sort((a, b) => memberCount(b.id) - memberCount(a.id))
    .slice(0, 3);

  return `<aside class="rightbar">
    <div class="card rightcard"><div class="right-head"><h3>Comunidades en tendencia</h3><button data-action="navigate" data-view="communities">Ver todas</button></div>
    ${trending
      .map(
        (c) => {
          const name = esc(c.name);
          const current = c.id === currentCommunityId ? ' aria-current="location"' : "";
          const action = membership(u.id, c.id)
            ? `<span class="trend-plus trend-member" role="img" aria-label="Ya sos miembro de ${name}">${ico("check", 19)}</span>`
            : `<button class="trend-plus" data-action="join" data-id="${c.id}" aria-label="Unirme a ${name}">${ico("plus", 19)}</button>`;
          return `<div class="trend-item" data-action="open-community" data-id="${c.id}">
            <button type="button" class="trend-link" data-action="open-community" data-id="${c.id}" aria-label="Abrir comunidad ${name}"${current}>
              ${cicon(c, 39)}
              <span class="trend-details">
                <span class="trend-name">${name}</span>
                <span class="trend-subs">${count(memberCount(c.id))} miembros</span>
              </span>
            </button>
            ${action}
          </div>`;
        },
      )
      .join("")}
    </div>
    ${u.id ? `<div class="card rightcard">
      <div class="right-head" style="margin-bottom:15px"><h3>Tu impacto</h3>${ico("award", 19)}</div>
      <div class="right-userbox">${av(u)}<div><b>@${esc(u.username)}</b><small>Seguí compartiendo ideas</small></div></div>
      <div class="stats-grid"><div><div class="stat-number">${totalKarma(u.id)}</div><div class="stat-label">Karma total</div></div><div><div class="stat-number">${memberships.length}</div><div class="stat-label">Comunidades</div></div></div>
      ${karmaProgress(votesToNextKarma)}
    </div>` : ""}
  </aside>`;
}
