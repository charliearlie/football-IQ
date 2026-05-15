import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const ensureRevenueCatMock = vi.fn();

vi.mock("@/lib/billing/revenuecat", () => ({
  ensureRevenueCat: (...args: unknown[]) => ensureRevenueCatMock(...args),
}));

vi.mock("@/lib/billing/config", () => ({
  isRevenueCatConfigured: () => true,
  WEB_OFFERING_ID: "web_default_offering",
}));

import { useOffering } from "@/lib/billing/useOffering";

function makePackage(
  identifier: string,
  trialPeriod: { number: number; unit: string } | null,
) {
  return {
    identifier,
    webBillingProduct: {
      currentPrice: { formattedPrice: "£0.00" },
      freeTrialPhase: trialPeriod ? { period: trialPeriod } : null,
    },
  };
}

function mockOfferings(packages: unknown[]) {
  ensureRevenueCatMock.mockResolvedValue({
    getOfferings: async () => ({
      all: { web_default_offering: { availablePackages: packages } },
    }),
  });
}

describe("useOffering trial parsing", () => {
  beforeEach(() => {
    ensureRevenueCatMock.mockReset();
  });

  it("parses a trial descriptor from a package with a free-trial phase", async () => {
    mockOfferings([
      makePackage("$rc_monthly", null),
      makePackage("$rc_annual", { number: 3, unit: "day" }),
    ]);

    const { result } = renderHook(() => useOffering());
    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(result.current.annualTrial).toBe("3-day free trial");
    expect(result.current.monthlyTrial).toBeNull();
  });

  it("returns null trial descriptors when no trial phase is present", async () => {
    mockOfferings([
      makePackage("$rc_monthly", null),
      makePackage("$rc_annual", null),
    ]);

    const { result } = renderHook(() => useOffering());
    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(result.current.annualTrial).toBeNull();
    expect(result.current.monthlyTrial).toBeNull();
  });
});
