import type { User } from "../demo-types";
import { esc, userProfileLink } from "./presentation";

export function matchUsers(users: User[], query: string) {
  const term = query.trim().toLowerCase().replace(/^(?:@|u\/)/, "");
  return users
    .filter((user) => user.profileVisible && user.username.toLowerCase().includes(term))
    .sort((a, b) => Number(b.username === term) - Number(a.username === term) || a.username.localeCompare(b.username, "es-AR"));
}

export function userList(users: User[]) {
  return `<ul class="card user-list">${users.map((user) => `<li>
    ${userProfileLink(user, { avatar: true })}
    <small>${esc(user.karmaBase)} karma</small>
  </li>`).join("")}</ul>`;
}

export function userDirectoryHref(query: string, page = 1) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("pagina", String(page));
  return params.size ? `/users?${params}` : "/users";
}
