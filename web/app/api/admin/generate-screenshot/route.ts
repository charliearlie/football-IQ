import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { ensureAdmin } from '@/lib/supabase/server';
import { postProcessScreenshot } from '@/lib/screenshots/post-process';
import { buildPrompt } from '@/lib/screenshots/prompts';
import type { GenerateResponse } from '@/lib/screenshots/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_BASE64_LENGTH = 14_000_000; // ~10MB file

const RequestSchema = z.object({
  screenshotBase64: z.string().min(1).max(MAX_BASE64_LENGTH),
  mimeType: z.enum(['image/png', 'image/jpeg']),
  style: z.enum(['hero', 'feature', 'game-mode', 'social-proof', 'progression']),
  headline: z.string().min(1).max(100),
  subtitle: z.string().max(200).optional(),
});

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

export async function POST(request: NextRequest) {
  try {
    await ensureAdmin();

    if (!ai) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500 },
      );
    }

    const parsed = RequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { screenshotBase64, mimeType, style, headline, subtitle } = parsed.data;
    const startTime = Date.now();
    const prompt = buildPrompt(style, headline, subtitle);

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: screenshotBase64,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      return NextResponse.json(
        { error: 'No response from Gemini' },
        { status: 500 },
      );
    }

    const imagePart = parts.find(
      (p) => p.inlineData?.mimeType?.startsWith('image/'),
    );

    if (!imagePart?.inlineData?.data) {
      const textPart = parts.find((p) => p.text);
      return NextResponse.json(
        {
          error: 'Gemini did not return an image',
          feedback: textPart?.text ?? 'No feedback provided',
        },
        { status: 422 },
      );
    }

    const finalBuffer = await postProcessScreenshot(imagePart.inlineData.data);
    const generationTimeMs = Date.now() - startTime;

    const result: GenerateResponse = {
      imageBase64: finalBuffer.toString('base64'),
      generationTimeMs,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[generate-screenshot] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Screenshot generation failed' },
      { status: 500 },
    );
  }
}
