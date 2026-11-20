import Screen from "./screen";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <Screen id={(await params).id} />;
}
