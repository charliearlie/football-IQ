/**
 * Welcome sequence cron — sends 3-step drip emails to new subscribers:
 *
 * Step 0 (Day 0):  Welcome + play challenge link (sent immediately at signup)
 * Step 1 (Day 3):  Game modes overview — "Did you know we have 11 game modes?"
 * Step 2 (Day 7):  Archive unlock pitch + referral CTA
 *
 * Schedule: 0 8 * * * (8am UTC daily)
 * Configure in vercel.json:
 *   { "path": "/api/cron/welcome-sequence", "schedule": "0 8 * * *" }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getResend } from "@/lib/resend";

export const runtime = "nodejs";
export const maxDuration = 300;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function validateCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

interface Subscriber {
  id: string;
  email: string;
  welcome_sequence_step: number;
}

function buildStep1Html(email: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a1a2e;">Did you know Football IQ has 11 game modes?</h1>
      <p>Most people only discover one or two. Here's what you might be missing:</p>
      <ul style="line-height: 2;">
        <li><strong>Career Path</strong> — guess the player from their club history</li>
        <li><strong>Transfer Guess</strong> — identify the player from transfer fees</li>
        <li><strong>Connections</strong> — find what links four players together</li>
        <li><strong>Topical Quiz</strong> — fresh questions on this week's football</li>
        <li><strong>The Grid, Timeline, Top Tens</strong> — and 4 more in the app</li>
      </ul>
      <p>New puzzles drop every day. How many can you complete today?</p>
      <a href="https://football-iq.app" style="display: inline-block; background: #4ade80; color: #1a1a2e; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Play Today's Games</a>
      <p style="color: #666; font-size: 12px; margin-top: 24px;">You received this because you signed up at football-iq.app. <a href="https://football-iq.app/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a></p>
    </div>
  `;
}

function buildStep2Html(email: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a1a2e;">Unlock the full Football IQ archive</h1>
      <p>You've been playing for a week — here's how to go deeper:</p>
      <p><strong>Premium unlocks:</strong></p>
      <ul style="line-height: 2;">
        <li>Full puzzle archive — every game ever published</li>
        <li>All 11 game modes on web and mobile</li>
        <li>Detailed stats and performance tracking</li>
      </ul>
      <p>And if you know a fellow football nerd — share Football IQ with them. The bigger the community, the better the puzzles get.</p>
      <a href="https://football-iq.app" style="display: inline-block; background: #4ade80; color: #1a1a2e; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Explore Premium</a>
      <p style="color: #666; font-size: 12px; margin-top: 24px;">You received this because you signed up at football-iq.app. <a href="https://football-iq.app/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a></p>
    </div>
  `;
}

export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  const now = new Date();
  const ago3d = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const ago7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  let totalSent = 0;
  const results: Record<string, number> = { step1: 0, step2: 0 };

  // ── Step 1 (Day 3): Game modes overview ──
  // Subscribers at step 0 who signed up 3+ days ago
  {
    const { data: subscribers, error } = await supabaseAdmin
      .from("email_subscribers")
      .select("id, email, welcome_sequence_step")
      .eq("welcome_sequence_step", 0)
      .is("unsubscribed_at", null)
      .lt("created_at", ago3d)
      .returns<Subscriber[]>();

    if (error) {
      console.error("[welcome-sequence] Step 1 query error:", error.message);
    } else if (subscribers && subscribers.length > 0) {
      for (const sub of subscribers) {
        try {
          await getResend().emails.send({
            from: "Football IQ <noreply@football-iq.app>",
            to: sub.email,
            subject: "Did you know Football IQ has 11 game modes?",
            html: buildStep1Html(sub.email),
          });

          await supabaseAdmin
            .from("email_subscribers")
            .update({ welcome_sequence_step: 1 })
            .eq("id", sub.id);

          results.step1++;
          totalSent++;
        } catch (err) {
          console.error(`[welcome-sequence] Step 1 failed for ${sub.id}:`, err);
        }
      }
    }
  }

  // ── Step 2 (Day 7): Archive unlock + referral ──
  // Subscribers at step 1 who signed up 7+ days ago
  {
    const { data: subscribers, error } = await supabaseAdmin
      .from("email_subscribers")
      .select("id, email, welcome_sequence_step")
      .eq("welcome_sequence_step", 1)
      .is("unsubscribed_at", null)
      .lt("created_at", ago7d)
      .returns<Subscriber[]>();

    if (error) {
      console.error("[welcome-sequence] Step 2 query error:", error.message);
    } else if (subscribers && subscribers.length > 0) {
      for (const sub of subscribers) {
        try {
          await getResend().emails.send({
            from: "Football IQ <noreply@football-iq.app>",
            to: sub.email,
            subject: "Unlock the full Football IQ archive",
            html: buildStep2Html(sub.email),
          });

          await supabaseAdmin
            .from("email_subscribers")
            .update({ welcome_sequence_step: 2 })
            .eq("id", sub.id);

          results.step2++;
          totalSent++;
        } catch (err) {
          console.error(`[welcome-sequence] Step 2 failed for ${sub.id}:`, err);
        }
      }
    }
  }

  return NextResponse.json({
    message: "Welcome sequence complete",
    totalSent,
    results,
  });
}
