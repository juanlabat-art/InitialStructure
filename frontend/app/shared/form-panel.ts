import { esc } from "./presentation";

export function formPanel(title: string, body: string, small = false) {
  return `<section class="modal route-form ${small ? "small" : ""}"><div class="modal-header"><h1>${esc(title)}</h1></div><div class="modal-body">${body}</div></section>`;
}
