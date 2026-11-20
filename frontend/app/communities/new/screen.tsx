"use client";
import PuntoScreen from "../../punto-screen";
import { formPanel } from "../../shared/form-panel";
import { ico } from "../../shared/presentation";
import type { ScreenContext } from "../../shared/state";

function communityModal(context: ScreenContext) {
  const { totalKarma, me } = context;
  const karma = totalKarma(me().id);
  if (!me().id)
    return formPanel(
      "Crear comunidad",
      '<button class="btn btn-primary" data-action="open-register">Crear una cuenta</button>',
    );
  const requiredKarma = karma < 10;
  return formPanel(
    "Crear comunidad",
    `${requiredKarma ? `<div class="notice">Necesitás al menos <b>10 puntos de karma</b> para crear una comunidad. Hoy tenés ${karma}. Participá y conseguí votos positivos primero.</div>` : ""}<form data-form="community"><div class="form-field"><label>Nombre de la comunidad *</label><input name="name" placeholder="ej: librosypelis" minlength="3" maxlength="21" pattern="[A-Za-z0-9_]{3,21}" required ${requiredKarma ? "disabled" : ""}/><p class="form-help">Entre 3 y 21 caracteres, sin espacios.</p></div><div class="form-field"><label>Descripción *</label><textarea name="description" maxlength="400" required placeholder="¿De qué se habla en tu comunidad?" ${requiredKarma ? "disabled" : ""}></textarea></div><label class="switch-field"><input name="nsfw" type="checkbox" ${requiredKarma ? "disabled" : ""}/><span><b>Contenido +18 / NSFW</b><small>Marcá esta opción solamente si corresponde.</small></span></label><div class="hint-box">${ico("shield", 17)} Al crearla, automáticamente vas a ser miembro y moderador.</div><div class="modal-footer"><button class="btn btn-outline" type="button" data-action="close-modal">Cancelar</button><button class="btn btn-primary" type="submit" ${requiredKarma ? "disabled" : ""}>Crear comunidad</button></div></form>`,
    true,
  );
}

export default function Screen() {
  return <PuntoScreen view="newCommunity" renderScreen={communityModal} />;
}
