import type { Post, ViewState } from "./demo-types";
import { header, sidebar, rightbar } from "./shared/chrome";
import { esc } from "./shared/presentation";
import { forumApi } from "./shared/api";
import { createScreenContext, type ScreenRenderer } from "./shared/state";

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
    case "saved":
      return "/saved";
    case "search":
      return "/search?" + new URLSearchParams({ q: state.query });
    case "newPost":
      return (
        "/post/new?" + new URLSearchParams({ community: state.communityId })
      );
    case "newAnonymous":
      return "/anonymous/new";
    case "newCommunity":
      return "/communities/new";
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
  navigate: (href: string) => void,
  renderScreen: ScreenRenderer,
) {
  const listeners = new AbortController();
  const context = createScreenContext(view, routeId, query, targetId);
  const {
    ui,
    me,
    comm,
    post,
    membership,
    isMod,
    banned,
    votesFor,
    totalKarma,
    save,
    connect,
    reset,
  } = context;
  function toast(msg: string, error = false) {
    const root = toastRoot;
    root.innerHTML = `<div class="toast ${error ? "error" : ""}">${esc(msg)}</div>`;
    const message = root.firstElementChild;
    setTimeout(() => message?.remove(), 3300);
  }
  function setView(view: ViewState["view"], extra: Partial<ViewState> = {}) {
    const href = viewHref(view, { ...ui, ...extra });
    if (href !== window.location.pathname + window.location.search) {
      navigate(href);
      return;
    }
    Object.assign(ui, {
      view,
      profileMenu: false,
      replyTo: null,
      ...extra,
    });
    window.scrollTo({ top: 0, behavior: "instant" });
    render();
  }
  function render() {
    const active = document.activeElement;
    app.innerHTML = `<div class="app-shell">${header(context)}<div class="layout">${sidebar(context)}<main class="main">${renderScreen(context)}</main>${rightbar(context)}</div></div>`;
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
  function requireMember(p: Post) {
    if (banned(me().id, p.communityId)) {
      toast("Estás baneado de esta comunidad.", true);
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
    const currentVote = votesFor(type, objectId).find(
      (v) => v.userId === me().id,
    );
    const nextValue = currentVote?.value === value ? 0 : value;
    if (type === "post") await forumApi.votePost(me().id, objectId, nextValue);
    else await forumApi.voteComment(me().id, objectId, nextValue);
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
          case "saved":
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
      case "sort":
        ui.sort = el.dataset.value ?? "hot";
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
      case "profile-menu":
        ui.profileMenu = !ui.profileMenu;
        render();
        break;
      case "switch-user":
        const previousUser = context.db.currentUserId;
        context.db.currentUserId = itemId;
        try {
          await connect(listeners.signal);
        } catch (error) {
          context.db.currentUserId = previousUser;
          throw error;
        }
        setView("home");
        toast(`Ahora estás usando @${me().username}`);
        break;
      case "open-register":
        setView("register");
        break;
      case "reset-demo":
        if (
          confirm(
            "¿Reiniciar la sesión de este navegador?",
          )
        ) {
          await reset(listeners.signal);
          setView("home");
          toast("Sesión local reiniciada.");
        }
        break;
      case "notifications":
        toast("¡Estás al día! No tenés notificaciones nuevas.");
        break;
      case "compose":
        setView("newPost");
        break;
      case "composer-type":
        ui.composerType = el.dataset.value ?? "post";
        render();
        break;
      case "compose-anon":
        setView("newAnonymous");
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
          setView("register");
          return;
        }
        const c = comm(itemId);
        if (!c) return;
        if (banned(me().id, itemId)) {
          toast("No podés unirte: existe un ban vigente.", true);
          return;
        }
        if (membership(me().id, itemId)) {
          toast("Ya sos miembro.");
          return;
        }
        await forumApi.changeMembership(me().id, itemId, "unir");
        await connect(listeners.signal);
        render();
        toast(`Te uniste a r/${c.name}.`);
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
      case "report-post":
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
        ui.replyTo = itemId;
        render();
        break;
      case "cancel-reply":
        ui.replyTo = null;
        render();
        break;
      case "delete-comment": {
        const c = context.db.comments.find((c) => c.id === itemId);
        if (!c || c.authorId !== me().id) return;
        await forumApi.deleteComment(c.id);
        await connect(listeners.signal);
        render();
        toast("Comentario eliminado; las respuestas se conservan.");
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
  app.addEventListener(
    "click",
    (event) => {
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
    "keydown",
    (event) => {
      if (event.key === "Escape" && ui.profileMenu) {
        ui.profileMenu = false;
        render();
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
            const p = await forumApi.createPost(
              me().id,
              cid,
              title,
              content,
              ui.composerType === "question",
              !!field("blindMode"),
            );
            setView("postDetail", { postId: p.id });
            toast("¡Publicación creada!");
            break;
          }
          case "anonymous": {
            const title = trim("title", 300);
            if (title.length < 3)
              throw Error("La pregunta debe tener al menos 3 caracteres.");
            const question = await forumApi.createQuestion(
              title,
              trim("content", 5000),
              !!field("blindMode"),
            );
            setView("anonDetail", { anonId: question });
            toast("¡Pregunta anónima publicada!");
            break;
          }
          case "anon-answer": {
            const text = trim("text", 3000),
              qid = field("questionId");
            if (!text) throw Error("Escribí una respuesta primero.");
            if (!context.db.anonymousQuestions.some((q) => q.id === qid))
              throw Error("Pregunta inexistente.");
            await forumApi.answerQuestion(qid, context.db.sessionToken, text);
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
            if (!requireMember(p)) return;
            if (!text) throw Error("Escribí un comentario.");
            if (parentId) {
              const parent = context.db.comments.find((c) => c.id === parentId);
              if (!parent || parent.postId !== pid)
                throw Error(
                  "El comentario padre debe pertenecer al mismo post.",
                );
              if (threadDepth(parentId) >= 10)
                throw Error("El hilo ya alcanzó su profundidad máxima.");
            }
            await forumApi.createComment(me().id, pid, parentId, text);
            ui.replyTo = null;
            await connect(listeners.signal);
            render();
            toast(
              p.blindMode
                ? "¡Opinión enviada! Desbloqueaste las respuestas."
                : "¡Comentario publicado!",
            );
            break;
          }
          case "community": {
            if (context.db.communities.length && totalKarma(me().id) < 10)
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
            toast("¡Creaste tu comunidad y ya sos moderador/a!");
            break;
          }
          case "register": {
            const username = trim("username", 24),
              email = trim("email", 150).toLowerCase();
            if (!/^[a-zA-Z0-9_.]{3,24}$/.test(username))
              throw Error(
                "Nombre inválido. Usá letras, números, punto o guion bajo.",
              );
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
              throw Error("Ingresá un email válido.");
            if (
              context.db.users.some(
                (u) => u.username.toLowerCase() === username.toLowerCase(),
              )
            )
              throw Error("El nombre de usuario ya está en uso.");
            if (context.db.users.some((u) => u.email.toLowerCase() === email))
              throw Error("Ese email ya está registrado.");
            const u = await forumApi.register(username, email);
            context.db.users.push(u);
            context.db.currentUserId = u.id;
            save();
            setView("home");
            toast("¡Tu cuenta fue creada con 0 karma!");
            break;
          }
          case "report": {
            const pid = field("postId"),
              p = post(pid);
            if (!p) throw Error("Post inexistente.");
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

  app.innerHTML =
    '<p class="card blank" role="status">Conectando con la API de Punto…</p>';
  void connect(listeners.signal)
    .then(() => {
      if (!listeners.signal.aborted) {
        pending = false;
        render();
      }
    })
    .catch(() => {
      if (!listeners.signal.aborted) {
        app.innerHTML =
          '<div class="card blank"><p>No pudimos conectar con la API de Punto. Revisá que el backend esté iniciado.</p><a class="btn btn-primary" href="">Reintentar</a></div>';
      }
    });

  return () => {
    listeners.abort();
  };
}
