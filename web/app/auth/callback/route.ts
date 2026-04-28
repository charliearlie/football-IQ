/**
 * Magic-link callback handler.
 *
 * Supabase appends `?code=…` to the redirect URL after the user clicks the
 * link in their email. We exchange that code for a session (sets HTTP-only
 * cookies via @supabase/ssr) and then redirect to `?next=…` (validated
 * against same-origin paths only).
 *
 * Errors land back on /play with an `auth_error` query param so the UI
 * (added in Week 3) can show a message without dumping raw error strings.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

type CookieOptions = Record<string, unknown>;
type CookieToSet = { name: string; value: string; options?: CookieOptions };

const FALLBACK_REDIRECT = "/play";

function safeNextPath(raw: string | null): string {
  if (!raw) return FALLBACK_REDIRECT;
  // Only allow same-origin relative paths starting with `/` and not protocol-relative.
  if (!raw.startsWith("/") || raw.startsWith("//")) return FALLBACK_REDIRECT;
  return raw;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(
      new URL(`${FALLBACK_REDIRECT}?auth_error=missing_code`, url.origin),
    );
  }

  const response = NextResponse.redirect(new URL(next, url.origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
    return NextResponse.redirect(
      new URL(`${FALLBACK_REDIRECT}?auth_error=exchange_failed`, url.origin),
    );
  }

  return response;
}
