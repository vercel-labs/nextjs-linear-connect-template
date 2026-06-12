import { startAuthorization } from "@vercel/connect";
import { NextResponse } from "next/server";
import { CONNECTOR, getSubject, SCOPES } from "@/lib/connect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Kicks off the Vercel Connect consent flow for Linear.
 *
 * `startAuthorization` returns a hosted consent URL. We redirect the browser
 * to it; after the user authorizes, Vercel completes the OAuth handshake
 * server-side and sends the browser back to `callbackUrl`. There is no
 * app-side "complete" step — the next `getToken` for this subject just works.
 */
export async function GET(request: Request) {
  try {
    const callbackUrl = new URL("/?connected=1", request.url).toString();

    const { url } = await startAuthorization(
      CONNECTOR,
      { subject: getSubject(), scopes: SCOPES },
      { callbackUrl },
    );

    return NextResponse.redirect(url);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Authorization could not start.";
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
