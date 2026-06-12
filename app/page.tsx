import { fetchDashboard, getLinearConnection } from "@/lib/linear";
import { ConnectLinear } from "./components/connect-linear";
import { Dashboard } from "./components/dashboard";
import { SetupHint } from "./components/setup-hint";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const params = await searchParams;
  const connection = await getLinearConnection();

  if (connection.status === "needs_auth") {
    return <ConnectLinear error={params.error} />;
  }

  if (connection.status === "error") {
    return <SetupHint message={connection.message} kind={connection.kind} />;
  }

  try {
    const data = await fetchDashboard(connection.token);
    return <Dashboard data={data} justConnected={params.connected === "1"} />;
  } catch (error) {
    return (
      <SetupHint
        apiError
        kind="generic"
        message={error instanceof Error ? error.message : String(error)}
      />
    );
  }
}
