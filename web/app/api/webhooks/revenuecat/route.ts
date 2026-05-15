/**
 * RevenueCat -> Supabase webhook.
 *
 * Keeps the `profiles.is_premium` mirror in sync with RevenueCat, which is the
 * source of truth for entitlement. The client-side `upgrade_to_premium` RPC is
 * only an instant fast-path at purchase time; this webhook is the durable
 * backstop that also catches renewals, expirations, refunds and revocations
 * that the client never sees.
 *
 * Independent of the NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED flag — even with the web
 * paywall dark, mobile subscription changes must keep the shared mirror correct.
 *
 * Setup: in the RevenueCat dashboard create a webhook integration pointing at
 * `/api/webhooks/revenuecat` and set its Authorization header value to exactly
 * the `REVENUECAT_WEBHOOK_SECRET` env var.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Events that mean the user currently has (or regained) entitlement. */
const GRANT_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "PRODUCT_CHANGE",
  "NON_RENEWING_PURCHASE",
]);

/** Events that mean entitlement has actually ended. */
const REVOKE_EVENTS = new Set(["EXPIRATION", "REFUND", "SUBSCRIPTION_PAUSED"]);

interface RevenueCatEvent {
  type?: string;
  app_user_id?: string;
  aliases?: string[];
}

/**
 * RevenueCat's App User ID is the Supabase auth uid (see RevenueCatProvider).
 * Resolve it from `app_user_id`, falling back through `aliases`. Anonymous ids
 * (`$RCAnonymousID:...`) and any non-UUID value are not one of our accounts.
 */
function resolveUserId(event: RevenueCatEvent): string | null {
  const candidates = [event.app_user_id, ...(event.aliases ?? [])];
  for (const candidate of candidates) {
    if (candidate && UUID_RE.test(candidate)) return candidate;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const expected = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!expected || request.headers.get("authorization") !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let event: RevenueCatEvent;
  try {
    const body = (await request.json()) as { event?: RevenueCatEvent };
    event = body?.event ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = event.type ?? "UNKNOWN";

  // RC dashboard "send test event" ping — acknowledge so the operator sees a
  // green check when wiring the integration.
  if (type === "TEST") {
    return NextResponse.json({ ok: true, handled: "TEST" });
  }

  const grant = GRANT_EVENTS.has(type);
  const revoke = REVOKE_EVENTS.has(type);

  // CANCELLATION = auto-renew turned off but still entitled until period end;
  // BILLING_ISSUE = grace period. Neither changes access now — RC fires
  // EXPIRATION when the entitlement actually ends. Everything else is
  // unhandled. Ack with 200 so RC doesn't retry.
  if (!grant && !revoke) {
    console.log(`[rc-webhook] no-op for event type: ${type}`);
    return NextResponse.json({ ok: true, handled: "noop", type });
  }

  const userId = resolveUserId(event);
  if (!userId) {
    console.warn(`[rc-webhook] ${type}: no UUID app_user_id, skipping`);
    return NextResponse.json({ ok: true, handled: "skipped", type });
  }

  const supabase = await createAdminClient();
  const { error } = await (
    supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => PromiseLike<{ error: { message: string } | null }>
  )("set_premium_status", { p_user_id: userId, p_premium: grant });

  if (error) {
    // Return 500 so RC retries — a transient DB error must not drop the event.
    console.error(
      `[rc-webhook] ${type} set_premium_status failed: ${error.message}`,
    );
    return NextResponse.json(
      { error: "Failed to update premium status" },
      { status: 500 },
    );
  }

  console.log(`[rc-webhook] ${type}: set is_premium=${grant} for ${userId}`);
  return NextResponse.json({
    ok: true,
    handled: grant ? "granted" : "revoked",
    type,
  });
}
