"use client";
import PuntoScreen from "../../../../../punto-screen";
import { formPanel } from "../../../../../shared/form-panel";
import { noContent } from "../../../../../shared/posts";
import { esc } from "../../../../../shared/presentation";
import type { ScreenContext } from "../../../../../shared/state";

function banModal(context: ScreenContext) {
  const { user, ui } = context;
  const u = user(ui.banUserId);
  const { communityId } = ui;
  if (
    !u ||
    !context.isMod(communityId) ||
    context.membership(u.id, communityId)?.role !== "miembro"
  )
    return noContent("Acceso restringido", "No podés banear a este usuario.");
  return formPanel(
    "Banear usuario",
    `<p style="font-size:12px;color:#7e8397">Se quitará a <b>u/${esc(u?.username)}</b> de esta comunidad. No podrá volver a unirse, comentar ni publicar mientras dure el ban.</p><form data-form="ban"><div class="form-field"><label>Motivo *</label><textarea name="reason" required placeholder="Explicá el motivo de la sanción..."></textarea></div><div class="form-field"><label>Fecha de finalización (opcional)</label><input name="until" type="date" min="${new Date(Date.now() + 86400000).toISOString().slice(0, 10)}"/><p class="form-help">Dejalo vacío para que el ban sea permanente.</p></div><div class="modal-footer"><button type="button" class="btn btn-outline" data-action="close-modal">Cancelar</button><button type="submit" class="btn btn-danger">Confirmar ban</button></div></form>`,
    true,
  );
}

export default function Screen({
  id,
  targetId,
}: {
  id: string;
  targetId: string;
}) {
  return (
    <PuntoScreen
      view="ban"
      renderScreen={banModal}
      id={id}
      targetId={targetId}
    />
  );
}
