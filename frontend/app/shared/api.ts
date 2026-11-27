import type { AdminContentSection, AdminSelection, Comment, Community, ForumNotification, PhotoTarget, Post, SiteRole, User } from "../demo-types";
import { isAnonymousCategory, type AnonymousCategory } from "./anonymous-categories";

interface ApiUser {
  id: number;
  username: string;
  email?: string;
  karma: number;
  fecha_registro: string;
  ultima_conexion?: string | null;
  descripcion?: string | null;
  rol_sitio?: SiteRole;
  foto_version?: string | null;
  perfil_visible?: boolean;
}
interface ApiCommunity {
  banner_version?: string | null;
  id: number;
  nombre: string;
  descripcion: string | null;
  creador_id: number;
  es_nsfw: boolean;
  fecha_creacion: string;
  foto_version?: string | null;
}
interface ApiNotification {
  comentario_id: number | null;
  post_id: number;
  autor: string | null;
  titulo: string;
  es_respuesta: boolean;
  leida: boolean;
  fecha: string;
}
interface ApiPost {
  id: number;
  comunidad_id: number;
  autor_id: number;
  titulo: string;
  contenido: string | null;
  fecha: string;
  fecha_edicion?: string | null;
  oculto: boolean;
  eliminado?: boolean;
  es_pregunta: boolean;
  opinar_primero: boolean;
  foto_version?: string | null;
}
interface ApiComment {
  id: number;
  post_id: number;
  autor_id: number;
  comentario_padre_id: number | null;
  texto: string;
  fecha: string;
  fecha_edicion?: string | null;
  eliminado: boolean;
}
interface ApiForum {
  usuario_actual_id: number | null;
  rol_sitio_actual?: SiteRole | null;
  votos_para_proximo_karma: number | null;
  membresias: {
    usuario_id: number;
    comunidad_id: number;
    rol: "miembro" | "moderador";
    fecha_union: string;
    fijada?: boolean;
  }[];
  guardados: { usuario_id: number; post_id: number; fecha: string }[];
  reportes: {
    id: number;
    usuario_id: number;
    post_id: number;
    motivo: string;
    fecha: string;
  }[];
  comentarios_reportados?: number[];
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
    categoria?: AnonymousCategory;
    propia?: boolean;
  }[];
  respuestas: {
    id: number;
    pregunta_id: number;
    texto: string;
    fecha: string;
    propia?: boolean;
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

export interface AdminEntry {
  id: number;
  texto: string;
  detalle: string | null;
  resumen: string | null;
  reportes: number | null;
  oculto: boolean | null;
  rol_sitio: SiteRole | null;
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch("/api" + path, { cache: "no-store", ...init });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    const detail = error?.detail;
    throw new ApiError(
      response.status,
      typeof detail === "string"
        ? detail
        : response.status === 422
          ? "Revisá los datos del formulario."
          : "No se pudo completar la operación con la API.",
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

function encodeImage(image: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(new Error("No pudimos leer la imagen."));
    reader.readAsDataURL(image);
  });
}

function mutation<T>(path: string, method: string, body?: object, signal?: AbortSignal) {
  return request<T>(path, {
    method,
    signal,
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
    lastConnectedAt: row.ultima_conexion ? date(row.ultima_conexion) : undefined,
    color: "mint",
    description: row.descripcion ?? "",
    siteRole: row.rol_sitio ?? "usuario",
    photoVersion: row.foto_version ?? undefined,
    profileVisible: row.perfil_visible ?? false,
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
    bg: "var(--selected)",
    createdAt: date(row.fecha_creacion),
    bannerVersion: row.banner_version ?? undefined,
    photoVersion: row.foto_version ?? undefined,
  };
}

function post(row: ApiPost): Post {
  return {
    id: String(row.id),
    communityId: String(row.comunidad_id),
    authorId: String(row.autor_id),
    title: row.titulo,
    content: row.contenido ?? "",
    photoVersion: row.foto_version ?? undefined,
    createdAt: date(row.fecha),
    editedAt: row.fecha_edicion ? date(row.fecha_edicion) : undefined,
    hidden: row.oculto,
    deleted: row.eliminado ?? false,
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
    editedAt: row.fecha_edicion ? date(row.fecha_edicion) : undefined,
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
        pinned: row.fijada ?? false,
      })),
      saved: data.guardados.map(relation),
      reports: data.reportes.map((row) => ({
        ...relation(row),
        id: String(row.id),
        reason: row.motivo,
      })),
      reportedComments: (data.comentarios_reportados ?? []).map(String),
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
        category: isAnonymousCategory(row.categoria) ? row.categoria : "general",
        mine: row.propia ?? false,
        title: row.titulo,
        content: row.contenido,
        blindMode: row.opinar_primero,
        createdAt: date(row.fecha),
      })),
      anonymousAnswers: data.respuestas.map((row) => ({
        id: String(row.id),
        questionId: String(row.pregunta_id),
        text: row.texto,
        mine: row.propia ?? false,
        createdAt: date(row.fecha),
      })),
      anonymousUnlocks: data.preguntas_desbloqueadas.map((id) => ({
        questionId: String(id),
        sessionToken: session,
      })),
      commentVotes,
      currentUserId: data.usuario_actual_id === null ? "" : String(data.usuario_actual_id),
      siteRole: data.rol_sitio_actual ?? null,
      votesToNextKarma: data.votos_para_proximo_karma ?? null,
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
  async notifications(signal: AbortSignal): Promise<ForumNotification[]> {
    const rows = await request<ApiNotification[]>("/foro/notificaciones", { signal });
    return rows.map((row) => ({
      commentId: row.comentario_id,
      postId: String(row.post_id),
      author: row.autor ?? "",
      title: row.titulo,
      isReply: row.es_respuesta,
      read: row.leida,
      createdAt: date(row.fecha),
    }));
  },
  readNotifications(entries: ForumNotification[], signal: AbortSignal) {
    return mutation<void>("/foro/notificaciones", "PUT", {
      comentario_ids: entries.flatMap((entry) => entry.commentId === null ? [] : [entry.commentId]),
      post_ids: entries.flatMap((entry) => entry.commentId === null ? [apiId(entry.postId)] : []),
    }, signal);
  },
  login(username: string, clave: string) {
    return mutation<ApiUser>("/usuario/sesion", "POST", { username, clave });
  },
  logout() {
    return mutation<void>("/usuario/sesion", "DELETE");
  },
  updateProfile(description: string) {
    return mutation<ApiUser>("/usuario/perfil", "PUT", { descripcion: description });
  },
  updateCommunity(id: string, description: string) {
    return mutation<ApiCommunity>("/comunidad/" + apiId(id), "PUT", { descripcion: description });
  },
  savePhoto(target: PhotoTarget, id: string, photo: File) {
    return request<void>(`/fotos/${target}/${apiId(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      body: photo,
    });
  },
  removePhoto(target: PhotoTarget, id: string) {
    return mutation<void>(`/fotos/${target}/${apiId(id)}`, "DELETE");
  },
  deleteAccount(id: string) {
    return deleteConfirmed("/usuario/cuenta", { usuario_id: apiId(id) });
  },
  adminEntries(selection: AdminSelection, signal: AbortSignal) {
    const params = new URLSearchParams({
      seccion: selection.section, pagina: String(selection.page), q: selection.query,
    });
    return request<{ entradas: AdminEntry[]; siguiente: boolean }>("/admin/entradas?" + params, { signal });
  },
  changeSiteRole(id: string, role: "usuario" | "subadmin") {
    return mutation<void>(`/admin/usuarios/${apiId(id)}/rol`, "PUT", { rol: role });
  },
  setAdminPostVisibility(id: string, hidden: boolean) {
    return mutation<void>(`/admin/posts/${apiId(id)}/visibilidad`, "PUT", { oculto: hidden });
  },
  deleteAdminEntry(section: AdminContentSection, id: string) {
    return deleteConfirmed(`/admin/${section}/${apiId(id)}`);
  },
  deleteAdminUser(id: string) {
    return deleteConfirmed(`/admin/usuarios/${apiId(id)}`);
  },
  karma(userId: string, signal: AbortSignal) {
    return request<{
      karma: number;
      karma_por_nombramientos: number;
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
    banner?: File,
  ) {
    const encodedBanner = banner && await encodeImage(banner);
    return community(
      await mutation<ApiCommunity>("/comunidad", "POST", {
        creador_id: apiId(actor),
        nombre: name,
        descripcion: description,
        es_nsfw: nsfw,
        banner: encodedBanner,
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
    requestId: string,
    image?: File,
  ) {
    return post(
      await mutation<ApiPost>("/post", "POST", {
        autor_id: apiId(actor),
        comunidad_id: apiId(communityId),
        titulo: title,
        contenido: content,
        es_pregunta: isQuestion,
        opinar_primero: blindMode,
        solicitud_id: requestId,
        imagen: image && await encodeImage(image),
      }),
    );
  },
  updatePost(postId: string, title: string, content: string) {
    return mutation<ApiPost>("/post/" + apiId(postId), "PUT", {
      titulo: title,
      contenido: content,
    });
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
  updateComment(id: string, text: string) {
    return mutation<ApiComment>("/comentario/" + apiId(id), "PUT", { texto: text });
  },
  reportComment(id: string, reason: string) {
    return mutation<void>(`/comentario/${apiId(id)}/reportes`, "POST", { motivo: reason });
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
    action: "unir" | "salir" | "promover" | "banear" | "fijar" | "desfijar",
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
  async createQuestion(title: string, content: string, blindMode: boolean, category: AnonymousCategory) {
    const question = await mutation<{ id: number }>("/foro/anonimo", "POST", {
      titulo: title,
      contenido: content,
      opinar_primero: blindMode,
      categoria: category,
    });
    return String(question.id);
  },
  answerQuestion(id: string, text: string) {
    return mutation<void>("/foro/anonimo/" + apiId(id) + "/respuestas", "POST", { texto: text });
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
