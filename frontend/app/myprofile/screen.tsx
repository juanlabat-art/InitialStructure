"use client";
import PuntoScreen from "../punto-screen";
import type { ScreenContext } from "../shared/state";
import { postCard, noContent } from "../shared/posts";
import { av, esc } from "../shared/presentation";

function profile(context: ScreenContext) {
  const { me, db, totalKarma } = context;
  const currentUser = me();
  if (!currentUser.id) {
    return `<div class="card profile-body"><button class="btn btn-primary" data-action="open-register">Ingresá para ver tu perfil</button></div>`;
  }
  const u = currentUser,
    p = db.posts
      .filter((p) => p.authorId === u.id && !p.hidden)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    joined = db.memberships.filter((m) => m.userId === u.id);
  return `<div class="profile-cover"></div><div class="profile-body"><div class="profile-identity">${av(u, "large")}<div><h1>@${esc(u.username)}</h1><small>Miembro desde ${new Date(u.joinedAt).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}</small></div></div><div class="profile-stats"><div><b>${totalKarma(u.id)}</b><small>Karma total</small>${context.karma ? `<small>${context.karma.votos_positivos_posts} votos positivos en posts · ${context.karma.votos_positivos_comentarios} en comentarios</small>` : ""}</div><div><b>${p.length}</b><small>Publicaciones</small></div><div><b>${joined.length}</b><small>Comunidades</small></div></div></div>
   <div class="page-head"><button type="button" class="btn btn-danger" data-action="delete-account">Eliminar mi cuenta</button></div>
   <div class="page-head"><div><h2>Tus publicaciones</h2><div class="page-subtitle">Este perfil <b>nunca muestra</b> tus preguntas ni respuestas anónimas.</div></div></div>
   <section class="feed-list">${p.length ? p.map((item) => postCard(context, item)).join("") : noContent("Todavía no publicaste", "Cuando publiques en una comunidad, tus posts van a aparecer acá.", "message")}</section>`;
}
export default function Screen() {
  return <PuntoScreen view="profile" renderScreen={profile} />;
}
