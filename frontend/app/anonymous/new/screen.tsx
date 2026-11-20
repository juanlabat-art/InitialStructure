"use client";
import PuntoScreen from "../../punto-screen";
import { formPanel } from "../../shared/form-panel";
import { ico } from "../../shared/presentation";
import type { ScreenContext } from "../../shared/state";

function anonymousModal({ me }: ScreenContext) {
  if (!me().id) {
    return formPanel(
      "Pregunta anónima",
      '<button class="btn btn-primary" data-action="open-register">Iniciá sesión para publicar</button>',
    );
  }
  return formPanel(
    "Pregunta anónima",
    `<div class="hint-box">${ico("shield", 19)}<span>Tu usuario <b>no se mostrará</b> y esta pregunta <b>no aparecerá en tu perfil</b>. Las respuestas también serán anónimas.</span></div><form data-form="anonymous"><div class="form-field"><label>Tu pregunta *</label><input name="title" minlength="3" maxlength="300" required placeholder="¿Qué te gustaría preguntar?"/></div><div class="form-field"><label>Un poco de contexto (opcional)</label><textarea name="content" maxlength="5000" placeholder="Dá más detalles sin compartir datos personales..."></textarea></div><label class="switch-field"><input type="checkbox" name="blindMode" checked/><span><b>${ico("eyeOff", 16)} &nbsp; Opiná primero</b><small>Quien entre no verá ninguna respuesta hasta haber compartido la suya.</small></span></label><div class="modal-footer"><button type="button" class="btn btn-outline" data-action="close-modal">Cancelar</button><button type="submit" class="btn btn-primary">${ico("mask", 16)} Publicar anónimamente</button></div></form>`,
  );
}

export default function Screen() {
  return <PuntoScreen view="newAnonymous" renderScreen={anonymousModal} />;
}
