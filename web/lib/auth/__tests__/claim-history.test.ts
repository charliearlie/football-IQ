import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  claimPlayHistory,
  getStoredAnonUserId,
  hasAlreadyClaimed,
  markClaimComplete,
  rememberAnonUserId,
} from "@/lib/auth/claim-history";

describe("claim-history localStorage helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("remembers and reads the anon user id", () => {
    expect(getStoredAnonUserId()).toBeNull();
    rememberAnonUserId("abc-123");
    expect(getStoredAnonUserId()).toBe("abc-123");
  });

  it("marks claim complete and clears the anon id", () => {
    rememberAnonUserId("abc-123");
    expect(hasAlreadyClaimed()).toBe(false);

    markClaimComplete();
    expect(hasAlreadyClaimed()).toBe(true);
    expect(getStoredAnonUserId()).toBeNull();
  });
});

describe("claimPlayHistory", () => {
  it("calls the RPC with the anonymous id and returns parsed counts", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ moved_count: 4, skipped_count: 1 }],
      error: null,
    });
    const supabase = { rpc } as unknown as Parameters<typeof claimPlayHistory>[0];

    const result = await claimPlayHistory(supabase, "anon-uuid");

    expect(rpc).toHaveBeenCalledWith("claim_play_history", {
      p_anonymous_id: "anon-uuid",
    });
    expect(result).toEqual({ moved: 4, skipped: 1 });
  });

  it("throws when the RPC returns an error", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "not anonymous" },
    });
    const supabase = { rpc } as unknown as Parameters<typeof claimPlayHistory>[0];

    await expect(claimPlayHistory(supabase, "x")).rejects.toMatchObject({
      message: "not anonymous",
    });
  });
});
