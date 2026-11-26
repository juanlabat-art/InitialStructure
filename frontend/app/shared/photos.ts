import type { PhotoTarget } from "../demo-types";
import { esc } from "./presentation";

export const maxPhotoBytes = 5 * 1024 * 1024;

export function photoEditor(target: PhotoTarget, id: string, hasPhoto: boolean) {
  const isProfile = target === "usuarios";
  const label = isProfile ? "Foto de perfil" : "Foto de la comunidad";
  return `<form class="photo-editor" data-form="photo" data-target="${target}" data-id="${esc(id)}">
    <div class="form-field">
      <label for="photo-input">${label}</label>
      <input id="photo-input" name="photo" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="photo-help" required />
      <p class="form-help" id="photo-help">JPG, PNG o WebP de hasta 5 MB. Se recorta al centro en formato cuadrado.</p>
    </div>
    ${isProfile ? `<figure class="photo-preview" hidden>
      <figcaption>Vista previa</figcaption>
      <img alt="Recorte de la foto de perfil seleccionada" width="112" height="112" />
    </figure>` : ""}
    <div class="photo-actions">
      <button type="submit" class="btn btn-primary"${isProfile ? " disabled" : ""}>Guardar foto</button>
      ${hasPhoto ? '<button type="submit" class="btn btn-outline" value="remove" formnovalidate>Quitar foto</button>' : ""}
    </div>
  </form>`;
}

export function mountPhotoPreview(form: HTMLFormElement) {
  const input = form.querySelector<HTMLInputElement>("#photo-input");
  const preview = form.querySelector<HTMLElement>(".photo-preview");
  const image = preview?.querySelector("img");
  const save = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!input || !preview || !image || !save) return;

  let previewUrl: string | undefined;

  const resetPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = undefined;
    image.removeAttribute("src");
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
    preview.hidden = false;
    save.disabled = false;
  };

  input.addEventListener("change", showPreview);
  return () => {
    input.removeEventListener("change", showPreview);
    resetPreview();
  };
}
