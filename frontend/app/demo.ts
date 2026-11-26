import type { AdminSelection, HeaderMenu, Post, ViewState } from "./demo-types";
import { hasUnreadNotifications, header, notificationsContent, sidebar, rightbar } from "./shared/chrome";
import { dateLabel, esc } from "./shared/presentation";
import { ApiError, forumApi } from "./shared/api";
import { isAnonymousCategory } from "./shared/anonymous-categories";
import { reportReasons } from "./shared/reports";
import { maxPhotoBytes, mountPhotoPreview } from "./shared/photos";
import { clearBrowserSession, createScreenContext, rememberUnlockedConversation, showWelcomeForNewAccount, type ScreenRenderer } from "./shared/state";

const SIDEBAR_STORAGE = "vozero_sidebar_collapsed";
const SIDEBAR_WIDTH_STORAGE = "vozero_sidebar_width";
const COLLAPSED_SIDEBAR_WIDTH = 68;
const MIN_SIDEBAR_WIDTH = 184;
const MAX_SIDEBAR_WIDTH = 250;
const SIDEBAR_SNAP_WIDTH = (COLLAPSED_SIDEBAR_WIDTH + MIN_SIDEBAR_WIDTH) / 2;

interface SidebarResize {
  pointerId: number;
  handle: HTMLElement;
  startX: number;
  startWidth: number;
  width: number;
}

function viewHref(view: ViewState["view"], state: ViewState): string {
  switch (view) {
    case "home":
      return "/";
    case "communities":
      return "/communities";
    case "community":
      return "/communities/" + encodeURIComponent(state.communityId);
    case "postDetail":
      return (
        "/post/" +
        encodeURIComponent((state.postId ?? "").replace(/^p(\d+)$/, "$1"))
      );
    case "anonymous":
      return "/anonymous";
    case "anonDetail":
      return "/anonymous/" + encodeURIComponent(state.anonId ?? "");
    case "profile":
      return "/myprofile";
    case "users":
      return "/users";
    case "userProfile":
      return "/users/" + encodeURIComponent(state.profileUsername);
    case "admin":
      return "/admin";
    case "saved":
      return "/saved";
    case "search":
      return "/search?" + new URLSearchParams({ q: state.query });
    case "newPost":
      return (
        "/post/new?" + new URLSearchParams({ community: state.communityId })
      );
    case "editPost":
      return viewHref("postDetail", state) + "/edit";
    case "newAnonymous":
      return "/anonymous/new";
    case "newCommunity":
      return "/communities/new";
    case "login":
      return "/login";
    case "register":
      return "/register";
    case "report":
      return (
        viewHref("postDetail", { ...state, postId: state.reportId }) + "/report"
      );
    case "ban":
      return (
        viewHref("communityModeration", state) +
        "/ban/" +
        encodeURIComponent(state.banUserId ?? "")
      );
    case "communityRanking":
      return viewHref("community", state) + "/ranking";
    case "communityModeration":
      return viewHref("community", state) + "/moderation";
  }
}

export function mountPunto(
  app: HTMLElement,
  toastRoot: HTMLElement,
  view: ViewState["view"],
  routeId: string | undefined,
  query: string | undefined,
  targetId: string | undefined,
  navigate: (href: string, replace?: boolean) => void,
  renderScreen: ScreenRenderer,
  adminSelection?: AdminSelection,
) {
  const listeners = new AbortController();
  let disposePhotoPreview: (() => void) | undefined;
  const accountPage = view === "login" || view === "register";
  const mobileViewport = window.matchMedia("(max-width: 870px)");
  let desktopSidebarCollapsed = false;
  let desktopSidebarWidth: number | null = null;
  let mobileSidebarOpen = false;
  let sidebarResize: SidebarResize | null = null;
  try {
    desktopSidebarCollapsed = localStorage.getItem(SIDEBAR_STORAGE) === "true";
    const width = Number(localStorage.getItem(SIDEBAR_WIDTH_STORAGE));
    if (Number.isFinite(width) && width >= MIN_SIDEBAR_WIDTH) {
      desktopSidebarWidth = Math.min(width, MAX_SIDEBAR_WIDTH);
    }
  } catch {
    // The menu can still be toggled when storage is unavailable.
  }
  const context = createScreenContext(view, routeId, query, targetId, adminSelection);
  const {
    ui,
    me,
    comm,
    post,
    membership,
    isMod,
    banned,
    totalKarma,
    connect,
  } = context;
  let notificationRequest = 0;
  let actionDialog: HTMLDialogElement | null = null;
  const postRequests = new WeakMap<HTMLFormElement, { content: string; id: string }>();
  function ask(title: string, content: string, action: string, danger = false) {
    return new Promise<FormData | null>((resolve) => {
      const dialog = document.createElement("dialog");
      dialog.className = "card action-dialog";
      dialog.setAttribute("aria-labelledby", "action-dialog-title");
      dialog.innerHTML = `<form method="dialog">
        <h2 id="action-dialog-title">${esc(title)}</h2>
        ${content}
        <div class="modal-footer">
          <button class="btn btn-outline" value="cancel" formnovalidate autofocus>Cancelar</button>
          <button class="btn ${danger ? "btn-danger" : "btn-primary"}" value="confirm">${esc(action)}</button>
        </div>
      </form>`;
      actionDialog = dialog;
      app.append(dialog);
      dialog.addEventListener("close", () => {
        const answer = dialog.returnValue === "confirm" ? new FormData(dialog.querySelector("form")!) : null;
        dialog.remove();
        actionDialog = null;
        resolve(answer);
      }, { once: true });
      dialog.showModal();
    });
  }
  async function confirmDeletion(message: string) {
    if (!await ask("Eliminar contenido", `<p>${esc(message)}</p>`, "Continuar")) return false;
    return Boolean(await ask("Confirmar eliminación", "<p>Esta acción es irreversible.</p>", "Eliminar", true));
  }
  function toast(msg: string, error = false) {
    const root = toastRoot;
    root.innerHTML = `<div class="toast ${error ? "error" : ""}">${esc(msg)}</div>`;
    const message = root.firstElementChild;
    setTimeout(() => message?.remove(), 3300);
  }
  function redirectToLogin() {
    disposePhotoPreview?.();
    app.replaceChildren();
    navigate("/login", true);
  }
  function setView(view: ViewState["view"], extra: Partial<ViewState> = {}) {
    if (mobileSidebarOpen) setMobileSidebar(false);
    const href = viewHref(view, { ...ui, ...extra });
    if (href !== window.location.pathname + window.location.search) {
      setHeaderMenu(null);
      navigate(href);
      return;
    }
    Object.assign(ui, {
      view,
      openMenu: null,
      replyTo: null,
      editingCommentId: null,
      ...extra,
    });
    window.scrollTo({ top: 0, behavior: "instant" });
    render();
  }
  function render() {
    const active = document.activeElement;
    const content = renderScreen(context);
    disposePhotoPreview?.();
    sidebarResize = null;
    app.innerHTML = accountPage
      ? `<main class="account-screen">${content}</main>`
      : `<div class="app-shell">
          ${sidebar(context)}
          <div class="app-workspace">${header(context)}<div class="layout"><main class="main">${content}</main>${rightbar(context)}</div></div>
          <div class="sidebar-backdrop" data-action="close-sidebar" aria-hidden="true"></div>
        </div>`;
    const photoForm = app.querySelector<HTMLFormElement>('.photo-editor[data-target="usuarios"]');
    disposePhotoPreview = photoForm ? mountPhotoPreview(photoForm) : undefined;
    if (!accountPage) updateSidebar();
    if (app.querySelector(".route-form")) {
      app
        .querySelector<HTMLElement>(
          '.modal input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]),.modal textarea',
        )
        ?.focus();
    } else if (active?.id === "search") {
      app.querySelector<HTMLInputElement>("#search")?.focus();
      app
        .querySelector<HTMLInputElement>("#search")
        ?.setSelectionRange?.(ui.query.length, ui.query.length);
    }
  }
  function updateSidebar() {
    const shell = app.querySelector<HTMLElement>(".app-shell");
    if (!shell) return;
    const collapsed = sidebarResize ? sidebarResize.width < MIN_SIDEBAR_WIDTH : desktopSidebarCollapsed;
    shell.toggleAttribute("data-sidebar-collapsed", collapsed);
    shell.toggleAttribute("data-sidebar-open", mobileSidebarOpen);
    shell.toggleAttribute("data-sidebar-resizing", Boolean(sidebarResize));
    shell.style.setProperty("--sidebar-width", desktopSidebarWidth === null ? "" : `${desktopSidebarWidth}px`);
    shell.style.setProperty("--sidebar-drag-width", sidebarResize ? `${sidebarResize.width}px` : "");
    const workspace = shell.querySelector<HTMLElement>(".app-workspace");
    if (workspace) workspace.inert = mobileSidebarOpen;
    const sidebar = shell.querySelector<HTMLElement>("#site-sidebar");
    if (mobileSidebarOpen) {
      sidebar?.setAttribute("role", "dialog");
      sidebar?.setAttribute("aria-modal", "true");
    } else {
      sidebar?.removeAttribute("role");
      sidebar?.removeAttribute("aria-modal");
    }

    const trigger = shell.querySelector(".sidebar-toggle");
    trigger?.setAttribute("aria-expanded", String(mobileSidebarOpen));

    const handle = sidebar?.querySelector(".sidebar-resize");
    if (handle && !mobileViewport.matches) {
      const expandedWidth = desktopSidebarWidth ?? sidebar?.offsetWidth ?? MIN_SIDEBAR_WIDTH;
      const width = sidebarResize?.width ??
        (collapsed ? COLLAPSED_SIDEBAR_WIDTH : expandedWidth);
      handle.setAttribute("aria-valuemin", String(COLLAPSED_SIDEBAR_WIDTH));
      handle.setAttribute("aria-valuemax", String(MAX_SIDEBAR_WIDTH));
      handle.setAttribute("aria-valuenow", String(width));
      handle.setAttribute("aria-valuetext", collapsed && !sidebarResize ? "Menú retraído" : `${width} píxeles`);
    }
  }
  function setDesktopSidebar(collapsed: boolean, width = desktopSidebarWidth) {
    desktopSidebarCollapsed = collapsed;
    desktopSidebarWidth = width;
    updateSidebar();
    try {
      localStorage.setItem(SIDEBAR_STORAGE, String(collapsed));
      if (width !== null) localStorage.setItem(SIDEBAR_WIDTH_STORAGE, String(width));
    } catch {
      // The current screen retains the menu state without storage.
    }
  }
  function cancelSidebarResize() {
    if (!sidebarResize) return;
    const { handle, pointerId } = sidebarResize;
    sidebarResize = null;
    if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
    updateSidebar();
  }
  function setMobileSidebar(open: boolean) {
    mobileSidebarOpen = open;
    updateSidebar();
    const focusTarget = open ? ".sidebar-close" : mobileViewport.matches ? ".sidebar-toggle" : ".sidebar-resize";
    app.querySelector<HTMLElement>(focusTarget)?.focus();
  }
  function setHeaderMenu(menu: HeaderMenu | null) {
    ui.openMenu = menu;
    for (const element of app.querySelectorAll<HTMLElement>("[data-header-menu]")) {
      element.hidden = element.dataset.headerMenu !== menu;
    }
    for (const trigger of app.querySelectorAll<HTMLElement>("[data-menu-trigger]")) {
      trigger.setAttribute("aria-expanded", String(trigger.dataset.menuTrigger === menu));
    }
  }
  function updateBell() {
    const unread = hasUnreadNotifications(context);
    const button = app.querySelector('[data-menu-trigger="notifications"]');
    button?.setAttribute("aria-label", unread ? "Notificaciones nuevas" : "Notificaciones");
    const dot = button?.querySelector<HTMLElement>(".notif-dot");
    if (dot) dot.hidden = !unread;
  }
  async function refreshNotifications(markRead = false) {
    const userId = me().id;
    if (!userId) return;

    const request = ++notificationRequest;
    const signal = listeners.signal;
    const notifications = await forumApi.notifications(signal);
    if (signal.aborted || request !== notificationRequest || me().id !== userId) return;

    context.notifications = notifications;
    updateBell();
    const list = app.querySelector("[data-notification-list]");
    if (list) list.innerHTML = notificationsContent(context);
    if (!markRead || ui.openMenu !== "notifications") return;

    const unread = notifications.filter((notification) => !notification.read);
    if (!unread.length) return;

    await forumApi.readNotifications(unread, signal);
    if (signal.aborted || request !== notificationRequest || me().id !== userId) return;
    for (const notification of unread) notification.read = true;
    updateBell();
  }
  function checkNotifications() {
    if (!document.hidden && ui.openMenu !== "notifications") {
      void refreshNotifications().catch(() => {});
    }
  }
  function requireMember(p: Post) {
    if (banned(me().id, p.communityId)) {
      toast("Tu acceso a esta comunidad está restringido.", true);
      return false;
    }
    if (!membership(me().id, p.communityId)) {
      toast("Tenés que ser miembro de la comunidad para comentar.", true);
      return false;
    }
    return true;
  }
  async function doVote(
    type: "post" | "comment",
    objectId: string,
    value: number,
  ) {
    const comment =
      type === "comment"
        ? context.db.comments.find((c) => c.id === objectId)
        : undefined;
    const targetPost = post(
      type === "post" ? objectId : (comment?.postId ?? null),
    );
    if (
      !targetPost ||
      (type === "comment" && !comment) ||
      (value !== 1 && value !== -1)
    )
      return;
    if ((comment?.authorId ?? targetPost.authorId) === me().id) {
      toast("No podés votar tu propio contenido.", true);
      return;
    }
    if (targetPost.hidden && !isMod(targetPost.communityId)) {
      toast("Este contenido está oculto.", true);
      return;
    }
    if (type === "post") await forumApi.votePost(me().id, objectId, value);
    else await forumApi.voteComment(me().id, objectId, value);
    await connect(listeners.signal);
    render();
  }
  function threadDepth(parentId: string) {
    let depth = 0;
    let cur = context.db.comments.find((c) => c.id === parentId);
    const visited = new Set<string>();
    while (cur) {
      if (visited.has(cur.id)) break;
      visited.add(cur.id);
      depth++;
      cur = context.db.comments.find((c) => c.id === cur?.parentId);
    }
    return depth;
  }
  async function handleAction(action: string, el: HTMLElement) {
    const itemId = el.dataset.id ?? "";
    switch (action) {
      case "navigate":
        switch (el.dataset.view) {
          case "home":
          case "communities":
          case "anonymous":
          case "profile":
          case "users":
          case "admin":
          case "saved":
          case "register":
            setView(el.dataset.view);
            break;
        }
        break;
      case "open-community":
        setView("community", { communityId: itemId, tab: "posts" });
        break;
      case "open-post":
        setView("postDetail", { postId: itemId });
        break;
      case "open-anon":
        setView("anonDetail", { anonId: itemId });
        break;
      case "open-profile-photo":
        app.querySelector<HTMLDialogElement>("#profile-photo-dialog")?.showModal();
        break;
      case "sort":
        ui.sort = el.dataset.value ?? "hot";
        render();
        break;
      case "dismiss-unlock":
        context.dismissUnlockedConversation(itemId, el.dataset.value);
        render();
        break;
      case "community-tab":
        setView(
          el.dataset.value === "top"
            ? "communityRanking"
            : el.dataset.value === "mod"
              ? "communityModeration"
              : "community",
        );
        break;
      case "toggle-sidebar":
        if (mobileViewport.matches) setMobileSidebar(!mobileSidebarOpen);
        break;
      case "close-sidebar":
        setMobileSidebar(false);
        break;
      case "profile-menu":
        setHeaderMenu(ui.openMenu === "profile" ? null : "profile");
        break;
      case "open-login":
        setView("login");
        break;
      case "admin-role": {
        const role = el.dataset.value;
        if (context.siteRole !== "admin" || (role !== "usuario" && role !== "subadmin")) return;
        await forumApi.changeSiteRole(itemId, role);
        await connect(listeners.signal);
        render();
        toast(role === "subadmin" ? "Subadmin nombrado." : "Rol de subadmin retirado.");
        break;
      }
      case "admin-visibility": {
        if (context.siteRole !== "admin" && context.siteRole !== "subadmin") return;
        const hidden = el.dataset.value === "ocultar";
        await forumApi.setAdminPostVisibility(itemId, hidden);
        await connect(listeners.signal);
        render();
        toast(hidden ? "Publicación oculta." : "Publicación visible.");
        break;
      }
      case "admin-delete": {
        const section = context.adminSelection?.section;
        if (!section || section === "subadmins" || section === "usuarios" ||
            (context.siteRole !== "admin" && context.siteRole !== "subadmin")) return;
        const message = section === "posts"
          ? "¿Querés eliminar esta publicación? Sus comentarios se conservan."
          : section === "preguntas"
            ? "¿Querés eliminar esta pregunta anónima y todas sus respuestas?"
            : "¿Querés eliminar este contenido?";
        if (!await confirmDeletion(message)) return;
        await forumApi.deleteAdminEntry(section, itemId);
        await connect(listeners.signal);
        render();
        toast("Contenido eliminado.");
        break;
      }
      case "admin-delete-user": {
        if (context.siteRole !== "admin" || context.adminSelection?.section !== "usuarios" || !el.dataset.username) return;
        if (!await confirmDeletion(`¿Querés eliminar la cuenta @${el.dataset.username}? Se cerrarán sus sesiones y se eliminará el contenido de sus publicaciones y comentarios. Las comunidades y las respuestas de otras cuentas se conservarán.`)) return;
        await forumApi.deleteAdminUser(itemId);
        await connect(listeners.signal);
        render();
        toast("Cuenta eliminada.");
        break;
      }
      case "logout":
        await forumApi.logout();
        clearBrowserSession();
        redirectToLogin();
        toast("Cerraste sesión.");
        break;
      case "delete-account": {
        const { id, username } = me();
        if (!id || context.siteRole === "admin") break;
        if (!await confirmDeletion(
          `¿Querés eliminar la cuenta @${username}? También se borrarán tus comunidades, publicaciones y comentarios.`,
        )) break;
        await forumApi.deleteAccount(id);
        clearBrowserSession();
        redirectToLogin();
        toast("Eliminaste tu cuenta.");
        break;
      }
      case "notifications":
        if (ui.openMenu === "notifications") {
          setHeaderMenu(null);
        } else {
          setHeaderMenu("notifications");
          void refreshNotifications(true).catch(() => {
            if (!listeners.signal.aborted && ui.openMenu === "notifications") {
              toast("No se pudieron actualizar las notificaciones.", true);
            }
          });
        }
        break;
      case "compose":
        setView(me().id ? "newPost" : "login");
        break;
      case "composer-type":
        ui.composerType = el.dataset.value ?? "post";
        render();
        break;
      case "compose-anon":
        setView(me().id ? "newAnonymous" : "login");
        break;
      case "create-community":
        setView("newCommunity");
        break;
      case "close-modal":
        switch (ui.view) {
          case "newAnonymous":
            setView("anonymous");
            break;
          case "newCommunity":
            setView("communities");
            break;
          case "editPost":
            setView("postDetail");
            break;
          case "report":
            if (ui.reportId) setView("postDetail", { postId: ui.reportId });
            else setView("home");
            break;
          case "ban":
            setView("communityModeration");
            break;
          default:
            setView("home");
        }
        break;
      case "join": {
        if (!me().id) {
          setView("login");
          return;
        }
        const c = comm(itemId);
        if (!c) return;
        if (banned(me().id, itemId)) {
          toast("No podés unirte mientras esté vigente la restricción.", true);
          return;
        }
        if (membership(me().id, itemId)) {
          toast("Ya sos miembro.");
          return;
        }
        await forumApi.changeMembership(me().id, itemId, "unir");
        await connect(listeners.signal);
        render();
        toast(`Te uniste a ${c.name}.`);
        break;
      }
      case "leave": {
        const m = membership(me().id, itemId);
        if (!m) return;
        const others = context.db.memberships.filter(
          (x) => x.communityId === itemId && x.userId !== me().id,
        );
        if (
          m.role === "moderador" &&
          others.length &&
          !others.some((x) => x.role === "moderador")
        ) {
          toast("No podés irte: sos el último moderador.", true);
          return;
        }
        await forumApi.changeMembership(me().id, itemId, "salir");
        await connect(listeners.signal);
        render();
        toast("Abandonaste la comunidad.");
        break;
      }
      case "vote-post":
        await doVote("post", itemId, Number(el.dataset.value));
        break;
      case "vote-comment":
        await doVote("comment", itemId, Number(el.dataset.value));
        break;
      case "save-post": {
        const found = context.db.saved.find(
          (s) => s.userId === me().id && s.postId === itemId,
        );
        await forumApi.changePost(
          me().id,
          itemId,
          found ? "quitar" : "guardar",
        );
        await connect(listeners.signal);
        render();
        toast(found ? "Quitado de guardados." : "¡Publicación guardada!");
        break;
      }
      case "report-post": {
        const p = post(itemId);
        if (!p || p.deleted || p.authorId === me().id) return;
        if (
          context.db.reports.some(
            (r) => r.userId === me().id && r.postId === itemId,
          )
        ) {
          toast("Ya reportaste esta publicación.", true);
          return;
        }
        setView("report", { reportId: itemId });
        break;
      }
      case "toggle-hide": {
        const p = post(itemId);
        if (!p || !isMod(p.communityId)) {
          toast("Acción solo para moderadores.", true);
          return;
        }
        const hide = !p.hidden;
        await forumApi.changePost(
          me().id,
          itemId,
          hide ? "ocultar" : "mostrar",
        );
        await connect(listeners.signal);
        render();
        toast(hide ? "Publicación ocultada." : "Publicación restaurada.");
        break;
      }
      case "reply-comment":
        ui.editingCommentId = null;
        ui.replyTo = itemId;
        render();
        break;
      case "cancel-reply":
        ui.replyTo = null;
        render();
        break;
      case "edit-comment": {
        const c = context.db.comments.find((comment) => comment.id === itemId);
        if (!c || c.deleted || c.authorId !== me().id) return;
        ui.replyTo = null;
        ui.editingCommentId = itemId;
        render();
        app.querySelector<HTMLTextAreaElement>('form[data-form="edit-comment"] textarea')?.focus();
        break;
      }
      case "cancel-edit-comment":
        ui.editingCommentId = null;
        render();
        break;
      case "report-comment": {
        const c = context.db.comments.find((comment) => comment.id === itemId);
        if (!c || c.deleted || c.authorId === me().id || context.db.reportedComments?.includes(itemId)) return;
        const answer = await ask(
          "Reportar comentario",
          `<div class="form-field"><label for="comment-report-reason">Motivo</label><select id="comment-report-reason" name="reason" required>${reportReasons.map((reason) => `<option>${esc(reason)}</option>`).join("")}</select></div>`,
          "Enviar reporte",
        );
        if (!answer) return;
        await forumApi.reportComment(itemId, String(answer.get("reason")));
        await connect(listeners.signal);
        render();
        toast("Reporte enviado a moderación.");
        break;
      }
      case "delete-comment": {
        const c = context.db.comments.find((c) => c.id === itemId);
        if (!me().id || !c || c.deleted || c.authorId !== me().id) return;
        if (!await confirmDeletion("¿Querés eliminar tu comentario? Las respuestas se conservan.")) return;
        await forumApi.deleteComment(c.id);
        if (ui.editingCommentId === c.id) ui.editingCommentId = null;
        await connect(listeners.signal);
        render();
        toast("Comentario eliminado. Las respuestas se conservan.");
        break;
      }
      case "edit-post": {
        const p = post(itemId);
        if (me().id && p && p.authorId === me().id && !p.hidden && !p.deleted) {
          setView("editPost", { postId: p.id });
        }
        break;
      }
      case "delete-post": {
        const p = post(itemId);
        if (!me().id || !p || p.deleted || p.authorId !== me().id) return;
        if (!await confirmDeletion("¿Querés eliminar tu publicación? Los comentarios se conservan.")) return;
        await forumApi.deletePost(p.id);
        if (ui.view === "postDetail") {
          await connect(listeners.signal);
          render();
        } else {
          setView("postDetail", { postId: p.id });
        }
        toast("Publicación eliminada.");
        break;
      }
      case "delete-community": {
        const c = comm(itemId);
        if (!me().id || !c || c.creatorId !== me().id) return;
        if (!await confirmDeletion(`¿Querés eliminar la comunidad ${c.name}? También se eliminarán tus publicaciones y comentarios dentro de ella.`)) return;
        await forumApi.deleteCommunity(c.id);
        setView("communities");
        toast("Comunidad eliminada.");
        break;
      }
      case "promote": {
        const cid = el.dataset.community ?? "",
          m = membership(itemId, cid);
        if (!isMod(cid) || !m) {
          toast("No tenés permiso.", true);
          return;
        }
        await forumApi.changeMembership(me().id, cid, "promover", itemId);
        await connect(listeners.signal);
        render();
        toast("Nuevo moderador nombrado.");
        break;
      }
      case "ban-modal":
        setView("ban", { banUserId: itemId });
        break;
      default:
        break;
    }
  }
  app.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || mobileViewport.matches || sidebarResize) return;
    const handle = event.target;
    if (!(handle instanceof HTMLElement) || !handle.matches(".sidebar-resize")) return;
    const width = app.querySelector<HTMLElement>("#site-sidebar")?.offsetWidth ?? MIN_SIDEBAR_WIDTH;
    event.preventDefault();
    handle.focus({ preventScroll: true });
    handle.setPointerCapture(event.pointerId);
    sidebarResize = { pointerId: event.pointerId, handle, startX: event.clientX, startWidth: width, width };
    updateSidebar();
  }, { signal: listeners.signal });
  app.addEventListener("pointermove", (event) => {
    if (!sidebarResize || sidebarResize.pointerId !== event.pointerId) return;
    const width = Math.round(sidebarResize.startWidth + event.clientX - sidebarResize.startX);
    sidebarResize.width = Math.min(MAX_SIDEBAR_WIDTH, Math.max(COLLAPSED_SIDEBAR_WIDTH, width));
    updateSidebar();
  }, { signal: listeners.signal });
  app.addEventListener("pointerup", (event) => {
    if (!sidebarResize || sidebarResize.pointerId !== event.pointerId) return;
    const { startWidth, width } = sidebarResize;
    sidebarResize = null;
    if (width === startWidth) updateSidebar();
    else if (width < SIDEBAR_SNAP_WIDTH) setDesktopSidebar(true);
    else setDesktopSidebar(false, Math.max(MIN_SIDEBAR_WIDTH, width));
  }, { signal: listeners.signal });
  app.addEventListener("lostpointercapture", (event) => {
    if (sidebarResize?.pointerId === event.pointerId) cancelSidebarResize();
  }, { signal: listeners.signal });
  app.addEventListener(
    "click",
    (event) => {
      if (event.target instanceof HTMLDialogElement && event.target.id === "profile-photo-dialog") {
        event.target.close();
        return;
      }
      const el =
        event.target instanceof Element &&
        event.target.closest<HTMLElement>("[data-action]");
      if (!el || !el.dataset.action) return;
      const action = el.dataset.action;
      event.preventDefault();
      void perform(() => handleAction(action, el));
    },
    { signal: listeners.signal },
  );
  document.addEventListener(
    "click",
    (event) => {
      if (!(event.target instanceof Element)) return;
      for (const options of app.querySelectorAll<HTMLDetailsElement>(".post-options[open], .profile-options[open]")) {
        if (!options.contains(event.target)) options.open = false;
      }
      const menu = ui.openMenu;
      if (menu && !event.target.closest(`[data-header-menu="${menu}"], [data-menu-trigger="${menu}"]`)) {
        setHeaderMenu(null);
      }
    },
    { capture: true, signal: listeners.signal },
  );
  document.addEventListener(
    "keydown",
    (event) => {
      if (actionDialog?.open || app.querySelector("#profile-photo-dialog[open]")) return;
      if (event.key === "Escape" && sidebarResize) {
        cancelSidebarResize();
        return;
      }
      if (event.key === "Escape" && mobileSidebarOpen) {
        setMobileSidebar(false);
        return;
      }
      if (event.key === "Escape" && ui.openMenu) {
        const trigger = app.querySelector<HTMLElement>(`[data-menu-trigger="${ui.openMenu}"]`);
        setHeaderMenu(null);
        trigger?.focus();
      }
      if (event.key === "Escape") {
        const options = app.querySelector<HTMLDetailsElement>(".post-options[open], .profile-options[open]");
        if (options) {
          options.open = false;
          options.querySelector("summary")?.focus();
        }
      }
      if (
        event.target instanceof HTMLElement &&
        event.target.matches(".sidebar-resize") &&
        ["ArrowLeft", "ArrowRight", "Enter"].includes(event.key)
      ) {
        event.preventDefault();
        const width = app.querySelector<HTMLElement>("#site-sidebar")?.offsetWidth ?? MIN_SIDEBAR_WIDTH;
        if (event.key === "Enter") setDesktopSidebar(!desktopSidebarCollapsed);
        else if (event.key === "ArrowLeft" && width <= MIN_SIDEBAR_WIDTH) setDesktopSidebar(true);
        else if (desktopSidebarCollapsed) setDesktopSidebar(false);
        else {
          const step = event.key === "ArrowLeft" ? -16 : 16;
          setDesktopSidebar(false, Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width + step)));
        }
        return;
      }
      if (
        event.target instanceof HTMLInputElement &&
        event.target.id === "search" &&
        event.key === "Enter"
      ) {
        event.preventDefault();
        ui.query = event.target.value.trim();
        if (!ui.query) {
          setView("home");
          return;
        }
        setView("search");
      }
    },
    { signal: listeners.signal },
  );
  app.addEventListener(
    "input",
    (event) => {
      if (
        event.target instanceof HTMLInputElement &&
        event.target.id === "search"
      )
        ui.query = event.target.value;
    },
    { signal: listeners.signal },
  );
  app.addEventListener(
    "submit",
    (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !form.dataset.form) return;
      event.preventDefault();
      const vals = new FormData(form);
      const removePhoto = event.submitter instanceof HTMLButtonElement && event.submitter.value === "remove";
      const field = (key: string) => String(vals.get(key) ?? "");
      const trim = (key: string, max = 10000) =>
        field(key).trim().slice(0, max);
      void perform(async () => {
        switch (form.dataset.form) {
          case "post": {
            const title = trim("title", 300),
              content = trim("content"),
              cid = field("communityId");
            if (!title) throw Error("El título es obligatorio.");
            if (!membership(me().id, cid) || banned(me().id, cid))
              throw Error("No tenés permiso para publicar en esta comunidad.");
            const isQuestion = ui.composerType === "question";
            const blindMode = Boolean(field("blindMode"));
            const submitted = JSON.stringify([cid, title, content, isQuestion, blindMode]);
            const previous = postRequests.get(form);
            const requestId = previous?.content === submitted ? previous.id : crypto.randomUUID();
            postRequests.set(form, { content: submitted, id: requestId });
            const p = await forumApi.createPost(
              me().id,
              cid,
              title,
              content,
              isQuestion,
              blindMode,
              requestId,
            );
            setView("postDetail", { postId: p.id });
            toast("Publicación creada.");
            break;
          }
          case "edit-post": {
            const p = post(ui.postId);
            if (!p || p.authorId !== me().id || p.hidden)
              throw Error("Solo podés editar tus propias publicaciones disponibles.");
            const title = trim("title", 300);
            if (!title) throw Error("El título es obligatorio.");
            await forumApi.updatePost(p.id, title, trim("content"));
            setView("postDetail", { postId: p.id });
            toast("Cambios guardados.");
            break;
          }
          case "anonymous": {
            const title = trim("title", 300);
            const category = field("category");
            if (title.length < 3)
              throw Error("La pregunta debe tener al menos 3 caracteres.");
            if (!isAnonymousCategory(category))
              throw Error("Elegí una categoría para tu pregunta.");
            const question = await forumApi.createQuestion(
              title,
              trim("content", 5000),
              !!field("blindMode"),
              category,
            );
            setView("anonDetail", { anonId: question });
            toast("Pregunta anónima publicada.");
            break;
          }
          case "anon-answer": {
            const text = trim("text", 3000),
              qid = field("questionId");
            if (!text) throw Error("Escribí una respuesta primero.");
            const question = context.db.anonymousQuestions.find((q) => q.id === qid);
            if (!question) throw Error("Pregunta inexistente.");
            const wasLocked = !context.anonUnlocked(question);
            await forumApi.answerQuestion(qid, text);
            if (wasLocked) rememberUnlockedConversation(me().id, { id: qid, kind: "anonymous" });
            await connect(listeners.signal);
            render();
            toast("Respuesta enviada sin mostrar tu identidad.");
            break;
          }
          case "comment": {
            const pid = field("postId"),
              p = post(pid),
              text = trim("text", 3000),
              parentId = field("parentId") || null;
            if (!p) throw Error("Post inexistente.");
            if (p.deleted) throw Error("La publicación está eliminada.");
            if (!requireMember(p)) return;
            if (!text) throw Error("Escribí un comentario.");
            if (parentId) {
              const parent = context.db.comments.find((c) => c.id === parentId);
              if (!parent || parent.deleted || parent.postId !== pid)
                throw Error(
                  "El comentario padre debe pertenecer al mismo post.",
                );
              if (threadDepth(parentId) >= 10)
                throw Error("El hilo ya alcanzó su profundidad máxima.");
            }
            const wasLocked = !context.canSee(p);
            await forumApi.createComment(me().id, pid, parentId, text);
            if (wasLocked) rememberUnlockedConversation(me().id, { id: pid, kind: "post" });
            ui.replyTo = null;
            await connect(listeners.signal);
            render();
            toast("Comentario publicado.");
            break;
          }
          case "edit-comment": {
            const c = context.db.comments.find((comment) => comment.id === ui.editingCommentId);
            const text = trim("text", 3000);
            if (!c || c.deleted || c.authorId !== me().id || !text) return;
            await forumApi.updateComment(c.id, text);
            ui.editingCommentId = null;
            await connect(listeners.signal);
            render();
            toast("Comentario actualizado.");
            break;
          }
          case "community": {
            if (totalKarma(me().id) < 10)
              throw Error("Necesitás 10 de karma para crear una comunidad.");
            const name = trim("name", 21).toLowerCase(),
              description = trim("description", 400);
            if (!/^[a-z0-9_]{3,21}$/.test(name))
              throw Error("Nombre inválido: 3–21 caracteres, sin espacios.");
            if (
              context.db.communities.some((c) => c.name.toLowerCase() === name)
            )
              throw Error("Ese nombre de comunidad ya existe.");
            if (!description) throw Error("La descripción es obligatoria.");
            const community = await forumApi.createCommunity(
              me().id,
              name,
              description,
              !!field("nsfw"),
            );
            const cid = community.id;
            setView("community", { communityId: cid, tab: "posts" });
            toast("Comunidad creada. Ya sos parte del equipo de moderación.");
            break;
          }
          case "login":
            await forumApi.login(field("username").trim(), field("clave"));
            setView("home");
            toast("Iniciaste sesión.");
            break;
          case "register": {
            const user = await forumApi.register(field("username").trim(), field("email").trim(), field("clave"));
            clearBrowserSession();
            showWelcomeForNewAccount(user.id);
            setView("home");
            toast("Tu cuenta se creó correctamente.");
            break;
          }
          case "profile":
            await forumApi.updateProfile(trim("description", 300));
            await connect(listeners.signal);
            render();
            toast("Perfil actualizado.");
            break;
          case "photo": {
            const { target, id } = form.dataset;
            if (!id || (target !== "usuarios" && target !== "comunidades")) return;
            if (removePhoto) {
              if (!await ask("Quitar foto", "<p>Se mostrará el ícono predeterminado.</p>", "Quitar foto", true)) return;
              await forumApi.removePhoto(target, id);
            } else {
              const photo = vals.get("photo");
              if (!(photo instanceof File) || !photo.size) throw Error("Elegí una foto.");
              if (photo.size > maxPhotoBytes) throw Error("La foto tiene que pesar como máximo 5 MB.");
              await forumApi.savePhoto(target, id, photo);
            }
            await connect(listeners.signal);
            render();
            toast(removePhoto ? "Foto quitada." : "Foto guardada.");
            break;
          }
          case "report": {
            const pid = field("postId"),
              p = post(pid);
            if (!p || p.deleted) throw Error("La publicación no está disponible.");
            if (p.authorId === me().id) throw Error("No podés reportar tu propia publicación.");
            if (
              context.db.reports.some(
                (r) => r.userId === me().id && r.postId === pid,
              )
            )
              throw Error("Ya reportaste esta publicación.");
            await forumApi.changePost(
              me().id,
              pid,
              "reportar",
              trim("reason", 200),
            );
            setView("postDetail", { postId: p.id });
            toast("Reporte enviado a moderación.");
            break;
          }
          case "ban": {
            const cid = ui.communityId,
              uid = ui.banUserId,
              m = membership(uid, cid);
            if (!uid || !isMod(cid) || !m)
              throw Error("No tenés permiso para banear.");
            if (m.role === "moderador")
              throw Error("No se puede banear a otro moderador.");
            const reason = trim("reason", 255);
            if (!reason) throw Error("El motivo es obligatorio.");
            const until = field("until")
              ? new Date(`${field("until")}T23:59:59`).toISOString()
              : null;
            if (until && new Date(until) <= new Date())
              throw Error("La fecha del ban debe ser futura.");
            await forumApi.changeMembership(
              me().id,
              cid,
              "banear",
              uid,
              reason,
              until,
            );
            setView("communityModeration");
            toast("Usuario baneado y removido de la comunidad.");
            break;
          }
          default:
            break;
        }
      });
    },
    { signal: listeners.signal },
  );

  let pending = true;
  async function perform(work: () => Promise<void>) {
    if (pending) return;
    pending = true;
    try {
      await work();
    } catch (error) {
      if (!listeners.signal.aborted) {
        if (!accountPage && error instanceof ApiError && error.status === 401) {
          redirectToLogin();
          return;
        }
        toast(
          error instanceof Error
            ? error.message
            : "No se pudo completar la acción.",
          true,
        );
      }
    } finally {
      pending = false;
    }
  }

  if (accountPage) {
    pending = false;
    render();
    return () => listeners.abort();
  }

  app.innerHTML =
    '<p class="card blank" role="status">Conectando con la API de VoZero…</p>';
  void connect(listeners.signal)
    .then(() => {
      if (!listeners.signal.aborted) {
        if (!me().id) {
          redirectToLogin();
          return;
        }
        pending = false;
        render();
        checkNotifications();
      }
    })
    .catch((error) => {
      if (!listeners.signal.aborted) {
        if (error instanceof ApiError && error.status === 401) {
          redirectToLogin();
          return;
        }
        app.innerHTML =
          '<div class="card blank"><p>No pudimos conectar con la API de VoZero. Revisá que el backend esté iniciado.</p><a class="btn btn-primary" href="">Reintentar</a></div>';
      }
    });

  function updateRelativeTimes() {
    if (document.hidden) return;
    const now = Date.now();
    for (const time of app.querySelectorAll<HTMLTimeElement>("time[data-relative-time]")) {
      const label = dateLabel(time.dateTime, now);
      if (time.textContent !== label) time.textContent = label;
    }
  }

  document.addEventListener("visibilitychange", () => {
    updateRelativeTimes();
    checkNotifications();
  }, { signal: listeners.signal });
  mobileViewport.addEventListener("change", () => {
    cancelSidebarResize();
    if (mobileSidebarOpen) setMobileSidebar(false);
    else updateSidebar();
  }, { signal: listeners.signal });
  const notificationTimer = window.setInterval(checkNotifications, 20_000);
  const clockTimer = window.setInterval(updateRelativeTimes, 10_000);
  return () => {
    window.clearInterval(notificationTimer);
    window.clearInterval(clockTimer);
    listeners.abort();
    disposePhotoPreview?.();
    actionDialog?.close("cancel");
  };
}
