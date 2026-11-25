import type { NextRequest } from "next/server";

const commentVote = /\/foro\/comentarios\/[1-9][0-9]*\/voto/;
const voteUpdatePath = new RegExp(`^(?:/votos-post/|${commentVote.source})(?![\\s\\S])`);
const deletePath = new RegExp(
  `^(?:/usuario/cuenta|/(?:comunidad|post|comentario|admin/(?:posts|comentarios|preguntas|respuestas|usuarios))/[1-9][0-9]*|/votos-post/[1-9][0-9]*/[1-9][0-9]*|${commentVote.source})(?![\\s\\S])`,
);

async function forward(request: NextRequest, method: "DELETE" | "PUT", allowedPath: RegExp) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (
    !host ||
    origin !== `${request.nextUrl.protocol}//${host}` ||
    request.headers.get("sec-fetch-site") !== "same-origin"
  ) {
    return Response.json({ detail: "La eliminación debe realizarse desde VoZero" }, { status: 403 });
  }

  const token = request.cookies.get("punto_cuenta")?.value;
  if (!token) {
    return Response.json({ detail: "Iniciá sesión para realizar esta acción" }, { status: 401 });
  }

  const input = await request.json().catch(() => null);
  const path = input?.path;
  if (
    typeof path !== "string" ||
    !allowedPath.test(path)
  ) {
    return Response.json({ detail: "Ruta de eliminación inválida" }, { status: 400 });
  }

  const secret = process.env.VOZERO_WEB_DELETE_SECRET;
  if (!secret || secret.length < 32) {
    return Response.json({ detail: "El servidor web no tiene configurada la eliminación" }, { status: 503 });
  }

  const backend = process.env.PUNTO_BACKEND_URL ?? "http://127.0.0.1:8000";
  const response = await fetch(backend.replace(/\/$/, "") + "/api" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Cookie: "punto_cuenta=" + encodeURIComponent(token),
      "X-VoZero-Web-Delete": secret,
    },
    body: JSON.stringify({
      usuario_id: input.usuario_id,
      confirmacion_inicial: input.confirmacion_inicial,
      confirmacion_final: input.confirmacion_final,
      post_id: input.post_id,
      valor: input.valor,
    }),
    redirect: "error",
  }).catch(() => null);
  if (!response) {
    return Response.json({ detail: "No se pudo conectar con la API de VoZero" }, { status: 502 });
  }

  const headers = new Headers();
  for (const name of ["content-type", "set-cookie"]) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(response.body, { status: response.status, headers });
}

export function DELETE(request: NextRequest) {
  return forward(request, "DELETE", deletePath);
}

export function PUT(request: NextRequest) {
  return forward(request, "PUT", voteUpdatePath);
}
