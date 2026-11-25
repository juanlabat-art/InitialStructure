"use client";

import PuntoScreen from "../../punto-screen";
import { formPanel } from "../../shared/form-panel";
import { photoEditor } from "../../shared/photos";
import { esc, ico } from "../../shared/presentation";
import type { ScreenContext } from "../../shared/state";

function editProfile({ me }: ScreenContext) {
  const user = me();
  return formPanel("Editar perfil", `
    <a class="back" href="/myprofile">${ico("back", 15)} Volver al perfil</a>
    <form data-form="profile">
      <div class="form-field"><label for="profile-description">Descripción</label><textarea id="profile-description" name="description" maxlength="300" rows="3">${esc(user.description)}</textarea></div>
      <button type="submit" class="btn btn-primary">Guardar cambios</button>
    </form>
    ${photoEditor("usuarios", user.id, Boolean(user.photoVersion))}
  `, true);
}

export default function Page() {
  return <PuntoScreen view="profile" renderScreen={editProfile} />;
}
