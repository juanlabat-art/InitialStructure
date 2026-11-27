import type { PhotoTarget } from "../demo-types";
import { esc } from "./presentation";

export const maxPhotoBytes = 5 * 1024 * 1024;

export function photoEditor(target: PhotoTarget, id: string, hasPhoto: boolean) {
  const isProfile = target === "usuarios";
  const isBanner = target === "banners";
  const label = isBanner ? "Foto del banner" : isProfile ? "Foto de perfil" : "Foto de la comunidad";
  const inputId = isBanner ? "banner-input" : "photo-input";
  const helpId = isBanner ? "banner-help" : "photo-help";
  return `<form class="photo-editor" data-form="photo" data-target="${target}" data-id="${esc(id)}">
    <div class="form-field">
      <label for="${inputId}">${label}</label>
      <input id="${inputId}" name="photo" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="${helpId}" required />
      <p class="form-help" id="${helpId}">JPG, PNG o WebP de hasta 5 MB. ${isBanner ? "Las fotos horizontales se adaptan mejor al banner." : "Se recorta al centro en formato cuadrado."}</p>
    </div>
    ${isProfile ? `<figure class="photo-preview" hidden>
      <figcaption>Vista previa</figcaption>
      <button type="button" class="profile-photo-button" data-action="open-profile-photo" aria-label="Ampliar vista previa" aria-haspopup="dialog" aria-controls="profile-photo-dialog">
        <img alt="Recorte de la foto de perfil seleccionada" width="112" height="112" />
      </button>
    </figure>` : ""}
    <div class="photo-actions">
      <button type="submit" class="btn btn-primary"${isProfile ? " disabled" : ""}>${isBanner ? "Guardar banner" : "Guardar foto"}</button>
      ${hasPhoto ? `<button type="submit" class="btn btn-outline" value="remove" formnovalidate>${isBanner ? "Quitar banner" : "Quitar foto"}</button>` : ""}
    </div>
  </form>
  ${isProfile ? `<dialog class="profile-photo-dialog photo-preview-dialog" id="profile-photo-dialog" aria-label="Vista previa ampliada">
    <form method="dialog"><button type="submit" aria-label="Cerrar vista previa" autofocus>
      <img class="profile-photo-large photo-preview-large" alt="Recorte de la foto de perfil seleccionada" />
    </button></form>
  </dialog>` : ""}`;
}

export function mountPhotoPreview(form: HTMLFormElement) {
  const input = form.querySelector<HTMLInputElement>("#photo-input");
  const preview = form.querySelector<HTMLElement>(".photo-preview");
  const image = preview?.querySelector("img");
  const dialog = form.parentElement?.querySelector<HTMLDialogElement>("#profile-photo-dialog");
  const enlarged = dialog?.querySelector("img");
  const save = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!input || !preview || !image || !dialog || !enlarged || !save) return;

  let previewUrl: string | undefined;

  const resetPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = undefined;
    dialog.close();
    image.removeAttribute("src");
    enlarged.removeAttribute("src");
    preview.hidden = true;
    save.disabled = true;
  };

  const showError = (message: string) => {
    input.setCustomValidity(message);
    input.reportValidity();
  };

  const showPreview = async () => {
    resetPreview();
    input.setCustomValidity("");
    const photo = input.files?.[0];
    if (!photo) return;
    if (photo.size > maxPhotoBytes) {
      showError("La foto tiene que pesar como máximo 5 MB.");
      return;
    }

    const url = URL.createObjectURL(photo);
    previewUrl = url;
    image.src = url;
    try {
      await image.decode();
    } catch {
      if (previewUrl === url) {
        resetPreview();
        showError("Elegí una foto válida en formato JPG, PNG o WebP.");
      }
      return;
    }
    if (previewUrl !== url) return;
    enlarged.src = url;
    preview.hidden = false;
    save.disabled = false;
  };

  input.addEventListener("change", showPreview);
  return () => {
    input.removeEventListener("change", showPreview);
    resetPreview();
  };
}
