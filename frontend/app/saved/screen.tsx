"use client";
import PuntoScreen from "../punto-screen";
import type { ScreenContext } from "../shared/state";
import { type Post } from "../demo-types";
import { postCard, noContent } from "../shared/posts";

function savedView(context: ScreenContext) {
  const { db, me, post } = context;
  const saved = db.saved
    .filter((s) => s.userId === me().id)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map((s) => post(s.postId))
    .filter((p): p is Post => p !== undefined && !p.hidden);
  return `<div class="page-head"><div><h2>Tus guardados 🔖</h2><div class="page-subtitle">Publicaciones a las que querés volver.</div></div></div><div class="feed-list">${saved.length ? saved.map((item) => postCard(context, item)).join("") : noContent("Todavía no guardaste posts", "Tocá “Guardar” en cualquier publicación para tenerla acá.", "bookmark")}</div>`;
}
export default function Screen() {
  return <PuntoScreen view="saved" renderScreen={savedView} />;
}
