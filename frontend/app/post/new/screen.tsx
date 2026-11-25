"use client";
import PuntoScreen from "../../punto-screen";
import { formPanel } from "../../shared/form-panel";
import { esc, ico } from "../../shared/presentation";
import type { ScreenContext } from "../../shared/state";

function composerModal(context: ScreenContext) {
  const { db, me, banned, ui, comm } = context;
  const userId = me().id;
  if (!userId) {
    return formPanel(
      "Crear publicación",
      `<p>Iniciá sesión o creá una cuenta para publicar.</p>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline" data-action="navigate" data-view="register">Crear cuenta</button>
        <button type="button" class="btn btn-primary" data-action="open-login">Iniciar sesión</button>
      </div>`,
      true,
    );
  }
  const joined = db.memberships.filter(
    (m) => m.userId === userId && !banned(userId, m.communityId),
  );
  const current =
    joined.find((m) => m.communityId === ui.communityId)?.communityId ||
    joined[0]?.communityId;
  return formPanel(
    "Crear publicación",
    `<div class="modal-tabs"><button class="${ui.composerType === "post" ? "selected" : ""}" data-action="composer-type" data-value="post">${ico("edit", 15)} &nbsp; Post normal</button><button class="${ui.composerType === "question" ? "selected" : ""}" data-action="composer-type" data-value="question">${ico("message", 15)} &nbsp; Pregunta</button></div>
    ${
      !joined.length
        ? `<div class="notice">Primero tenés que unirte a una comunidad para poder publicar.</div><button class="btn btn-primary" data-action="navigate" data-view="communities">Explorar comunidades</button>`
        : `<form data-form="post"><div class="form-field"><label for="post-community">Comunidad</label><select id="post-community" name="communityId" required>${joined.map((m) => `<option value="${m.communityId}" ${m.communityId === current ? "selected" : ""}>${esc(comm(m.communityId)?.name ?? m.communityId)}</option>`).join("")}</select></div>
    <div class="form-field"><label for="post-title">Título *</label><input id="post-title" name="title" maxlength="300" minlength="1" required placeholder="Elegí un título que despierte curiosidad"/><p class="form-help">Hasta 300 caracteres.</p></div><div class="form-field"><label for="post-content">Contenido</label><textarea id="post-content" name="content" maxlength="10000" placeholder="Contá qué querés compartir..."></textarea></div>
    ${ui.composerType === "question" ? `<label class="switch-field"><input type="checkbox" name="blindMode"/><span>${ico("lock", 17)} &nbsp;<b style="display:inline">Activar “Opiná primero”</b><small>Los demás no podrán ver ninguna respuesta hasta que escriban la propia. Así evitás influenciar sus opiniones.</small></span></label>` : ""}
    <div class="modal-footer"><button type="button" class="btn btn-outline" data-action="close-modal">Cancelar</button><button class="btn btn-primary" type="submit">${ico("plus", 15)} Publicar</button></div></form>`
    }`,
  );
}

export default function Screen({ id }: { id?: string }) {
  return <PuntoScreen view="newPost" renderScreen={composerModal} id={id} />;
}
