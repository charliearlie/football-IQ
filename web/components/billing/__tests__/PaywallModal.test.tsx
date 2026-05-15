import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const buyMock = vi.fn();
const resetMock = vi.fn();
const refreshMock = vi.fn();
const captureMock = vi.fn();

let useAuthUserMock: { ready: boolean; user: { id: string; is_anonymous: boolean } | null } = {
  ready: true,
  user: { id: "user-1", is_anonymous: false },
};
let useOfferingMock: {
  ready: boolean;
  offering: object | null;
  monthly: object | null;
  annual: object | null;
  monthlyTrial: string | null;
  annualTrial: string | null;
  error: boolean;
} = {
  ready: true,
  offering: { identifier: "web_default_offering" },
  monthly: {
    identifier: "$rc_monthly",
    webBillingProduct: { currentPrice: { formattedPrice: "£3.99 / month" } },
  },
  annual: {
    identifier: "$rc_annual",
    webBillingProduct: { currentPrice: { formattedPrice: "£19.99 / year" } },
  },
  monthlyTrial: null,
  annualTrial: "3-day free trial",
  error: false,
};
let usePurchaseFlowMock: {
  state: { status: string; pendingPackageId: string | null; error: string | null };
  buy: typeof buyMock;
  reset: typeof resetMock;
} = {
  state: { status: "idle", pendingPackageId: null, error: null },
  buy: buyMock,
  reset: resetMock,
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("posthog-js/react", () => ({
  usePostHog: () => ({ capture: captureMock }),
}));

vi.mock("@/lib/auth/useAuthUser", () => ({
  useAuthUser: () => useAuthUserMock,
}));

vi.mock("@/lib/billing/useOffering", () => ({
  useOffering: () => useOfferingMock,
}));

vi.mock("@/lib/billing/usePurchaseFlow", () => ({
  usePurchaseFlow: () => usePurchaseFlowMock,
}));

import { Paywall } from "@/components/billing/PaywallModal";

describe("Paywall", () => {
  beforeEach(() => {
    buyMock.mockClear();
    resetMock.mockClear();
    refreshMock.mockClear();
    captureMock.mockClear();
    useAuthUserMock = { ready: true, user: { id: "user-1", is_anonymous: false } };
    useOfferingMock = {
      ready: true,
      offering: { identifier: "web_default_offering" },
      monthly: {
        identifier: "$rc_monthly",
        webBillingProduct: { currentPrice: { formattedPrice: "£3.99 / month" } },
      },
      annual: {
        identifier: "$rc_annual",
        webBillingProduct: { currentPrice: { formattedPrice: "£19.99 / year" } },
      },
      monthlyTrial: null,
      annualTrial: "3-day free trial",
      error: false,
    };
    usePurchaseFlowMock = {
      state: { status: "idle", pendingPackageId: null, error: null },
      buy: buyMock,
      reset: resetMock,
    };
  });

  it("renders the price buttons for a signed-in user", () => {
    render(<Paywall source="test" />);
    expect(screen.getByText("£3.99 / month")).toBeInTheDocument();
    expect(screen.getByText("£19.99 / year")).toBeInTheDocument();
  });

  it("captures a paywall_viewed event on mount with the given source", () => {
    render(<Paywall source="career_path_pro_page" />);
    expect(captureMock).toHaveBeenCalledWith("paywall_viewed", {
      source: "career_path_pro_page",
    });
  });

  it("invokes the purchase flow when an offer is clicked", async () => {
    const user = userEvent.setup();
    render(<Paywall source="test" />);

    await user.click(screen.getByText("£19.99 / year"));

    expect(buyMock).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: "$rc_annual" }),
      "test",
    );
  });

  it("shows a sign-in CTA when the user is anonymous", () => {
    useAuthUserMock = {
      ready: true,
      user: { id: "anon", is_anonymous: true },
    };
    render(<Paywall source="test" redirectPath="/play/career-path-pro" />);

    const link = screen.getByRole("link", { name: /sign in to subscribe/i });
    expect(link).toHaveAttribute(
      "href",
      "/account/sign-in?next=%2Fplay%2Fcareer-path-pro",
    );
  });

  it("renders the subscription-terms disclosure with per-plan pricing and trial", () => {
    render(<Paywall source="test" />);
    expect(
      screen.getByText(/Yearly plan: £19\.99 \/ year after a 3-day free trial/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Monthly plan: £3\.99 \/ month/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/processed securely by Stripe/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute(
      "href",
      "/terms",
    );
    expect(
      screen.getByRole("link", { name: /Privacy Policy/i }),
    ).toHaveAttribute("href", "/privacy");
  });

  it("renders a fallback message when the offering is missing", () => {
    useOfferingMock = {
      ready: true,
      offering: null,
      monthly: null,
      annual: null,
      monthlyTrial: null,
      annualTrial: null,
      error: true,
    };
    render(<Paywall source="test" />);
    expect(
      screen.getByText(/Subscriptions aren['’]t available/i),
    ).toBeInTheDocument();
  });

  it("surfaces purchase errors from the flow state", () => {
    usePurchaseFlowMock = {
      state: {
        status: "error",
        pendingPackageId: null,
        error: "Card declined.",
      },
      buy: buyMock,
      reset: resetMock,
    };
    render(<Paywall source="test" />);
    expect(screen.getByText("Card declined.")).toBeInTheDocument();
  });
});
