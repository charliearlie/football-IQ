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
  error: false,
};
let usePurchaseFlowMock: {
  state: {
    status: string;
    pendingPackageId: string | null;
    error: string | null;
    claimEmailSent: boolean;
    claimEmail: string | null;
  };
  buy: typeof buyMock;
  reset: typeof resetMock;
} = {
  state: {
    status: "idle",
    pendingPackageId: null,
    error: null,
    claimEmailSent: false,
    claimEmail: null,
  },
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
      error: false,
    };
    usePurchaseFlowMock = {
      state: {
        status: "idle",
        pendingPackageId: null,
        error: null,
        claimEmailSent: false,
        claimEmail: null,
      },
      buy: buyMock,
      reset: resetMock,
    };
  });

  describe("signed-in user", () => {
    it("renders the price buttons", () => {
      render(<Paywall source="test" />);
      expect(screen.getByText("£3.99 / month")).toBeInTheDocument();
      expect(screen.getByText("£19.99 / year")).toBeInTheDocument();
    });

    it("does not render the email input", () => {
      render(<Paywall source="test" />);
      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    });

    it("invokes the purchase flow with no email when an offer is clicked", async () => {
      const user = userEvent.setup();
      render(<Paywall source="test" />);

      await user.click(screen.getByText("£19.99 / year"));

      expect(buyMock).toHaveBeenCalledWith(
        expect.objectContaining({ identifier: "$rc_annual" }),
        "test",
        undefined,
      );
    });

    it("captures a paywall_viewed event with signed_in=true", () => {
      render(<Paywall source="career_path_pro_page" />);
      expect(captureMock).toHaveBeenCalledWith("paywall_viewed", {
        source: "career_path_pro_page",
        signed_in: true,
      });
    });
  });

  describe("anonymous user", () => {
    beforeEach(() => {
      useAuthUserMock = { ready: true, user: null };
    });

    it("renders price buttons + email input (no sign-in CTA)", () => {
      render(<Paywall source="test" redirectPath="/play/career-path-pro" />);

      expect(screen.getByText("£3.99 / month")).toBeInTheDocument();
      expect(screen.getByText("£19.99 / year")).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /sign in to subscribe/i }),
      ).not.toBeInTheDocument();
    });

    it("disables the subscribe buttons until a valid email is entered", async () => {
      const user = userEvent.setup();
      render(<Paywall source="test" />);

      const annualButton = screen.getByRole("button", { name: /yearly/i });
      expect(annualButton).toBeDisabled();

      await user.type(screen.getByLabelText(/email/i), "not-an-email");
      expect(annualButton).toBeDisabled();

      await user.clear(screen.getByLabelText(/email/i));
      await user.type(screen.getByLabelText(/email/i), "buyer@example.com");
      expect(annualButton).toBeEnabled();
    });

    it("passes the email through to the purchase flow on click", async () => {
      const user = userEvent.setup();
      render(<Paywall source="archive_career-path" />);

      await user.type(screen.getByLabelText(/email/i), "  Buyer@Example.com  ");
      await user.click(screen.getByRole("button", { name: /yearly/i }));

      expect(buyMock).toHaveBeenCalledWith(
        expect.objectContaining({ identifier: "$rc_annual" }),
        "archive_career-path",
        "Buyer@Example.com",
      );
    });

    it("shows a success state with the claim email after purchase succeeds", () => {
      usePurchaseFlowMock = {
        state: {
          status: "success",
          pendingPackageId: null,
          error: null,
          claimEmailSent: true,
          claimEmail: "buyer@example.com",
        },
        buy: buyMock,
        reset: resetMock,
      };
      render(<Paywall source="test" />);
      expect(screen.getByText(/Subscription active/i)).toBeInTheDocument();
      expect(screen.getByText("buyer@example.com")).toBeInTheDocument();
    });

    it("shows a fallback when the claim email failed to send", () => {
      usePurchaseFlowMock = {
        state: {
          status: "success",
          pendingPackageId: null,
          error: null,
          claimEmailSent: false,
          claimEmail: null,
        },
        buy: buyMock,
        reset: resetMock,
      };
      render(<Paywall source="test" />);
      expect(
        screen.getByText(/couldn['’]t send the claim email/i),
      ).toBeInTheDocument();
    });
  });

  it("renders a fallback message when the offering is missing", () => {
    useOfferingMock = {
      ready: true,
      offering: null,
      monthly: null,
      annual: null,
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
        claimEmailSent: false,
        claimEmail: null,
      },
      buy: buyMock,
      reset: resetMock,
    };
    render(<Paywall source="test" />);
    expect(screen.getByText("Card declined.")).toBeInTheDocument();
  });
});
