import Screen from "./screen";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  return <Screen query={Array.isArray(q) ? q[0] : q} />;
}
