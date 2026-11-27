import { esc, ico } from "./presentation";

/** Envuelve un input de contraseña con un botón para mostrarla u ocultarla. */
export function passwordInput(inputId: string, inputHtml: string) {
  return `<div class="password-wrap">
    ${inputHtml}
    <button type="button" class="password-toggle" data-action="toggle-password" data-target="${esc(inputId)}" aria-controls="${esc(inputId)}" aria-pressed="false" aria-label="Mostrar contraseña" title="Mostrar contraseña">${ico("eye", 18)}</button>
  </div>`;
}

export function formPanel(title: string, body: string, small = false) {
  return `<section class="modal route-form ${small ? "small" : ""}"><div class="modal-header"><h1>${esc(title)}</h1></div><div class="modal-body">${body}</div></section>`;
}
