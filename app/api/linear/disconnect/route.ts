import { revokeToken } from "@vercel/connect";
import { NextResponse } from "next/server";
import { CONNECTOR, getSubject } from "@/lib/connect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Revoke the Linear grant for the current subject. Best-effort: revocation can
 * fail (e.g. already revoked) and we don't want that to block returning home.
 * After this, the next page load shows the "Authorize Linear" screen again.
 */
export async function POST(request: Request) {
  try {
    await revokeToken(CONNECTOR, { subject: getSubject() });
  } catch {
    // Ignore — surface the disconnected state regardless.
  }
  // 303 so the browser follows with a GET.
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
