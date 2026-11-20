import type { Community, User } from "../demo-types";

export const esc = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      (
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }) as Record<string, string>
      )[char] ?? char,
  );
const initials = (value: string) =>
  String(value)
    .split(/[._\s-]/)
    .filter(Boolean)
    .map((x) => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
export const count = (num: number) =>
  num > 999 ? `${(num / 1000).toFixed(1)}k` : String(num);
export const dateLabel = (iso: string) => {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
  if (h < 1) return "hace unos minutos";
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return d < 30
    ? `hace ${d} d`
    : new Date(iso).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
      });
};
const icons: Record<string, string> = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  compass:
    '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.3 5.7L8 16l2.3-5.7z"/>',
  shield:
    '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>',
  mask: '<path d="M4 6c5-3 11-3 16 0v7c0 5-4 8-8 9-4-1-8-4-8-9V6Z"/><path d="M8 11h2m4 0h2m-6 5c1.5 1 2.5 1 4 0"/>',
  bookmark: '<path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-4-7 4z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  back: '<path d="m12 19-7-7 7-7M5 12h14"/>',
  arrowUp: '<path d="m5 13 7-7 7 7M12 6v13"/>',
  arrowDown: '<path d="m5 11 7 7 7-7M12 18V5"/>',
  message:
    '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8A8.5 8.5 0 0 1 12.5 20a8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  flame:
    '<path d="M12 22c4.4 0 7-3 7-7 0-3-2-5-3-6 0 3-2 4-2 4 0-5-2-8-5-11 0 4-4 6-4 13 0 4 2.6 7 7 7z"/>',
  dots: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  lock: '<rect x="4" y="10" width="16" height="12" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  unlock:
    '<rect x="4" y="10" width="16" height="12" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0"/>',
  eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff:
    '<path d="m3 3 18 18M10.6 6.1A12 12 0 0 1 12 6c6.5 0 10 6 10 6a14 14 0 0 1-3.1 3.5M6 6.9C3.4 8.7 2 12 2 12s3.5 6 10 6c1.1 0 2.1-.2 3-.4"/>',
  heart:
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7 7 0 0 0 0 9.1L12 22l8.9-8.3a7 7 0 0 0-.1-9.1Z"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  flag: '<path d="M5 22V4m0 0c4-3 6 3 10 0 1.6-1 2.6-1.2 4-1v12c-4-2-7 2-10 0-1.4-1-2.5-1-4 0"/>',
  settings:
    '<path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1"/><circle cx="12" cy="12" r="4"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 8-3 8-3 10h18c0-2-3-2-3-10M10 22h4"/>',
  trending: '<path d="m3 17 6-6 4 4 7-7M14 8h6v6"/>',
  sparkles:
    '<path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5ZM19 17l.7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7Z"/>',
  trash: '<path d="M4 7h16M10 3h4M6 7l1 14h10l1-14M10 11v6m4-6v6"/>',
  edit: '<path d="M4 17v3h3l12-12-3-3L4 17Z"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 11v5m0-8h.01"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="m8 14-2 8 6-3 6 3-2-8"/>',
};
export const ico = (name: string, size = 18) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.info}</svg>`;

export const av = (u: User | undefined, size = "") =>
  `<span class="avatar ${esc(u?.color || "")} ${size}" title="${esc(u?.username || "usuario")}">${esc(initials(u?.username || "u"))}</span>`;
export const cicon = (c: Community | undefined, size = 28) =>
  `<span class="community-icon" style="background:${esc(c?.bg || "#ebeaff")};${size > 30 ? `width:${size}px;height:${size}px;font-size:${size * 0.43}px` : ""}">${c?.emoji || "💬"}</span>`;
