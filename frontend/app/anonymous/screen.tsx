"use client";
import PuntoScreen from "../punto-screen";
import type { ScreenContext } from "../shared/state";
import { type Question } from "../demo-types";
import { ico, dateLabel, esc } from "../shared/presentation";

function anonCard(context: ScreenContext, q: Question) {
  const { anonUnlocked, numberOfAnonAnswers } = context;
  const unlocked = anonUnlocked(q),
    n = numberOfAnonAnswers(q.id);
  return `<article class="card anon-card"><div class="anon-top"><span class="anon-mask">${ico("mask", 19)}</span><div><div class="anon-username">Una persona anónima</div><div class="post-date">${dateLabel(q.createdAt)}</div></div><span class="foot-gap"></span>${q.blindMode ? `<span class="tag orange">${ico("lock", 12)} Opiná primero</span>` : ""}</div>
    <h3 data-action="open-anon" data-id="${q.id}">${esc(q.title)}</h3><p>${esc(q.content)}</p>
    ${q.blindMode && !unlocked ? `<div class="locked-banner"><span class="lock-square">${ico("lock", 17)}</span><div><b>Respuestas protegidas</b><small>Las vas a ver después de dar tu opinión anónima.</small></div><button class="btn btn-sm btn-primary" data-action="open-anon" data-id="${q.id}">Responder</button></div>` : ""}
    <div class="anon-footer"><span>${ico("message", 15)} ${n} respuestas</span><span>${ico("shield", 15)} Identidad protegida</span><span class="foot-gap"></span><button data-action="open-anon" data-id="${q.id}">${unlocked ? "Ver conversación" : "Participar"} →</button></div></article>`;
}

function anonymous(context: ScreenContext) {
  const { db } = context;
  const qs = [...db.anonymousQuestions].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
  return `<section class="anon-hero"><div class="eyebrow">${ico("shield", 15)} ESPACIO SEGURO Y ANÓNIMO</div><h1>Acá importa lo que decís.<br/>No quién sos.</h1><p>Preguntá sin mostrar tu nombre y recibí respuestas igual de anónimas. Sin perfiles, sin prejuicios.</p><button class="btn" data-action="compose-anon">${ico("plus", 16)} Hacer pregunta anónima</button><span class="small-note">${ico("lock", 13)} Fuera de tu perfil</span></section>
  <div class="feature-row"><div class="feature"><span>${ico("mask", 20)}</span><div><b>Identidades ocultas</b><small>Ni preguntas ni respuestas muestran usuarios</small></div></div><div class="feature"><span>${ico("eyeOff", 20)}</span><div><b>Opiniones sin influencia</b><small>Respondé primero si la pregunta está bloqueada</small></div></div></div>
  <div class="page-head"><div><h2>Preguntas sin nombre</h2><div class="page-subtitle">Todos pueden preguntar. Nadie tiene que exponerse.</div></div></div>
  <section class="feed-list">${qs.map((item) => anonCard(context, item)).join("")}</section>`;
}
export default function Screen() {
  return <PuntoScreen view="anonymous" renderScreen={anonymous} />;
}
