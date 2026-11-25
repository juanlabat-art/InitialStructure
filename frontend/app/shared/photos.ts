import type { PhotoTarget } from "../demo-types";
import { esc } from "./presentation";

export const maxPhotoBytes = 5 * 1024 * 1024;

export function photoEditor(target: PhotoTarget, id: string, hasPhoto: boolean) {
  const label = target === "usuarios" ? "Foto de perfil" : "Foto de la comunidad";
  return `<form class="photo-editor" data-form="photo" data-target="${target}" data-id="${esc(id)}">
    <div class="form-field">
      <label for="photo-input">${label}</label>
      <input id="photo-input" name="photo" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="photo-help" required />
      <p class="form-help" id="photo-help">JPG, PNG o WebP de hasta 5 MB. Se recorta al centro en formato cuadrado.</p>
    </div>
    <div class="photo-actions">
      <button type="submit" class="btn btn-primary">Guardar foto</button>
      ${hasPhoto ? '<button type="submit" class="btn btn-outline" value="remove" formnovalidate>Quitar foto</button>' : ""}
    </div>
  </form>`;
}
