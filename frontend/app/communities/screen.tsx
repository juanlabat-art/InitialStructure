"use client";
import PuntoScreen from "../punto-screen";
import type { ScreenContext } from "../shared/state";
import { ico, cicon, esc, count } from "../shared/presentation";

function communities(context: ScreenContext) {
  const { db, memberCount, membership, me } = context;
  return `<div class="page-head"><div><h2>Explorá comunidades 🌎</h2><div class="page-subtitle">Encontrá gente que comparte tus intereses.</div></div><button class="btn btn-primary btn-sm" data-action="create-community">${ico("plus", 15)} Crear comunidad</button></div><div class="community-grid">${db.communities.map((c) => `<article class="card community-tile">${cicon(c, 47)}<h3>r/${esc(c.name)}</h3><p>${esc(c.description)}</p><div class="comm-meta">${count(memberCount(c.id))} miembros ${membership(me().id, c.id) ? "· Ya sos miembro" : ""}</div><button class="btn btn-sm ${membership(me().id, c.id) ? "btn-light" : "btn-primary"}" data-action="open-community" data-id="${c.id}">${membership(me().id, c.id) ? "Ver comunidad" : "Conocer comunidad"} ${ico("back", 12)}</button></article>`).join("")}</div>`;
}
export default function Screen() {
  return <PuntoScreen view="communities" renderScreen={communities} />;
}
