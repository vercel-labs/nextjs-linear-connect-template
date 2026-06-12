export function Footer() {
  return (
    <footer className="mt-10 text-center text-xs text-neutral-600">
      Powered by{" "}
      <a
        className="underline decoration-neutral-700 underline-offset-2 hover:text-neutral-400"
        href="https://vercel.com/docs/connect"
        target="_blank"
        rel="noreferrer"
      >
        Vercel Connect
      </a>{" "}
      ·{" "}
      <a
        className="underline decoration-neutral-700 underline-offset-2 hover:text-neutral-400"
        href="https://linear.app/developers"
        target="_blank"
        rel="noreferrer"
      >
        Linear API
      </a>
    </footer>
  );
}
