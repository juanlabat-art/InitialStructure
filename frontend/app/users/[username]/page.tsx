import Screen from "../../myprofile/screen";

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <Screen username={username} />;
}
