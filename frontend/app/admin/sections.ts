import type { AdminSection } from "../demo-types";

export const adminSections: Record<AdminSection, string> = {
  posts: "Publicaciones",
  comentarios: "Comentarios",
  preguntas: "Preguntas anónimas",
  respuestas: "Respuestas anónimas",
  subadmins: "Subadmins",
  usuarios: "Usuarios",
};

export function adminHref(section: AdminSection, page = 1, query = "") {
  const params = new URLSearchParams({ seccion: section, pagina: String(page) });
  if (query) params.set("q", query);
  return "/admin?" + params;
}
