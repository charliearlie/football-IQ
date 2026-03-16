import { NextRequest } from "next/server";

/**
 * Validates Bearer token auth for API routes.
 * Returns null if valid, or a 401 Response if invalid.
 */
export function validateApiAuth(request: NextRequest): Response | null {
  const authHeader = request.headers.get("authorization");
  const apiSecret = process.env.API_SECRET;

  if (!apiSecret || authHeader !== `Bearer ${apiSecret}`) {
    return Response.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  return null;
}
