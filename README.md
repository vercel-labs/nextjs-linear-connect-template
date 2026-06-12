# Next.js × Linear — Vercel Connect template

A sample Next.js app that talks to **Linear** using **[Vercel Connect](https://vercel.com/docs/connect)** for credentials. Instead of storing a long-lived Linear API key, the app asks Vercel Connect for a **short-lived, scoped Linear token at request time**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fnextjs-linear-connect-template&connect=%5B%7B%22type%22%3A%22linear%22%2C%22env%22%3A%22CONNECTOR%22%7D%5D)

Clicking **Deploy** clones this repo, walks you through creating a Linear connector, and writes its UID into the `CONNECTOR` env var. After it deploys, open the app and click **Authorize Linear** to grant access.

When Linear hasn't been authorized yet, the app shows an **"Authorize Linear"** button. After consent, it renders a small dashboard built from the Linear GraphQL API:

- **Due soon / Overdue** — open issues due in the next 14 days (works on every workspace).
- **SLA at risk** — issues that are breached / at high or medium SLA risk. _Linear SLAs require the Business plan and per-team configuration, so this panel shows an empty state if SLA isn't set up._
- **Assigned to me** — your active issues.
- **Teams** — the teams in your workspace.

## How it works

```
Browser ──▶ Next.js (server)
                │  getTokenResponse("oauth/linear", { subject:{ type:"user", id }, scopes:["read"] })
                ▼
          Vercel Connect ──▶ Linear OAuth
                │  short-lived Linear token
                ▼
          api.linear.app/graphql  (Authorization: Bearer <token>)
```

- **`lib/linear.ts`** — `getLinearConnection()` exchanges the deployment's Vercel OIDC token for a Linear token. If the user hasn't authorized, it returns `needs_auth`; the UI then links to `/api/linear/authorize`.
- **`app/api/linear/authorize/route.ts`** — calls `startAuthorization()` and redirects the browser to the hosted consent screen. Vercel completes the OAuth handshake server-side, then redirects back to `/?connected=1`. There is **no app-side callback step** — the next token request just works.
- **`app/api/linear/disconnect/route.ts`** — `revokeToken()` tears down the grant.

No Linear secrets ever live in the app or its environment variables.

## Setup

**Prerequisites:** [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`), Node ≥ 24, and a Linear workspace you can authorize.

1. **Link a Vercel project** (issues the OIDC token the SDK authenticates with):

   ```bash
   vercel link
   ```

2. **Create the Linear connector** (opens a browser to authorize Linear), then attach it to the project:

   ```bash
   vercel connect create linear            # or: vercel connect create mcp.linear.app --name linear
   vercel connect list                     # note the UID it was given
   vercel connect attach <connector-uid>
   ```

   **The connector UID varies** — a managed Linear connector looks like `linear/yellow-house`, a Custom OAuth one like `oauth/linear`. Whatever yours is, set it as `CONNECTOR` in `.env.local` (step 3). If `CONNECTOR` doesn't match a connector linked to the project, the app shows a "connector not found" hint with the fix.

3. **Pull env vars** (writes `VERCEL_OIDC_TOKEN` into `.env.local`):

   ```bash
   vercel env pull
   ```

   The OIDC token is short-lived — re-run `vercel env pull` if you see auth errors during local dev.

4. **Install and run:**

   ```bash
   pnpm install
   pnpm dev
   ```

   Open <http://localhost:3000>, click **Authorize Linear**, approve, and you're in.

## Configuration

Copy `.env.local.example` for reference. Vars:

| Variable             | Default       | Purpose                                                                                  |
| -------------------- | ------------- | ---------------------------------------------------------------------------------------- |
| `CONNECTOR`          | `oauth/linear`| Vercel Connect connector UID for Linear.                                                 |
| `LINEAR_DEMO_USER_ID`| `demo-user`   | Subject id for the user-scoped token. See note below.                                    |
| `VERCEL_OIDC_TOKEN`  | _(auto)_      | Added by `vercel env pull` / injected on Vercel. The SDK uses it to call Vercel Connect. |

> **Note on the demo user id:** this template has no auth system, so it uses a single stable `LINEAR_DEMO_USER_ID` as the token subject. That keeps the consent grant persistent across reloads. In a real app, replace it with your signed-in user's id (`getSubject()` in `lib/connect.ts`) so each user authorizes Linear for themselves.

## Deploy

Push to a repo and import it on Vercel, or:

```bash
vercel deploy
```

On Vercel, the OIDC token is injected automatically — no `vercel env pull` needed in production. Make sure the connector is attached to the deployed project's environment (`vercel connect attach oauth/linear`).

## Extending it

- **Write data:** add scopes (`write`, `issues:create`) in `lib/connect.ts` and re-authorize, then send GraphQL mutations through `linearGraphQL()`.
- **More views:** the dashboard query in `lib/linear.ts` uses aliased `issues(...)` lists — add another alias with a different [Linear filter](https://linear.app/developers/filtering) (e.g. by `cycle`, `project`, or `label`).
- **Per-user auth:** wire `getDemoUserId()` to your session.

Built with `@vercel/connect`. See the [Vercel Connect docs](https://vercel.com/docs/connect) and the [Linear API docs](https://linear.app/developers).
