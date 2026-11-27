import type { User } from "../demo-types";
import { av, displayKarma, esc, relativeTime, userProfileHref } from "./presentation";

export function matchUsers(users: User[], query: string) {
  const term = query.trim().toLowerCase().replace(/^(?:@|u\/)/, "");
  return users
    .filter((user) => user.profileVisible && user.username.toLowerCase().includes(term))
    .sort((a, b) => Number(b.username === term) - Number(a.username === term) || a.username.localeCompare(b.username, "es-AR"));
}

export function userList(users: User[], { showLastConnection = false } = {}) {
  return `<ul class="card user-list">${users.map((user) => `<li>
    <a class="user-list-row" href="${userProfileHref(user.username)}">
      <span class="user-list-name">${av(user, "small")}<span>${esc(user.username)}</span></span>
      <span class="user-list-details">
        <small>${displayKarma(user.karmaBase, user.siteRole)} karma</small>
        ${showLastConnection ? `<small>Última conexión: ${user.lastConnectedAt ? relativeTime(user.lastConnectedAt) : "Sin registro"}</small>` : ""}
      </span>
    </a>
  </li>`).join("")}</ul>`;
}

export function userDirectoryHref(query: string, page = 1) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("pagina", String(page));
  return params.size ? `/users?${params}` : "/users";
}
