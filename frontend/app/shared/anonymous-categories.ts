export const anonymousCategories = {
  general: "General",
  peliculas: "Películas",
  juegos: "Juegos",
  estudio: "Estudio",
  tecnologia: "Tecnología",
  convivencia: "Convivencia",
  mayores18: "+18",
  otros: "Otros",
} as const;

export type AnonymousCategory = keyof typeof anonymousCategories;

export function isAnonymousCategory(value: unknown): value is AnonymousCategory {
  return typeof value === "string" && Object.hasOwn(anonymousCategories, value);
}

export function anonymousCategoryOptions(selected?: AnonymousCategory) {
  return Object.entries(anonymousCategories).map(([value, label]) =>
    `<option value="${value}"${value === selected ? " selected" : ""}>${label}</option>`,
  ).join("");
}
