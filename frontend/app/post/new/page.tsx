import Screen from "./screen";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ community?: string }>;
}) {
  const { community } = await searchParams;
  return <Screen id={community} />;
}
