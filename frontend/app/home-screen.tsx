"use client";
import PuntoScreen from "./punto-screen";
import type { ScreenContext } from "./shared/state";
import { sortPosts, filters, postCard, noContent } from "./shared/posts";
import { esc, ico } from "./shared/presentation";

function home(context: ScreenContext) {
  const { db, me } = context;
  const joined = new Set(
    db.memberships
      .filter((m) => m.userId === me().id)
      .map((m) => m.communityId),
  );
  const posts = sortPosts(
    context,
    db.posts.filter((p) => joined.has(p.communityId)),
  );
  const unlocked = context.unlockedConversations.map(({ id, kind }) => {
    const entry = kind === "post" ? context.post(id) : db.anonymousQuestions.find((question) => question.id === id);
    if (!entry || ("hidden" in entry && (entry.hidden || entry.deleted))) return "";
    return `<aside class="answered-info unlock-notice" role="status">
      ${ico("unlock", 18)}<div><strong>Conversación desbloqueada</strong><a href="/${kind}/${id}">${esc(entry.title)}</a></div>
      <button type="button" class="icon-btn" data-action="dismiss-unlock" data-id="${id}" data-value="${kind}" aria-label="Cerrar aviso">${ico("x", 17)}</button>
    </aside>`;
  }).join("");
  return `${context.showWelcome ? '<section class="hero"><div style="position:relative;z-index:2"><h1>Bienvenido a VoZero</h1><p>Descubrí comunidades y compartí tu primera publicación.</p></div><div class="hero-art"></div></section>' : ""}
   ${unlocked}
   <div class="page-head"><h2>Publicaciones de tus comunidades</h2></div>
   <div class="page-head community-post-actions">${filters(context)}<button class="btn btn-primary community-publish" data-action="compose">${ico("plus", 18)} Publicar</button></div>
   <section class="feed-list">${posts.length ? posts.map((item) => postCard(context, item)).join("") : noContent("Todavía no hay publicaciones", "Unite a una comunidad para ver sus publicaciones acá.", "users", "navigate", "communities")}</section>`;
}
export default function Screen() {
  return <PuntoScreen view="home" renderScreen={home} />;
}
