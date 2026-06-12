import { CONNECTOR } from "@/lib/connect";
import { Footer } from "./footer";

const SETUP_STEPS = [
  "vercel link",
  "vercel connect create mcp.linear.app --name linear",
  "vercel connect attach <connector-uid>",
  "vercel env pull",
];

const CONNECTOR_STEPS = [
  "vercel connect list   # find your connector's UID",
  "# then set it in .env.local (and restart `pnpm dev`):",
  "CONNECTOR=<your-connector-uid>",
];

export function SetupHint({
  message,
  kind = "generic",
  apiError,
}: {
  message: string;
  kind?: "connector" | "generic";
  apiError?: boolean;
}) {
  const connectorIssue = kind === "connector";

  const title = apiError
    ? "Connected, but the Linear API call failed"
    : connectorIssue
      ? "Connector not found for this project"
      : "A bit of setup is needed";

  const steps = connectorIssue ? CONNECTOR_STEPS : SETUP_STEPS;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-16">
      <div className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 shadow-2xl">
        <h1 className="text-xl font-semibold text-amber-300">{title}</h1>
        <p className="mt-2 break-words text-sm text-neutral-400">{message}</p>

        {apiError ? (
          <p className="mt-4 text-sm text-neutral-400">
            The token was issued, but Linear rejected the request. Confirm the
            connector was authorized with the{" "}
            <code className="text-neutral-200">read</code> scope, then reload.
          </p>
        ) : (
          <>
            {connectorIssue ? (
              <p className="mt-6 text-sm text-neutral-300">
                The app is looking for connector{" "}
                <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-neutral-100">
                  {CONNECTOR}
                </code>
                , but it isn&apos;t linked to this project. Connector UIDs vary
                (e.g. <code className="text-neutral-200">linear/yellow-house</code>
                ), so point <code className="text-neutral-200">CONNECTOR</code> at
                yours:
              </p>
            ) : (
              <p className="mt-6 text-sm text-neutral-300">
                Run these from the project directory, then reload:
              </p>
            )}

            <ol className="mt-3 space-y-2">
              {steps.map((step, i) => (
                <li
                  key={step}
                  className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-950/60 px-3 py-2"
                >
                  <span className="w-3 text-xs text-neutral-600">
                    {step.startsWith("#") ? "" : i + 1}
                  </span>
                  <code className="text-sm text-neutral-200">{step}</code>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}
