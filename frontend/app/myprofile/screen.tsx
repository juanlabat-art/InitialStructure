"use client";
import PuntoScreen from "../punto-screen";
import type { ScreenContext } from "../shared/state";
import { postCard, noContent, sortPosts } from "../shared/posts";
import { profileActions } from "../shared/chrome";
import { av, displayKarma, esc, ico, karmaProgress, photoUrl, siteRoleLabels } from "../shared/presentation";

function profile(context: ScreenContext) {
  const { me, db, ui, karma, votesToNextKarma } = context;
  const directoryProfile = ui.view === "userProfile";
  const back = directoryProfile ? `<a class="back" href="/users">${ico("back", 15)} Volver a Usuarios</a>` : "";
  const u = directoryProfile
    ? db.users.find((user) => user.profileVisible && user.username.toLowerCase() === ui.profileUsername)
    : me();
  if (!u?.id) return back + noContent("Perfil no encontrado", "Buscá otro usuario en VoZero.", "user");

  const own = u.id === me().id;
  const posts = sortPosts(context, db.posts.filter((post) => post.authorId === u.id && !post.deleted), "new");
  const joined = db.memberships.filter((membership) => membership.userId === u.id);
  const photo = photoUrl("usuarios", u);
  const avatar = av(u, "large");
  const photoLabel = `Foto de perfil de @${u.username}`;
  return `${back}<div class="profile-cover"></div><div class="profile-body">
   <div class="profile-heading">
     <div class="profile-identity">
       ${photo ? `<button type="button" class="profile-photo-button" data-action="open-profile-photo" aria-label="Ampliar foto de @${esc(u.username)}" aria-haspopup="dialog" aria-controls="profile-photo-dialog">${avatar}</button>` : avatar}
       <div><h1>@${esc(u.username)}</h1><div class="profile-details"><span class="tag">${siteRoleLabels[u.siteRole ?? "usuario"]}</span><small>Miembro desde ${new Date(u.joinedAt).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}</small></div></div>
     </div>
     ${own ? `<details class="profile-options">
       <summary class="icon-btn" aria-label="Opciones de perfil" title="Opciones de perfil">${ico("dots", 20)}</summary>
       <div class="profile-options-panel">${profileActions(context)}</div>
     </details>` : ""}
   </div>
   ${u.description ? `<p class="profile-description">${esc(u.description)}</p>` : ""}
   <div class="profile-stats">
     <div><b>${displayKarma(u.karmaBase, u.siteRole)}</b><small>Karma total</small>
       ${own && karma ? `<small>${karma.votos_positivos_posts} votos positivos en publicaciones · ${karma.votos_positivos_comentarios} en comentarios</small>` : ""}
       ${own && u.siteRole !== "admin" && karma?.karma_por_nombramientos ? `<small>${karma.karma_por_nombramientos} puntos de karma por nombramientos</small>` : ""}
     </div>
     <div><b>${posts.length}</b><small>Publicaciones</small></div>
     <div><b>${joined.length}</b><small>Comunidades</small></div>
   </div>
   ${own ? karmaProgress(votesToNextKarma, u.siteRole) : ""}
   </div>
   ${photo ? `<dialog class="profile-photo-dialog" id="profile-photo-dialog" aria-label="${esc(photoLabel)}">
     <form method="dialog"><button type="submit" aria-label="Cerrar foto" autofocus>
       <img class="profile-photo-large" src="${esc(photo)}" alt="${esc(photoLabel)}" decoding="async" width="256" height="256" />
     </button></form>
   </dialog>` : ""}
   <div class="page-head"><div><h2>${own ? "Tus publicaciones" : "Publicaciones"}</h2>${own ? '<div class="page-subtitle">Este perfil <b>nunca muestra</b> tus preguntas ni respuestas anónimas.</div>' : ""}</div></div>
   <section class="feed-list">${posts.length ? posts.map((post) => postCard(context, post)).join("") : noContent("Todavía no hay publicaciones", own ? "Tus publicaciones en comunidades van a aparecer acá." : "Este perfil todavía no tiene publicaciones visibles.", "message")}</section>`;
}
export default function Screen({ username }: { username?: string }) {
  return <PuntoScreen view={username === undefined ? "profile" : "userProfile"} id={username} renderScreen={profile} />;
}
