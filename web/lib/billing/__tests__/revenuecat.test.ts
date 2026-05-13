import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CustomerInfo } from "@revenuecat/purchases-js";

const generateAnonId = vi.fn(() => "$RCAnonymousID:abc");
const configureMock = vi.fn();
const changeUserMock = vi.fn();
const getCustomerInfoMock = vi.fn();

vi.mock("@revenuecat/purchases-js", () => {
  const instance = {
    changeUser: (id: string) => changeUserMock(id),
    getCustomerInfo: () => getCustomerInfoMock(),
  };
  return {
    Purchases: {
      configure: (...args: unknown[]) => {
        configureMock(...args);
        return instance;
      },
      generateRevenueCatAnonymousAppUserId: () => generateAnonId(),
    },
  };
});

const apiKeyEnvKey = "NEXT_PUBLIC_REVENUECAT_WEB_API_KEY";

describe("revenuecat wrapper", () => {
  beforeEach(async () => {
    vi.resetModules();
    configureMock.mockClear();
    changeUserMock.mockClear();
    getCustomerInfoMock.mockClear();
    generateAnonId.mockClear();
    process.env[apiKeyEnvKey] = "rcb_test_key";
    const mod = await import("@/lib/billing/revenuecat");
    mod.__resetRevenueCatForTests();
  });

  it("returns null when no API key is configured", async () => {
    delete process.env[apiKeyEnvKey];
    vi.resetModules();
    const { ensureRevenueCat } = await import("@/lib/billing/revenuecat");
    const result = await ensureRevenueCat("user-1");
    expect(result).toBeNull();
    expect(configureMock).not.toHaveBeenCalled();
  });

  it("configures with the authed user id when provided", async () => {
    const { ensureRevenueCat } = await import("@/lib/billing/revenuecat");
    await ensureRevenueCat("user-1");
    expect(configureMock).toHaveBeenCalledWith("rcb_test_key", "user-1");
  });

  it("configures with an RC anon id when no user id is provided", async () => {
    const { ensureRevenueCat } = await import("@/lib/billing/revenuecat");
    await ensureRevenueCat(null);
    expect(configureMock).toHaveBeenCalledWith(
      "rcb_test_key",
      "$RCAnonymousID:abc",
    );
  });

  it("calls changeUser on subsequent calls with a different user id", async () => {
    const { ensureRevenueCat } = await import("@/lib/billing/revenuecat");
    await ensureRevenueCat("user-1");
    await ensureRevenueCat("user-2");
    expect(configureMock).toHaveBeenCalledTimes(1);
    expect(changeUserMock).toHaveBeenCalledWith("user-2");
  });

  it("does not call changeUser when the same user id is repeated", async () => {
    const { ensureRevenueCat } = await import("@/lib/billing/revenuecat");
    await ensureRevenueCat("user-1");
    await ensureRevenueCat("user-1");
    expect(changeUserMock).not.toHaveBeenCalled();
  });

  it("detects active premium entitlement", async () => {
    const { hasActiveEntitlement } = await import("@/lib/billing/revenuecat");
    const info = {
      entitlements: {
        active: {
          "Football IQ Pro": { expiresDate: null },
        },
      },
    } as unknown as CustomerInfo;
    expect(hasActiveEntitlement(info)).toBe(true);
  });

  it("returns false when the premium entitlement is missing", async () => {
    const { hasActiveEntitlement } = await import("@/lib/billing/revenuecat");
    const info = {
      entitlements: { active: {} },
    } as unknown as CustomerInfo;
    expect(hasActiveEntitlement(info)).toBe(false);
  });
});
