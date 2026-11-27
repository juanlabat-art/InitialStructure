import { esc, ico } from "./presentation";

const SESSION_START_STORAGE = "vozero_session_start";

interface StoredSession {
  userId: string;
  start: number;
}

function readStored(): StoredSession | null {
  try {
    const value = JSON.parse(localStorage.getItem(SESSION_START_STORAGE) ?? "null");
    if (value && typeof value.userId === "string" && Number.isFinite(value.start)) return value;
  } catch {
    // Sin almacenamiento el contador arranca desde que se abrió la página.
  }
  return null;
}

let memorySession: StoredSession | null = null;

/** Registra el inicio de la sesión (llamar al iniciar sesión o crear la cuenta). */
export function startSessionTimer(userId: string) {
  const session = { userId, start: Date.now() };
  memorySession = session;
  try {
    localStorage.setItem(SESSION_START_STORAGE, JSON.stringify(memorySession));
  } catch {
    // El contador sigue funcionando en memoria.
  }
  return session.start;
}

export function clearSessionTimer() {
  memorySession = null;
  try {
    localStorage.removeItem(SESSION_START_STORAGE);
  } catch {
    // Nada que limpiar.
  }
}

/** Devuelve el inicio de la sesión del usuario; si no hay uno guardado para él, empieza ahora. */
export function sessionStart(userId: string) {
  const stored = readStored() ?? memorySession;
  if (stored?.userId === userId) return stored.start;
  return startSessionTimer(userId);
}

/** 0–59 min → "12 min"; hasta 24 h → "3 h 5 min"; desde 24 h → "2 d 4 h". */
export function sessionDurationLabel(start: number, now = Date.now()) {
  const totalMinutes = Math.max(0, Math.floor((now - start) / 60000));
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  if (totalHours < 1) return `${totalMinutes} min`;
  if (totalHours < 24) return `${totalHours} h ${minutes} min`;
  return `${Math.floor(totalHours / 24)} d ${totalHours % 24} h`;
}

export function sessionTimer(userId: string) {
  if (!userId) return "";
  const start = sessionStart(userId);
  const label = sessionDurationLabel(start);
  return `<span class="session-timer" role="timer" data-session-start="${start}" title="Tiempo de sesión activa" aria-label="Sesión activa desde hace ${esc(label)}">${ico("clock", 15)}<span data-session-label>${esc(label)}</span></span>`;
}

/** Actualiza los contadores visibles sin volver a renderizar la pantalla. */
export function updateSessionTimers(root: ParentNode, now = Date.now()) {
  for (const timer of root.querySelectorAll<HTMLElement>("[data-session-start]")) {
    const label = sessionDurationLabel(Number(timer.dataset.sessionStart), now);
    const text = timer.querySelector("[data-session-label]");
    if (text && text.textContent !== label) {
      text.textContent = label;
      timer.setAttribute("aria-label", `Sesión activa desde hace ${label}`);
    }
  }
}
