"use client";
import PuntoScreen from "../../punto-screen";
import type { ScreenContext } from "../../shared/state";
import { noContent } from "../../shared/posts";
import { ico, dateLabel, esc } from "../../shared/presentation";

function anonDetail(context: ScreenContext) {
  const { db, ui, anonUnlocked, me } = context;
  const q = db.anonymousQuestions.find((q) => q.id === ui.anonId);
  if (!q)
    return noContent("Pregunta no encontrada", "Volvé al espacio anónimo.");
  const answers = db.anonymousAnswers
    .filter((a) => a.questionId === q.id)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const unlocked = anonUnlocked(q);
  return `<button class="back" data-action="navigate" data-view="anonymous">${ico("back", 15)} Volver al espacio anónimo</button>
  <article class="card detail-card"><div class="anon-top"><span class="anon-mask">${ico("mask", 19)}</span><div><div class="anon-username">Una persona anónima</div><div class="post-date">${dateLabel(q.createdAt)}</div></div><span class="foot-gap"></span><span class="tag green">${ico("shield", 12)} Sin identidad</span></div>
  <h1>${esc(q.title)}</h1><p class="post-content">${esc(q.content)}</p>${q.blindMode ? `<div class="question-mode">${ico(unlocked ? "unlock" : "lock", 18)} ${unlocked ? "Ya podés leer las opiniones: participaste primero." : "Las respuestas se desbloquean cuando respondés, para evitar influencias."}</div>` : ""}</article>
  <div class="discussion-head"><h3>Conversación anónima</h3><small>· ${answers.length} respuestas</small></div>
  ${!unlocked ? `<div class="answer-lock"><div class="biglock">${ico("lock", 28)}</div><h3>Tu opinión va primero</h3><p>Todavía no podés ver qué respondieron los demás. Compartí tu respuesta y desbloqueá todas las opiniones.</p><div class="fake-answer"></div><div class="fake-answer short"></div></div>` : answers.length ? `<div class="card" style="padding:6px 22px">${answers.map((a) => `<div class="anon-answer"><div class="comment-head"><span class="anon-mask" style="width:26px;height:26px;border-radius:8px">${ico("mask", 15)}</span><b>Persona anónima</b><span class="muted">· ${dateLabel(a.createdAt)}</span></div><p>${esc(a.text)}</p></div>`).join("")}</div>` : noContent("Todavía no hay respuestas", "Podés inaugurar esta conversación.", "message")}
  ${unlocked && q.blindMode ? `<div class="answered-info" style="margin-top:16px">${ico("check", 16)} ¡Listo! Tu respuesta desbloqueó la conversación.</div>` : ""}
  <div class="discussion-head"><h3>${unlocked ? "Sumá otra respuesta" : "Respondé para participar"}</h3></div>
  ${me().id ? `<form class="reply-composer" data-form="anon-answer"><input type="hidden" name="questionId" value="${q.id}"/><textarea name="text" maxlength="3000" required placeholder="Escribí con libertad. Tu nombre NO va a aparecer..."></textarea><div class="reply-actions"><button class="btn btn-primary btn-sm" type="submit">${ico("send", 14)} Enviar anónimamente</button></div></form>` : '<button class="btn btn-primary" data-action="open-register">Iniciá sesión para responder</button>'}`;
}
export default function Screen({ id }: { id: string }) {
  return <PuntoScreen view="anonDetail" renderScreen={anonDetail} id={id} />;
}
