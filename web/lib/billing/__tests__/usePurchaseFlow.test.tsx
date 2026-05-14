import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Package } from "@revenuecat/purchases-js";

// --- Test doubles -------------------------------------------------------

const captureMock = vi.fn();
const sendMagicLinkMock = vi.fn();
const purchasePackageMock = vi.fn();
const upgradeToPremiumMock = vi.fn();
const getUserMock = vi.fn();
const getCurrentAppUserIdMock = vi.fn();
const hasActiveEntitlementMock = vi.fn();
const ensureRevenueCatMock = vi.fn();

vi.mock("posthog-js/react", () => ({
  usePostHog: () => ({ capture: captureMock }),
}));

vi.mock("@/lib/auth/magic-link", () => ({
  sendMagicLink: (...args: unknown[]) => sendMagicLinkMock(...args),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: getUserMock },
  }),
}));

vi.mock("@/lib/billing/revenuecat", () => ({
  ensureRevenueCat: (...args: unknown[]) => ensureRevenueCatMock(...args),
  getCurrentAppUserId: () => getCurrentAppUserIdMock(),
  hasActiveEntitlement: (...args: unknown[]) => hasActiveEntitlementMock(...args),
}));

vi.mock("@/lib/billing/upgradeToPremium", () => ({
  upgradeToPremium: (...args: unknown[]) => upgradeToPremiumMock(...args),
}));

import {
  usePurchaseFlow,
  PURCHASE_CLAIM_STORAGE_KEY,
} from "@/lib/billing/usePurchaseFlow";

const annualPackage = { identifier: "$rc_annual" } as unknown as Package;

function defaultPurchasesMock() {
  return { purchasePackage: purchasePackageMock };
}

describe("usePurchaseFlow", () => {
  beforeEach(() => {
    captureMock.mockClear();
    sendMagicLinkMock.mockClear();
    purchasePackageMock.mockClear();
    upgradeToPremiumMock.mockClear();
    getUserMock.mockClear();
    getCurrentAppUserIdMock.mockClear();
    hasActiveEntitlementMock.mockClear();
    ensureRevenueCatMock.mockClear();
    window.localStorage.clear();

    sendMagicLinkMock.mockResolvedValue({ ok: true });
    purchasePackageMock.mockResolvedValue({ customerInfo: {} });
    upgradeToPremiumMock.mockResolvedValue({ ok: true, error: null });
    hasActiveEntitlementMock.mockReturnValue(true);
    ensureRevenueCatMock.mockResolvedValue(defaultPurchasesMock());
  });

  it("signed-in users go straight through purchasePackage + upgrade_to_premium", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-123", is_anonymous: false } },
    });
    getCurrentAppUserIdMock.mockReturnValue("user-123");

    const { result } = renderHook(() => usePurchaseFlow());

    await act(async () => {
      await result.current.buy(annualPackage, "career_path_pro_page");
    });

    expect(ensureRevenueCatMock).toHaveBeenCalledWith("user-123");
    expect(purchasePackageMock).toHaveBeenCalledWith(annualPackage);
    expect(upgradeToPremiumMock).toHaveBeenCalled();
    expect(sendMagicLinkMock).not.toHaveBeenCalled();
    expect(result.current.state.status).toBe("success");
    expect(result.current.state.claimEmailSent).toBe(false);
  });

  it("anonymous users without an email get an error and no SDK call", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const { result } = renderHook(() => usePurchaseFlow());

    await act(async () => {
      await result.current.buy(annualPackage, "test");
    });

    expect(ensureRevenueCatMock).not.toHaveBeenCalled();
    expect(purchasePackageMock).not.toHaveBeenCalled();
    expect(result.current.state.status).toBe("error");
    expect(result.current.state.error).toMatch(/enter your email/i);
  });

  it("anonymous users with an email: anonymous RC ID + magic link + localStorage", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    getCurrentAppUserIdMock.mockReturnValue("$RCAnonymousID:abc123");

    const { result } = renderHook(() => usePurchaseFlow());

    await act(async () => {
      await result.current.buy(annualPackage, "test", "Buyer@Example.com");
    });

    // RC is initialised anonymously, not with a Supabase user ID.
    expect(ensureRevenueCatMock).toHaveBeenCalledWith(null);

    // Stripe checkout fired against the anonymous ID.
    expect(purchasePackageMock).toHaveBeenCalledWith(annualPackage);

    // The Supabase mirror is NOT flipped — anonymous users don't have a row
    // until they claim via magic link.
    expect(upgradeToPremiumMock).not.toHaveBeenCalled();

    // Magic link sent with normalised email + claim path carrying the anon id.
    expect(sendMagicLinkMock).toHaveBeenCalledWith(
      "buyer@example.com",
      "post_purchase_claim",
      "/account/claim?anon=%24RCAnonymousID%3Aabc123",
    );

    // localStorage holds the fallback for the account-page re-send affordance.
    const stored = window.localStorage.getItem(PURCHASE_CLAIM_STORAGE_KEY);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toEqual({
      email: "buyer@example.com",
      anonRcId: "$RCAnonymousID:abc123",
    });

    expect(result.current.state.status).toBe("success");
    expect(result.current.state.claimEmailSent).toBe(true);
    expect(result.current.state.claimEmail).toBe("buyer@example.com");
  });

  it("captures claim_email_failed when sendMagicLink fails but purchase succeeded", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    getCurrentAppUserIdMock.mockReturnValue("$RCAnonymousID:abc");
    sendMagicLinkMock.mockResolvedValue({ ok: false, error: "rate_limited" });

    const { result } = renderHook(() => usePurchaseFlow());

    await act(async () => {
      await result.current.buy(annualPackage, "test", "buyer@example.com");
    });

    expect(captureMock).toHaveBeenCalledWith(
      "claim_email_failed",
      expect.objectContaining({ error: "rate_limited" }),
    );
    expect(result.current.state.status).toBe("success");
    expect(result.current.state.claimEmailSent).toBe(false);
  });

  it("surfaces a purchase failure when the entitlement isn't active afterwards", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1", is_anonymous: false } },
    });
    hasActiveEntitlementMock.mockReturnValue(false);

    const { result } = renderHook(() => usePurchaseFlow());

    await act(async () => {
      await result.current.buy(annualPackage, "test");
    });

    expect(result.current.state.status).toBe("error");
    expect(result.current.state.error).toMatch(/didn['’]t activate/i);
  });

  it("treats a user-cancelled checkout as a quiet idle reset", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1", is_anonymous: false } },
    });
    purchasePackageMock.mockRejectedValue(new Error("User cancelled the purchase."));

    const { result } = renderHook(() => usePurchaseFlow());

    await act(async () => {
      await result.current.buy(annualPackage, "test");
    });

    expect(result.current.state.status).toBe("idle");
    expect(result.current.state.error).toBeNull();
  });
});
