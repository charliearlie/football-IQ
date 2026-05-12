import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SignInForm } from "@/components/account/SignInForm";

const sendMagicLinkMock = vi.fn();
vi.mock("@/lib/auth/magic-link", () => ({
  sendMagicLink: (email: string, source: string, redirectPath: string) =>
    sendMagicLinkMock(email, source, redirectPath),
}));

describe("SignInForm", () => {
  beforeEach(() => {
    sendMagicLinkMock.mockReset();
  });

  it("disables submit until an email is typed", () => {
    render(<SignInForm redirectPath="/play" source="test" />);
    const submit = screen.getByRole("button", { name: /Send magic link/i });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "a@b.co" },
    });
    expect(submit).not.toBeDisabled();
  });

  it("sends a magic link with the configured source + redirect", async () => {
    sendMagicLinkMock.mockResolvedValueOnce({ ok: true });
    render(<SignInForm redirectPath="/account" source="account-sign-in" />);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "fan@football.iq" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Send magic link/i }));

    await waitFor(() => {
      expect(sendMagicLinkMock).toHaveBeenCalledWith(
        "fan@football.iq",
        "account-sign-in",
        "/account",
      );
    });

    expect(await screen.findByText(/Check your email/i)).toBeInTheDocument();
    expect(screen.getByText("fan@football.iq")).toBeInTheDocument();
  });

  it("surfaces the error message on failure and stays editable", async () => {
    sendMagicLinkMock.mockResolvedValueOnce({
      ok: false,
      error: "Please enter a valid email address",
    });
    render(<SignInForm redirectPath="/play" source="test" />);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "broken" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Send magic link/i }));

    expect(
      await screen.findByText(/Please enter a valid email address/i),
    ).toBeInTheDocument();
    // Still on the form, not the success state.
    expect(screen.getByRole("button", { name: /Send magic link/i })).toBeEnabled();
  });

  it('clears state when the user clicks "Use a different email"', async () => {
    sendMagicLinkMock.mockResolvedValueOnce({ ok: true });
    render(<SignInForm redirectPath="/play" source="test" />);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "first@football.iq" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Send magic link/i }));

    await screen.findByText(/Check your email/i);
    fireEvent.click(screen.getByRole("button", { name: /Use a different email/i }));

    expect(screen.getByLabelText(/Email/i)).toHaveValue("");
  });
});
