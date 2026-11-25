import { isAnonymousCategory } from "../shared/anonymous-categories";
import Screen from "./screen";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string | string[]; q?: string | string[] }>;
}) {
  const { categoria, q } = await searchParams;
  return <Screen
    category={isAnonymousCategory(categoria) ? categoria : "general"}
    query={typeof q === "string" ? q.trim().slice(0, 100) : ""}
  />;
}
