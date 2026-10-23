import type { ReactNode } from "react";

import { requireAdmin } from "@/lib/auth";

interface RequireAdminProps {
  children: ReactNode;
}

/**
 * Gates the admin subtree behind a valid admin session.
 *
 * `requireAdmin()` reads the auth cookie, so it is request-time data: under
 * Cache Components it has to run inside a `<Suspense>` boundary. Keeping the
 * guard in its own component means the whole admin area — shell and pages —
 * renders behind one gate instead of each page doing its own check.
 *
 * The guard awaits before returning its children, so React does not start
 * rendering the pages until the session is confirmed. That ordering matters:
 * Next.js renders the page segment concurrently with the layout, so a check
 * that runs next to the pages would let their data stream out before the
 * guard rejected the request.
 */
export async function RequireAdmin({ children }: RequireAdminProps) {
  await requireAdmin();

  return children;
}
