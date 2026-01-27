/**
 * Scout Report OG Image API Route
 *
 * Generates dynamic Open Graph images for shared Scout Reports.
 * URL: /api/og/scout?userId=abc123
 *
 * Returns a 1200x630 PNG image that social platforms use for link previews.
 */

import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { ScoutingReportOGCard } from '@/components/og/ScoutingReportOGCard';

export const runtime = 'edge';

// OG image dimensions (standard for social platforms)
const WIDTH = 1200;
const HEIGHT = 630;

// Cache for 1 hour, revalidate in background
export const revalidate = 3600;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new Response('Missing userId parameter', { status: 400 });
    }

    // Fetch user data from Supabase
    const supabase = await createAdminClient();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('display_name, total_iq')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      console.error('Error fetching profile for OG image:', error);
      // Return a fallback card for missing users
      return new ImageResponse(
        <ScoutingReportOGCard
          displayName="Football Fan"
          totalIQ={0}
        />,
        { width: WIDTH, height: HEIGHT }
      );
    }

    return new ImageResponse(
      <ScoutingReportOGCard
        displayName={profile.display_name || 'Football Fan'}
        totalIQ={profile.total_iq || 0}
      />,
      {
        width: WIDTH,
        height: HEIGHT,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
