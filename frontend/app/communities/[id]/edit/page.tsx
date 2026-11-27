"use client";

import { useParams } from "next/navigation";
import PuntoScreen from "../../../punto-screen";
import { formPanel } from "../../../shared/form-panel";
import { photoEditor } from "../../../shared/photos";
import { esc, ico } from "../../../shared/presentation";
import type { ScreenContext } from "../../../shared/state";

function editCommunity({ comm, isMod, ui }: ScreenContext) {
  const community = comm(ui.communityId);
  const back = `<a class="back" href="/communities/${encodeURIComponent(ui.communityId)}">${ico("back", 15)} Volver a la comunidad</a>`;
  if (!community || !isMod(community.id)) {
    return formPanel("Editar comunidad", `${back}<p>${community ? "Necesitás ser moderador para editar esta comunidad." : "La comunidad no existe."}</p>`, true);
  }

  return formPanel("Editar comunidad", `
    ${back}
    <form data-form="community-description" data-id="${esc(community.id)}">
      <div class="form-field">
        <label for="community-description">Descripción</label>
        <textarea id="community-description" name="description" maxlength="400" rows="3">${esc(community.description)}</textarea>
      </div>
      <button type="submit" class="btn btn-primary">Guardar descripción</button>
    </form>
    ${photoEditor("comunidades", community.id, Boolean(community.photoVersion))}
    ${photoEditor("banners", community.id, Boolean(community.bannerVersion))}
  `, true);
}

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <PuntoScreen view="community" renderScreen={editCommunity} id={id} />;
}
