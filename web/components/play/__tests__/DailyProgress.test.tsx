import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DailyProgress } from "@/components/play/DailyProgress";

const hasPlayedTodayMock = vi.fn();
vi.mock("@/lib/playSession", () => ({
  hasPlayedToday: (slug: string) => hasPlayedTodayMock(slug),
}));

describe("DailyProgress", () => {
  beforeEach(() => {
    hasPlayedTodayMock.mockReset();
    hasPlayedTodayMock.mockReturnValue(false);
  });

  it("counts against the number of active games, not all 12 web-playable games", () => {
    hasPlayedTodayMock.mockReturnValue(false);
    render(<DailyProgress activeSlugs={["career-path", "whos-that", "higher-lower"]} />);

    expect(screen.getByText("0/3 played")).toBeInTheDocument();
  });

  it("reflects played games once hydrated", () => {
    hasPlayedTodayMock.mockImplementation((slug: string) => slug === "career-path");
    render(<DailyProgress activeSlugs={["career-path", "whos-that"]} />);

    expect(screen.getByText("1/2 played")).toBeInTheDocument();
  });

  it("renders nothing when there are no active games today", () => {
    const { container } = render(<DailyProgress activeSlugs={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
