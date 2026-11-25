"use client";

import PuntoScreen from "../../../punto-screen";
import { formPanel } from "../../../shared/form-panel";
import { noContent } from "../../../shared/posts";
import { esc } from "../../../shared/presentation";
import type { ScreenContext } from "../../../shared/state";

function editPost(context: ScreenContext) {
  const p = context.post(context.ui.postId);
  if (!p || p.hidden || p.deleted || p.authorId !== context.me().id)
    return noContent("Edición no disponible", "Solo podés editar tus propias publicaciones.");

  return formPanel(
    "Editar publicación",
    `<form data-form="edit-post">
      <div class="form-field">
        <label for="edit-post-title">Título</label>
        <input id="edit-post-title" name="title" maxlength="300" value="${esc(p.title)}" required />
      </div>
      <div class="form-field">
        <label for="edit-post-content">Contenido</label>
        <textarea id="edit-post-content" name="content" maxlength="10000">${esc(p.content)}</textarea>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline" data-action="close-modal">Cancelar</button>
        <button type="submit" class="btn btn-primary">Guardar cambios</button>
      </div>
    </form>`,
  );
}

export default function Screen({ id }: { id: string }) {
  return <PuntoScreen view="editPost" renderScreen={editPost} id={id} />;
}
