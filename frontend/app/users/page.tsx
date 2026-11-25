import Screen from "./screen";

export default async function Page({ searchParams }: {
  searchParams: Promise<{ q?: string | string[]; pagina?: string | string[] }>;
}) {
  const { q, pagina } = await searchParams;
  const page = typeof pagina === "string" ? Number(pagina) : 1;
  return <Screen
    query={typeof q === "string" ? q.trim().slice(0, 100) : ""}
    page={Number.isSafeInteger(page) && page > 0 ? page : 1}
  />;
}
