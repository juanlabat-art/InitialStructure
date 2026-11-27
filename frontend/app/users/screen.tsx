"use client";

import { useCallback } from "react";
import PuntoScreen from "../punto-screen";
import { matchUsers, userDirectoryHref, userList } from "../shared/people";
import { esc } from "../shared/presentation";
import { noContent } from "../shared/posts";
import type { ScreenContext } from "../shared/state";

const pageSize = 10;

function users(context: ScreenContext, query: string, requestedPage: number) {
  const matches = matchUsers(context.db.users, query);
  const pages = Math.max(1, Math.ceil(matches.length / pageSize));
  const page = Math.min(requestedPage, pages);
  const list = matches.slice((page - 1) * pageSize, page * pageSize);
  return `<div class="page-head"><h1>Usuarios</h1></div>
    <form class="card user-search" action="/users" method="get" role="search" aria-label="Buscar usuarios">
      <label for="user-search">Nombre de usuario</label>
      <div><input class="search-input" id="user-search" name="q" type="search" maxlength="100" value="${esc(query)}" />
      <button class="btn btn-primary" type="submit">Buscar</button></div>
    </form>
    ${list.length ? userList(list, { showLastConnection: true }) : noContent("No encontramos usuarios", "Probá con otro nombre de usuario.", "search")}
    ${pages > 1 ? `<nav class="user-pagination" aria-label="Páginas de usuarios">
      ${page > 1 ? `<a class="btn btn-sm btn-outline" href="${esc(userDirectoryHref(query, page - 1))}">Anterior</a>` : ""}
      <span>Página ${page} de ${pages}</span>
      ${page < pages ? `<a class="btn btn-sm btn-outline" href="${esc(userDirectoryHref(query, page + 1))}">Siguiente</a>` : ""}
    </nav>` : ""}`;
}

export default function Screen({ query, page }: { query: string; page: number }) {
  const render = useCallback((context: ScreenContext) => users(context, query, page), [query, page]);
  return <PuntoScreen view="users" renderScreen={render} />;
}
