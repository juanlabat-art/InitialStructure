"use client";
import PuntoScreen from "../../../punto-screen";
import { formPanel } from "../../../shared/form-panel";
import { noContent } from "../../../shared/posts";
import { esc, ico } from "../../../shared/presentation";
import type { ScreenContext } from "../../../shared/state";

function reportModal(context: ScreenContext) {
  const { post, ui } = context;
  const p = post(ui.reportId);
  if (!p || (p.hidden && !context.isMod(p.communityId)))
    return noContent(
      "Publicación no encontrada",
      "Volvé al inicio para seguir explorando.",
    );
  return formPanel(
    "Reportar publicación",
    `<p style="color:var(--ink-secondary);line-height:1.7;font-size:12px">¿Por qué querés reportar “${esc(p?.title.slice(0, 67) || "esta publicación")}”?</p><form data-form="report"><input type="hidden" name="postId" value="${p?.id || ""}"/><div class="report-options">${["Spam o publicidad", "Acoso o discriminación", "Contenido inapropiado", "Información engañosa", "Incumple las reglas de la comunidad"].map((option, i) => `<label class="report-option"><input name="reason" value="${esc(option)}" type="radio" ${i === 0 ? "checked" : ""}/> ${esc(option)}</label>`).join("")}</div><div class="hint-box">${ico("info", 17)} Podés reportar un post una sola vez. Con 5 reportes, se oculta automáticamente.</div><div class="modal-footer"><button type="button" class="btn btn-outline" data-action="close-modal">Cancelar</button><button type="submit" class="btn btn-primary">Enviar reporte</button></div></form>`,
    true,
  );
}

export default function Screen({ id }: { id: string }) {
  return <PuntoScreen view="report" renderScreen={reportModal} id={id} />;
}
