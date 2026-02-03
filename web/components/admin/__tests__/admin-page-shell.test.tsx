import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminPageShell } from "../admin-page-shell";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/admin/career-path",
}));

describe("AdminPageShell", () => {
  it("renders title in heading", () => {
    render(
      <AdminPageShell title="Career Path" subtitle="Manage career path puzzles">
        <div>Content</div>
      </AdminPageShell>
    );

    expect(screen.getByRole("heading", { name: "Career Path" })).toBeDefined();
  });

  it("renders subtitle", () => {
    render(
      <AdminPageShell title="Career Path" subtitle="Manage career path puzzles">
        <div>Content</div>
      </AdminPageShell>
    );

    expect(screen.getByText("Manage career path puzzles")).toBeDefined();
  });

  it("renders children", () => {
    render(
      <AdminPageShell title="Career Path" subtitle="Manage career path puzzles">
        <div data-testid="child-content">Hello</div>
      </AdminPageShell>
    );

    expect(screen.getByTestId("child-content")).toBeDefined();
  });

  it("renders breadcrumb with admin prefix", () => {
    render(
      <AdminPageShell title="Career Path" subtitle="Manage career path puzzles">
        <div>Content</div>
      </AdminPageShell>
    );

    expect(screen.getByText("Admin")).toBeDefined();
  });
});
