import { NextResponse, type NextRequest } from "next/server";

/* ═══════════════════════════════════════════════════════════════
   Proxy — EUR-only currency (Next.js 16 convention)
   Sets a `user_currency` cookie so the CurrencyContext picks it up.
   ═══════════════════════════════════════════════════════════════ */

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Skip if user already has a currency cookie
  if (request.cookies.get("user_currency")) {
    return response;
  }

  // Always EUR
  response.cookies.set("user_currency", "EUR", {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: "lax",
  });

  return response;
}

export const config = {
  matcher: [
    // Run on all page requests, skip static assets, images, favicon, and API routes
    "/((?!_next/static|_next/image|favicon\\.ico|api/).*)",
  ],
};
