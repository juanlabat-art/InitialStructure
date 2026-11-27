"use client";
import PuntoScreen from "../punto-screen";
import { backToHome, pinButton } from "../shared/chrome";
import type { ScreenContext } from "../shared/state";
import { ico, cicon, esc, count } from "../shared/presentation";

function communities(context: ScreenContext) {
  const { db, memberCount, membership, me } = context;
  return `${backToHome()}
  <div class="page-head">
    <div><h2>Explorar comunidades</h2><div class="page-subtitle">Encontrá comunidades sobre temas de tu interés.</div></div>
    <button class="btn btn-primary btn-sm" data-action="create-community">${ico("plus", 15)} Crear comunidad</button>
  </div>
  <div class="community-grid">${db.communities.map((community) => {
    const joined = membership(me().id, community.id);
    return `<article class="card community-tile is-clickable" data-action="open-community" data-id="${community.id}" role="link" tabindex="0" aria-label="Abrir comunidad ${esc(community.name)}">
      <div class="community-tile-top">${cicon(community, 47)}${joined ? pinButton(context, community.id, community.name) : ""}</div>
      <h3>${esc(community.name)}</h3>
      <p>${esc(community.description)}</p>
      <div class="comm-meta">${count(memberCount(community.id))} miembros${joined ? " · Ya sos miembro" : ""}</div>
      ${joined ? "" : `<button class="btn btn-sm btn-primary" data-action="join" data-id="${community.id}">${ico("plus", 14)} Unirme</button>`}
    </article>`;
  }).join("")}</div>`;
}
export default function Screen() {
  return <PuntoScreen view="communities" renderScreen={communities} />;
}
