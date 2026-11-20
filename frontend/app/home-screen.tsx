"use client";
import PuntoScreen from "./punto-screen";
import type { ScreenContext } from "./shared/state";
import { sortPosts, filters, postCard, noContent } from "./shared/posts";
import { ico } from "./shared/presentation";

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
  return `<section class="hero"><div style="position:relative;z-index:2"><div class="eyebrow">${ico("sparkles", 14)} Bienvenido a punto.</div><h1>Las mejores ideas<br/>empiezan con una pregunta.</h1><p>Conectá, compartí y descubrí otras formas de pensar.</p></div><div class="hero-art"></div></section>
   <div class="page-head"><div><h2>Tu feed ✨</h2><div class="page-subtitle">Lo que está pasando en tus comunidades</div></div>${filters(context)}</div>
   <section class="feed-list">${posts.length ? posts.map((item) => postCard(context, item)).join("") : noContent("Tu feed está vacío", "Unite a una comunidad para empezar a ver publicaciones.", "users", "navigate", "communities")}</section>`;
}
export default function Screen() {
  return <PuntoScreen view="home" renderScreen={home} />;
}
