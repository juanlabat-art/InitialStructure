"use client";

import type { AdminSection, AdminSelection } from "../demo-types";
import PuntoScreen from "../punto-screen";
import type { AdminEntry } from "../shared/api";
import { backToHome } from "../shared/chrome";
import { noContent } from "../shared/posts";
import { esc, siteRoleLabels } from "../shared/presentation";
import type { ScreenContext } from "../shared/state";
import { adminHref, adminSections } from "./sections";

function renderEntry(entry: AdminEntry, section: AdminSection) {
  const { id, texto, detalle, resumen, reportes, oculto, rol_sitio } = entry;
  if (section === "subadmins" || section === "usuarios") {
    const label = siteRoleLabels[rol_sitio ?? "usuario"];
    const action = section === "usuarios"
      ? `<button type="button" class="btn btn-sm btn-danger" data-action="admin-delete-user" data-id="${id}" data-username="${esc(texto)}">Eliminar cuenta</button>`
      : `<button type="button" class="btn btn-sm btn-outline" data-action="admin-role" data-id="${id}" data-value="${rol_sitio === "subadmin" ? "usuario" : "subadmin"}">${rol_sitio === "subadmin" ? "Quitar rol de subadmin" : "Nombrar subadmin"}</button>`;
    return `<li class="admin-entry">
      <div><strong>@${esc(texto)}</strong> <span class="tag">${label}</span></div>
      ${rol_sitio === "admin" ? "" : action}
    </li>`;
  }

  return `<li class="admin-entry">
    <div>
      ${section === "posts" && !oculto ? `<button type="button" class="admin-post-title" data-action="open-post" data-id="${id}">${esc(texto)}</button>` : `<strong>${esc(texto)}</strong>`}
      ${detalle ? `<small>${esc(detalle)}</small>` : ""}
      ${resumen ? `<p>${esc(resumen)}</p>` : ""}
      ${reportes !== null ? `<small>${reportes} ${reportes === 1 ? "reporte" : "reportes"}${oculto ? " · Oculta" : ""}</small>` : ""}
    </div>
    <div class="admin-entry-actions">
      ${oculto !== null ? `<button class="btn btn-sm btn-outline" data-action="admin-visibility" data-id="${id}" data-value="${oculto ? "mostrar" : "ocultar"}">${oculto ? "Mostrar" : "Ocultar"}</button>` : ""}
      <button class="btn btn-sm btn-danger" data-action="admin-delete" data-id="${id}">Eliminar</button>
    </div>
  </li>`;
}

function renderAdmin(context: ScreenContext) {
  const { adminSelection: selection, adminEntries, adminError, siteRole } = context;
  if (!selection || (siteRole !== "admin" && siteRole !== "subadmin")) {
    return backToHome() + noContent("Acceso restringido", "Esta sección es para el equipo de administración.", "shield");
  }
  const { section, page, query } = selection;
  const userSearch = section === "subadmins" || section === "usuarios";
  const sections = (Object.keys(adminSections) as AdminSection[]).filter(
    (key) => siteRole === "admin" || (key !== "subadmins" && key !== "usuarios"),
  );
  return `${backToHome()}
  <div class="page-head"><h1>Administración</h1><span class="tag">${siteRole === "admin" ? "Administrador general" : "Subadmin"}</span></div>
  <section class="card admin-panel">
    <nav class="admin-tabs" aria-label="Secciones de administración">${sections.map((key) =>
      `<a class="btn btn-sm ${key === section ? "btn-primary" : "btn-outline"}" href="${esc(adminHref(key))}"${key === section ? ' aria-current="page"' : ""}>${adminSections[key]}</a>`,
    ).join("")}</nav>
    ${!sections.includes(section)
      ? '<p class="notice">Esta sección es exclusiva del administrador general.</p>'
      : `${section === "subadmins" ? '<p class="form-help">Nombrar a un subadmin le suma 10 puntos de karma. Quitarle el rol revierte ese bono.</p>' : ""}
      <form class="admin-search" action="/admin" method="get">
        <input type="hidden" name="seccion" value="${section}" />
        <input class="search-input" name="q" maxlength="100" value="${esc(query)}" aria-label="${userSearch ? "Buscar por nombre de usuario" : "Buscar contenido"}" placeholder="${userSearch ? "Nombre de usuario" : "Buscar contenido"}" />
        <button class="btn btn-sm btn-outline" type="submit">Buscar</button>
      </form>
      ${adminError ? `<p class="notice" role="status">${esc(adminError)}</p>` : adminEntries?.entradas.length
        ? `<ul class="admin-entries">${adminEntries.entradas.map((entry) => renderEntry(entry, section)).join("")}</ul>`
        : '<p class="muted">No se encontraron resultados.</p>'}
      <div class="admin-pagination">
        ${page > 1 ? `<a class="btn btn-sm btn-outline" href="${esc(adminHref(section, page - 1, query))}">Anterior</a>` : ""}
        ${adminEntries?.siguiente ? `<a class="btn btn-sm btn-outline" href="${esc(adminHref(section, page + 1, query))}">Siguiente</a>` : ""}
      </div>`}
  </section>`;
}

export default function Screen({ selection }: { selection: AdminSelection }) {
  return <PuntoScreen view="admin" adminSelection={selection} renderScreen={renderAdmin} />;
}
