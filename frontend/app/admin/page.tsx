import type { AdminSection } from "../demo-types";
import { adminSections } from "./sections";
import Screen from "./screen";

export default async function Page({ searchParams }: {
  searchParams: Promise<{ seccion?: string; pagina?: string; q?: string }>;
}) {
  const params = await searchParams;
  const section = (Object.keys(adminSections) as AdminSection[]).find((key) => key === params.seccion) ?? "posts";
  const page = Number(params.pagina);
  return <Screen selection={{
    section,
    page: Number.isInteger(page) && page >= 1 && page <= 100_000 ? page : 1,
    query: typeof params.q === "string" ? params.q.trim().slice(0, 100) : "",
  }} />;
}
