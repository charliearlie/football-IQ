import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

const rpcMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(async () => ({ rpc: rpcMock })),
}));

import { POST } from "@/app/api/webhooks/revenuecat/route";

const SECRET = "test-webhook-secret";
const USER_ID = "11111111-1111-1111-1111-111111111111";

function makeRequest(authHeader: string | null, body: unknown): NextRequest {
  return {
    headers: new Headers(authHeader ? { authorization: authHeader } : {}),
    json: async () => body,
  } as unknown as NextRequest;
}

function event(type: string, app_user_id: string = USER_ID) {
  return { event: { type, app_user_id } };
}

describe("RevenueCat webhook", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    rpcMock.mockResolvedValue({ error: null });
    process.env.REVENUECAT_WEBHOOK_SECRET = SECRET;
  });

  it("rejects a request with no authorization header", async () => {
    const res = await POST(makeRequest(null, event("RENEWAL")));
    expect(res.status).toBe(401);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("rejects a request with the wrong secret", async () => {
    const res = await POST(makeRequest("wrong", event("RENEWAL")));
    expect(res.status).toBe(401);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("rejects every request when the secret env var is unset", async () => {
    delete process.env.REVENUECAT_WEBHOOK_SECRET;
    const res = await POST(makeRequest(SECRET, event("RENEWAL")));
    expect(res.status).toBe(401);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("grants premium on a RENEWAL event", async () => {
    const res = await POST(makeRequest(SECRET, event("RENEWAL")));
    expect(res.status).toBe(200);
    expect(rpcMock).toHaveBeenCalledWith("set_premium_status", {
      p_user_id: USER_ID,
      p_premium: true,
    });
  });

  it("grants premium on an INITIAL_PURCHASE event", async () => {
    await POST(makeRequest(SECRET, event("INITIAL_PURCHASE")));
    expect(rpcMock).toHaveBeenCalledWith("set_premium_status", {
      p_user_id: USER_ID,
      p_premium: true,
    });
  });

  it("revokes premium on an EXPIRATION event", async () => {
    const res = await POST(makeRequest(SECRET, event("EXPIRATION")));
    expect(res.status).toBe(200);
    expect(rpcMock).toHaveBeenCalledWith("set_premium_status", {
      p_user_id: USER_ID,
      p_premium: false,
    });
  });

  it("revokes premium on a REFUND event", async () => {
    await POST(makeRequest(SECRET, event("REFUND")));
    expect(rpcMock).toHaveBeenCalledWith("set_premium_status", {
      p_user_id: USER_ID,
      p_premium: false,
    });
  });

  it("does not touch premium on a CANCELLATION event (still entitled)", async () => {
    const res = await POST(makeRequest(SECRET, event("CANCELLATION")));
    expect(res.status).toBe(200);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("does not touch premium on a BILLING_ISSUE event (grace period)", async () => {
    await POST(makeRequest(SECRET, event("BILLING_ISSUE")));
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("acknowledges a TEST event without a DB write", async () => {
    const res = await POST(makeRequest(SECRET, event("TEST")));
    expect(res.status).toBe(200);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("skips a non-UUID (anonymous) app_user_id with a 200", async () => {
    const res = await POST(
      makeRequest(SECRET, event("RENEWAL", "$RCAnonymousID:abc123")),
    );
    expect(res.status).toBe(200);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("resolves the user id from aliases when app_user_id is anonymous", async () => {
    const res = await POST(
      makeRequest(SECRET, {
        event: {
          type: "RENEWAL",
          app_user_id: "$RCAnonymousID:abc",
          aliases: ["$RCAnonymousID:abc", USER_ID],
        },
      }),
    );
    expect(res.status).toBe(200);
    expect(rpcMock).toHaveBeenCalledWith("set_premium_status", {
      p_user_id: USER_ID,
      p_premium: true,
    });
  });

  it("returns 500 when the RPC fails so RevenueCat retries", async () => {
    rpcMock.mockResolvedValue({ error: { message: "db down" } });
    const res = await POST(makeRequest(SECRET, event("RENEWAL")));
    expect(res.status).toBe(500);
  });
});
