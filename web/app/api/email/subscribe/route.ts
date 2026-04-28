import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getResend } from "@/lib/resend";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, source = "landing" } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const validSources = [
      "landing",
      "blog",
      "scout",
      "download",
      "android-notify",
      "android-notify-postgame",
      "android-notify-blog",
      "android-notify-app-cta",
      "android-notify-success-modal",
      "android-notify-download-page",
    ];
    const safeSource = validSources.includes(source) ? source : "landing";
    const isAndroidNotify = safeSource.startsWith("android-notify");

    const { error } = await supabaseAdmin
      .from("email_subscribers")
      .upsert(
        { email: email.toLowerCase().trim(), source: safeSource },
        { onConflict: "email", ignoreDuplicates: true }
      );

    if (error) {
      console.error("[email/subscribe] DB error:", error.message);
      return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
    }

    // Send welcome email (fire and forget — don't fail the subscription if email fails)
    try {
      if (process.env.RESEND_API_KEY) {
        const subject = isAndroidNotify
          ? "We'll let you know when Android launches 📱"
          : "Welcome to Football IQ! ⚽";

        const html = isAndroidNotify
          ? `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #1a1a2e;">You're on the Android waitlist</h1>
              <p>Thanks for signing up. We'll send you one email the moment Football IQ goes live on the Play Store — no spam in between.</p>
              <p>While you wait, five of our 11 game modes are playable free in your browser:</p>
              <a href="https://football-iq.app/play" style="display: inline-block; background: #4ade80; color: #1a1a2e; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Play Free in Your Browser</a>
              <p style="color: #666; font-size: 12px; margin-top: 24px;">You received this because you joined the Android launch list at football-iq.app. <a href="https://football-iq.app/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a></p>
            </div>
          `
          : `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #1a1a2e;">Welcome to Football IQ!</h1>
              <p>Thanks for signing up. You'll get weekly updates on new game modes, features, and football trivia challenges.</p>
              <p><strong>Ready to test your football knowledge?</strong></p>
              <a href="https://football-iq.app" style="display: inline-block; background: #4ade80; color: #1a1a2e; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Play Now</a>
              <p style="color: #666; font-size: 12px; margin-top: 24px;">You received this because you signed up at football-iq.app. <a href="https://football-iq.app/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a></p>
            </div>
          `;

        await getResend().emails.send({
          from: "Football IQ <noreply@football-iq.app>",
          to: email.toLowerCase().trim(),
          subject,
          html,
        });
      }
    } catch (emailErr) {
      console.error("[email/subscribe] Resend error:", emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[email/subscribe] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
