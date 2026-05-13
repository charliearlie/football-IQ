import { describe, it, expect, vi } from "vitest";
import { upgradeToPremium } from "@/lib/billing/upgradeToPremium";

describe("upgradeToPremium", () => {
  it("returns ok when the RPC flips is_premium to true", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ id: "user-1", is_premium: true }],
      error: null,
    });
    const supabase = { rpc } as unknown as Parameters<typeof upgradeToPremium>[0];

    const result = await upgradeToPremium(supabase);

    expect(rpc).toHaveBeenCalledWith("upgrade_to_premium");
    expect(result).toEqual({ ok: true, error: null });
  });

  it("accepts a single-row response (not an array)", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: { id: "user-1", is_premium: true },
      error: null,
    });
    const supabase = { rpc } as unknown as Parameters<typeof upgradeToPremium>[0];

    const result = await upgradeToPremium(supabase);

    expect(result.ok).toBe(true);
  });

  it("reports an error when the RPC returns an error object", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "rls denied" },
    });
    const supabase = { rpc } as unknown as Parameters<typeof upgradeToPremium>[0];

    const result = await upgradeToPremium(supabase);

    expect(result).toEqual({ ok: false, error: "rls denied" });
  });

  it("reports an error when the returned profile is not premium", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ id: "user-1", is_premium: false }],
      error: null,
    });
    const supabase = { rpc } as unknown as Parameters<typeof upgradeToPremium>[0];

    const result = await upgradeToPremium(supabase);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/non-premium/);
  });
});
