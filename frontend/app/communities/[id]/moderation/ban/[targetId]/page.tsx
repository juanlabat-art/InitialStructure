import Screen from "./screen";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string; targetId: string }>;
}) {
  return <Screen {...await params} />;
}
