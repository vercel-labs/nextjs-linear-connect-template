import type { ConnectTokenSubject } from "@vercel/connect";

/**
 * Vercel Connect connector UID for Linear.
 *
 * Create it once with the Vercel CLI (this opens a browser to authorize
 * Linear, then attach it to your project):
 *
 *   vercel connect create mcp.linear.app --name linear
 *   vercel connect attach oauth/linear
 */
export const CONNECTOR = process.env.CONNECTOR ?? "oauth/linear";

/**
 * Linear OAuth scopes to request. `read` is enough for this read-only demo;
 * add `write`, `issues:create`, etc. if you extend it to mutate data.
 */
export const SCOPES = ["read"];

/**
 * The id we use as the token subject. This template has no auth system, so we
 * use a single stable demo id — that keeps the Vercel Connect consent grant
 * persistent across reloads. In a real app, return your signed-in user's id
 * here (ideally a per-user value, e.g. read from a session cookie).
 */
export function getDemoUserId(): string {
  return process.env.LINEAR_DEMO_USER_ID ?? "demo-user";
}

/** The Vercel Connect token subject for the current request. */
export function getSubject(): ConnectTokenSubject {
  return { type: "user", id: getDemoUserId() };
}
