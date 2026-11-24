import type { Comment, Community, Post, User } from "../demo-types";

interface ApiUser {
  id: number;
  username: string;
  email?: string;
  karma: number;
  fecha_registro: string;
}
interface ApiCommunity {
  id: number;
  nombre: string;
  descripcion: string | null;
  creador_id: number;
  es_nsfw: boolean;
  fecha_creacion: string;
}
interface ApiPost {
  id: number;
  comunidad_id: number;
  autor_id: number;
  titulo: string;
  contenido: string | null;
  fecha: string;
  oculto: boolean;
  es_pregunta: boolean;
  opinar_primero: boolean;
}
interface ApiComment {
  id: number;
  post_id: number;
  autor_id: number;
  comentario_padre_id: number | null;
  texto: string;
  fecha: string;
  eliminado: boolean;
}
interface ApiForum {
  usuario_actual_id: number | null;
  membresias: {
    usuario_id: number;
    comunidad_id: number;
    rol: "miembro" | "moderador";
    fecha_union: string;
  }[];
  guardados: { usuario_id: number; post_id: number; fecha: string }[];
  reportes: {
    id: number;
    usuario_id: number;
    post_id: number;
    motivo: string;
    fecha: string;
  }[];
  baneos: {
    id: number;
    comunidad_id: number;
    usuario_id: number;
    moderador_id: number;
    motivo: string | null;
    fecha_hasta: string | null;
  }[];
  votos_comentarios: {
    usuario_id: number;
    comentario_id: number;
    valor: number;
    fecha: string;
  }[];
  puntajes_comentarios: Record<string, number>;
  preguntas: {
    id: number;
    titulo: string;
    contenido: string;
    opinar_primero: boolean;
    fecha: string;
  }[];
  respuestas: {
    id: number;
    pregunta_id: number;
    texto: string;
    fecha: string;
  }[];
  preguntas_desbloqueadas: number[];
  usuarios: ApiUser[];
  comunidades: ApiCommunity[];
  posts: ApiPost[];
  comentarios: ApiComment[];
  puntajes: Record<string, number>;
  votos: {
    usuario_id: number;
    post_id: number;
    valor: number;
    fecha: string;
  }[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch("/api" + path, { cache: "no-store", ...init });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    const detail = error?.detail;
    throw Error(
      typeof detail === "string"
        ? detail
        : response.status === 422
          ? "Revisá los datos del formulario."
          : "No se pudo completar la operación con la API.",
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

function mutation<T>(path: string, method: string, body?: object) {
  return request<T>(path, {
    method,
    ...(body && {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
  });
}

function deleteConfirmed(path: string, fields?: object) {
  return mutation<void>("/eliminar", "DELETE", {
    path,
    ...fields,
    confirmacion_inicial: true,
    confirmacion_final: true,
  });
}

function apiId(id: string) {
  if (!/^[1-9]\d*$/.test(id))
    throw Error("Elegí una cuenta registrada para realizar esta acción.");
  return Number(id);
}

function date(value: string) {
  return /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : value + "Z";
}

function user(row: ApiUser): User {
  return {
    id: String(row.id),
    username: row.username,
    email: row.email ?? "",
    karmaBase: row.karma,
    joinedAt: date(row.fecha_registro),
    color: "mint",
  };
}

function community(row: ApiCommunity): Community {
  return {
    id: String(row.id),
    name: row.nombre,
    description: row.descripcion ?? "",
    creatorId: String(row.creador_id),
    nsfw: row.es_nsfw,
    baseMembers: 0,
    emoji: "💬",
    bg: "var(--selected)",
    createdAt: date(row.fecha_creacion),
  };
}

function post(row: ApiPost): Post {
  return {
    id: String(row.id),
    communityId: String(row.comunidad_id),
    authorId: String(row.autor_id),
    title: row.titulo,
    content: row.contenido ?? "",
    createdAt: date(row.fecha),
    hidden: row.oculto,
    baseScore: 0,
    isQuestion: row.es_pregunta,
    blindMode: row.opinar_primero,
  };
}

function comment(row: ApiComment): Comment {
  return {
    id: String(row.id),
    postId: String(row.post_id),
    authorId: String(row.autor_id),
    parentId:
      row.comentario_padre_id === null ? null : String(row.comentario_padre_id),
    text: row.texto,
    createdAt: date(row.fecha),
    deleted: row.eliminado,
    baseScore: 0,
  };
}

export const forumApi = {
  async load(session: string, signal: AbortSignal) {
    const data = await request<ApiForum>("/foro", {
      signal,
      headers: { "X-Punto-Session": session },
    });
    const votes = data.votos.map((vote) => ({
      userId: String(vote.usuario_id),
      postId: String(vote.post_id),
      value: vote.valor,
      createdAt: date(vote.fecha),
    }));
    const commentVotes = data.votos_comentarios.map((vote) => ({
      userId: String(vote.usuario_id),
      commentId: String(vote.comentario_id),
      value: vote.valor,
      createdAt: date(vote.fecha),
    }));
    const relation = (row: ApiForum["guardados"][number]) => ({
      userId: String(row.usuario_id),
      postId: String(row.post_id),
      createdAt: date(row.fecha),
    });
    return {
      memberships: data.membresias.map((row) => ({
        userId: String(row.usuario_id),
        communityId: String(row.comunidad_id),
        role: row.rol,
        joinedAt: date(row.fecha_union),
      })),
      saved: data.guardados.map(relation),
      reports: data.reportes.map((row) => ({
        ...relation(row),
        id: String(row.id),
        reason: row.motivo,
      })),
      bans: data.baneos.map((row) => ({
        id: String(row.id),
        userId: String(row.usuario_id),
        moderatorId: String(row.moderador_id),
        communityId: String(row.comunidad_id),
        reason: row.motivo ?? "",
        until: row.fecha_hasta ? date(row.fecha_hasta) : null,
      })),
      anonymousQuestions: data.preguntas.map((row) => ({
        id: String(row.id),
        title: row.titulo,
        content: row.contenido,
        blindMode: row.opinar_primero,
        createdAt: date(row.fecha),
      })),
      anonymousAnswers: data.respuestas.map((row) => ({
        id: String(row.id),
        questionId: String(row.pregunta_id),
        text: row.texto,
        createdAt: date(row.fecha),
      })),
      anonymousUnlocks: data.preguntas_desbloqueadas.map((id) => ({
        questionId: String(id),
        sessionToken: session,
      })),
      commentVotes,
      currentUserId: data.usuario_actual_id === null ? "" : String(data.usuario_actual_id),
      users: data.usuarios.map(user),
      communities: data.comunidades.map(community),
      posts: data.posts.map((row) => ({
        ...post(row),
        baseScore:
          (data.puntajes[row.id] ?? 0) -
          (votes.find((vote) => vote.postId === String(row.id))?.value ?? 0),
      })),
      comments: data.comentarios.map((row) => ({
        ...comment(row),
        baseScore:
          (data.puntajes_comentarios[row.id] ?? 0) -
          (commentVotes.find((vote) => vote.commentId === String(row.id))
            ?.value ?? 0),
      })),
      postVotes: votes,
    };
  },
  async register(username: string, email: string, clave: string) {
    return user(
      await mutation<ApiUser>("/usuario", "POST", { username, email, clave }),
    );
  },
  login(username: string, clave: string) {
    return mutation<ApiUser>("/usuario/sesion", "POST", { username, clave });
  },
  logout() {
    return mutation<void>("/usuario/sesion", "DELETE");
  },
  deleteAccount(id: string) {
    return deleteConfirmed("/usuario/cuenta", { usuario_id: apiId(id) });
  },
  karma(userId: string, signal: AbortSignal) {
    return request<{
      karma: number;
      karma_posts: number;
      karma_comentarios: number;
      votos_positivos_posts: number;
      votos_positivos_comentarios: number;
    }>("/usuarios/" + apiId(userId) + "/karma", { signal });
  },
  ranking(communityId: string, signal: AbortSignal) {
    return request<{ id: number; username: string; karma: number; votos_positivos: number }[]>(
      "/comunidades/" + apiId(communityId) + "/top-usuarios", { signal },
    );
  },
  async createCommunity(
    actor: string,
    name: string,
    description: string,
    nsfw: boolean,
  ) {
    return community(
      await mutation<ApiCommunity>("/comunidad", "POST", {
        creador_id: apiId(actor),
        nombre: name,
        descripcion: description,
        es_nsfw: nsfw,
      }),
    );
  },
  async createPost(
    actor: string,
    communityId: string,
    title: string,
    content: string,
    isQuestion: boolean,
    blindMode: boolean,
  ) {
    return post(
      await mutation<ApiPost>("/post", "POST", {
        autor_id: apiId(actor),
        comunidad_id: apiId(communityId),
        titulo: title,
        contenido: content,
        es_pregunta: isQuestion,
        opinar_primero: blindMode,
      }),
    );
  },
  async createComment(
    actor: string,
    postId: string,
    parentId: string | null,
    text: string,
  ) {
    return comment(
      await mutation<ApiComment>("/comentario", "POST", {
        autor_id: apiId(actor),
        post_id: apiId(postId),
        comentario_padre_id: parentId ? apiId(parentId) : null,
        texto: text,
      }),
    );
  },
  deleteComment(id: string) {
    return deleteConfirmed("/comentario/" + apiId(id));
  },
  deletePost(id: string) {
    return deleteConfirmed("/post/" + apiId(id));
  },
  deleteCommunity(id: string) {
    return deleteConfirmed("/comunidad/" + apiId(id));
  },
  changeMembership(
    actor: string,
    community: string,
    action: "unir" | "salir" | "promover" | "banear",
    target?: string,
    reason?: string,
    until?: string | null,
  ) {
    return mutation<void>(
      "/foro/comunidades/" + apiId(community) + "/miembros",
      "PUT",
      {
        usuario_id: apiId(actor),
        accion: action,
        miembro_id: target ? apiId(target) : undefined,
        motivo: reason,
        hasta: until,
      },
    );
  },
  changePost(
    actor: string,
    post: string,
    action: "guardar" | "quitar" | "reportar" | "ocultar" | "mostrar",
    reason?: string,
  ) {
    return mutation<void>("/foro/posts/" + apiId(post), "PUT", {
      usuario_id: apiId(actor),
      accion: action,
      motivo: reason,
    });
  },
  voteComment(actor: string, comment: string, value: number) {
    const path = "/foro/comentarios/" + apiId(comment) + "/voto";
    if (value === 0) return mutation<void>("/eliminar", "DELETE", { path });
    return mutation<void>(
      "/eliminar",
      "PUT",
      { path, usuario_id: apiId(actor), valor: value },
    );
  },
  async createQuestion(title: string, content: string, blindMode: boolean) {
    const question = await mutation<{ id: number }>("/foro/anonimo", "POST", {
      titulo: title,
      contenido: content,
      opinar_primero: blindMode,
    });
    return String(question.id);
  },
  answerQuestion(id: string, session: string, text: string) {
    return request<void>("/foro/anonimo/" + apiId(id) + "/respuestas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Punto-Session": session,
      },
      body: JSON.stringify({ texto: text }),
    });
  },
  async votePost(actor: string, postId: string, value: number) {
    const post = apiId(postId);
    const user = apiId(actor);
    if (value === 0) {
      await mutation<void>("/eliminar", "DELETE", { path: `/votos-post/${post}/${user}` });
    } else {
      await mutation("/eliminar", "PUT", {
        path: "/votos-post/",
        usuario_id: user,
        post_id: post,
        valor: value,
      });
    }
  },
};
