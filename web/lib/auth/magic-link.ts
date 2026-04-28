/**
 * Magic-link auth helper.
 *
 * Triggered (not blocking) at the day-3 streak moment in PostGameCTA. The
 * user enters their email; we send a Supabase magic link that lands on
 * /auth/callback to exchange for a session. After that their streak +
 * profile sync across devices.
 *
 * No UI is exposed in this scaffolding pass — that ships in Week 3 alongside
 * the prompt component.
 */

import { createClient } from "@/lib/supabase/client";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.football-iq.app";

export interface SendMagicLinkResult {
  ok: boolean;
  error?: string;
}

/**
 * Sends a magic-link email to the given address.
 *
 * `source` segments where the prompt was triggered (`day-3-streak`,
 * `profile-page`, etc.) so we can attribute conversion later. It is stored
 * via Supabase's `data` field on the auth user.
 *
 * `redirectPath` is where the user lands after clicking the email link —
 * defaults to /play so they resume gameplay immediately.
 */
export async function sendMagicLink(
  email: string,
  source: string,
  redirectPath: string = "/play",
): Promise<SendMagicLinkResult> {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address" };
  }

  const supabase = createClient();

  const safeRedirect = redirectPath.startsWith("/") ? redirectPath : "/play";
  const emailRedirectTo = `${SITE_URL}/auth/callback?next=${encodeURIComponent(safeRedirect)}`;

  const { error } = await supabase.auth.signInWithOtp({
    email: email.toLowerCase().trim(),
    options: {
      emailRedirectTo,
      shouldCreateUser: true,
      data: { signup_source: source },
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
