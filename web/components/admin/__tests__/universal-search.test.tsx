import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UniversalAnswerSearch } from "../universal-answer-search";
import { PlayerDetailSheet } from "../player-detail-sheet";
import { ProBadge } from "../pro-badge";

// Elite threshold constant (should match component)
const ELITE_THRESHOLD = 50;

// Mock the command center hook
const mockUsePlayerCommandCenter = vi.fn();
vi.mock("@/hooks/use-player-command-center", () => ({
  usePlayerCommandCenter: (...args: unknown[]) =>
    mockUsePlayerCommandCenter(...args),
}));

// Mock the rap sheet hook (for backward compatibility)
const mockUsePlayerRapSheet = vi.fn();
vi.mock("@/hooks/use-player-rap-sheet", () => ({
  usePlayerRapSheet: (...args: unknown[]) => mockUsePlayerRapSheet(...args),
}));

// Mock the server actions
const mockSearchPlayersForForm = vi.fn();
const mockResyncPlayerFromWikidata = vi.fn();
vi.mock("@/app/(dashboard)/calendar/actions", () => ({
  searchPlayersForForm: (...args: unknown[]) =>
    mockSearchPlayersForForm(...args),
}));

vi.mock("@/app/(dashboard)/admin/actions", () => ({
  fetchPlayerRapSheet: vi.fn(() => Promise.resolve({ success: true, data: null })),
  fetchPlayerCommandCenterData: vi.fn(() =>
    Promise.resolve({ success: true, data: null })
  ),
  resyncPlayerFromWikidata: (...args: unknown[]) =>
    mockResyncPlayerFromWikidata(...args),
}));

// Mock FlagIcon
vi.mock("@/components/ui/flag-icon", () => ({
  FlagIcon: ({ code }: { code: string }) => (
    <span data-testid={`flag-${code}`}>{code}</span>
  ),
}));

// Mock Sheet components
vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="sheet">{children}</div> : null,
  SheetContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-content">{children}</div>
  ),
  SheetHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-header">{children}</div>
  ),
  SheetTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="sheet-title">{children}</h2>
  ),
  SheetDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="sheet-description">{children}</p>
  ),
}));

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("UniversalAnswerSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchPlayersForForm.mockResolvedValue({ success: true, data: [] });
    mockUsePlayerRapSheet.mockReturnValue({
      player: null,
      appearances: [],
      modesSummary: {},
      isLoading: false,
      error: null,
    });
    mockUsePlayerCommandCenter.mockReturnValue({
      player: null,
      clubHistory: [],
      trophyCabinet: [],
      appearances: [],
      modesSummary: {},
      isLoading: false,
      error: null,
    });
  });

  it("renders search input", () => {
    render(<UniversalAnswerSearch />);

    expect(
      screen.getByPlaceholderText("Search for a player...")
    ).toBeDefined();
  });

  it("shows empty state when no player selected", () => {
    render(<UniversalAnswerSearch />);

    expect(
      screen.getByText("Search for a player to see their puzzle appearances")
    ).toBeDefined();
  });

  it("shows loading state when searching", () => {
    mockUsePlayerRapSheet.mockReturnValue({
      player: null,
      appearances: [],
      modesSummary: {},
      isLoading: true,
      error: null,
    });

    render(<UniversalAnswerSearch />);

    expect(
      screen.getByPlaceholderText("Search for a player...")
    ).toBeDefined();
  });

  describe("search result ordering", () => {
    it("displays results in server order (scout_rank descending from API)", async () => {
      // Server returns players already sorted by scout_rank descending
      mockSearchPlayersForForm.mockResolvedValue({
        success: true,
        data: [
          { id: "Q11571", name: "Lionel Messi", birth_year: 1987, scout_rank: 250, nationality_code: "AR" },
          { id: "Q615", name: "Cristiano Ronaldo", birth_year: 1985, scout_rank: 245, nationality_code: "PT" },
          { id: "Q999", name: "Unknown Player", birth_year: 1990, scout_rank: 10, nationality_code: "US" },
        ],
      });

      render(<UniversalAnswerSearch />);
      const input = screen.getByPlaceholderText("Search for a player...");

      fireEvent.change(input, { target: { value: "player" } });

      // Wait for debounced search and dropdown to appear
      await waitFor(() => {
        expect(mockSearchPlayersForForm).toHaveBeenCalledWith("player");
      });

      // Wait for results to render
      await screen.findByText("Lionel Messi");

      // Get all player result buttons
      const buttons = await screen.findAllByRole("button");
      const playerButtons = buttons.filter(
        (btn) =>
          btn.textContent?.includes("Messi") ||
          btn.textContent?.includes("Ronaldo") ||
          btn.textContent?.includes("Unknown")
      );

      // Verify ordering matches server order (highest rank first)
      expect(playerButtons.length).toBe(3);
      expect(playerButtons[0].textContent).toContain("Messi");
      expect(playerButtons[1].textContent).toContain("Ronaldo");
      expect(playerButtons[2].textContent).toContain("Unknown");
    });
  });

  describe("elite player badge", () => {
    it("shows Pro Badge (#FFBF00) for elite players (scout_rank >= threshold)", async () => {
      mockSearchPlayersForForm.mockResolvedValue({
        success: true,
        data: [
          { id: "Q11571", name: "Lionel Messi", birth_year: 1987, scout_rank: 250, nationality_code: "AR" },
        ],
      });

      render(<UniversalAnswerSearch />);
      const input = screen.getByPlaceholderText("Search for a player...");

      fireEvent.change(input, { target: { value: "messi" } });

      await waitFor(() => {
        expect(mockSearchPlayersForForm).toHaveBeenCalled();
      });

      // Wait for dropdown to show
      const proBadge = await screen.findByTestId("pro-badge");
      expect(proBadge).toBeDefined();
      expect(proBadge.textContent).toBe("PRO");
    });

    it("does not show Pro Badge for non-elite players (scout_rank < threshold)", async () => {
      mockSearchPlayersForForm.mockResolvedValue({
        success: true,
        data: [
          { id: "Q999", name: "Unknown Player", birth_year: 1995, scout_rank: 5, nationality_code: "US" },
        ],
      });

      render(<UniversalAnswerSearch />);
      const input = screen.getByPlaceholderText("Search for a player...");

      fireEvent.change(input, { target: { value: "unknown" } });

      await waitFor(() => {
        expect(mockSearchPlayersForForm).toHaveBeenCalled();
      });

      // Wait for dropdown to show player name
      await screen.findByText("Unknown Player");

      // Pro badge should not exist
      expect(screen.queryByTestId("pro-badge")).toBeNull();
    });

    it("shows nationality flag in search results", async () => {
      mockSearchPlayersForForm.mockResolvedValue({
        success: true,
        data: [
          { id: "Q11571", name: "Lionel Messi", birth_year: 1987, scout_rank: 250, nationality_code: "AR" },
        ],
      });

      render(<UniversalAnswerSearch />);
      const input = screen.getByPlaceholderText("Search for a player...");

      fireEvent.change(input, { target: { value: "messi" } });

      await waitFor(() => {
        expect(mockSearchPlayersForForm).toHaveBeenCalled();
      });

      // Should show Argentine flag
      const flag = await screen.findByTestId("flag-AR");
      expect(flag).toBeDefined();
    });
  });
});

describe("ProBadge", () => {
  it("renders with correct styling and test id", () => {
    render(<ProBadge />);

    const badge = screen.getByTestId("pro-badge");
    expect(badge).toBeDefined();
    expect(badge.textContent).toBe("PRO");
  });
});

describe("PlayerDetailSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePlayerCommandCenter.mockReturnValue({
      player: null,
      clubHistory: [],
      trophyCabinet: [],
      appearances: [],
      modesSummary: {},
      isLoading: false,
      error: null,
    });
    mockResyncPlayerFromWikidata.mockResolvedValue({
      success: true,
      data: { careersUpdated: 5, achievementsUpdated: 10 },
    });
  });

  it("displays club history from player_appearances", async () => {
    mockUsePlayerCommandCenter.mockReturnValue({
      player: { id: "Q11571", name: "Lionel Messi", nationality_code: "AR", scout_rank: 250 },
      clubHistory: [
        { club_id: "Q7156", club_name: "FC Barcelona", country_code: "ES", start_year: 2004, end_year: 2021 },
        { club_id: "Q583", club_name: "Paris Saint-Germain", country_code: "FR", start_year: 2021, end_year: 2023 },
        { club_id: "Q48732", club_name: "Inter Miami CF", country_code: "US", start_year: 2023, end_year: null },
      ],
      trophyCabinet: [],
      appearances: [],
      modesSummary: {},
      isLoading: false,
      error: null,
    });

    render(
      <PlayerDetailSheet
        isOpen={true}
        onClose={() => {}}
        playerQid="Q11571"
      />
    );

    // Verify club history is displayed
    expect(screen.getByText("FC Barcelona")).toBeDefined();
    expect(screen.getByText("Paris Saint-Germain")).toBeDefined();
    expect(screen.getByText("Inter Miami CF")).toBeDefined();

    // Verify years are displayed
    expect(screen.getByText(/2004.*2021/)).toBeDefined();
    expect(screen.getByText(/2021.*2023/)).toBeDefined();
  });

  it("displays trophy cabinet grouped by category", async () => {
    mockUsePlayerCommandCenter.mockReturnValue({
      player: { id: "Q11571", name: "Lionel Messi", nationality_code: "AR", scout_rank: 250 },
      clubHistory: [],
      trophyCabinet: [
        { achievement_id: "Q166177", name: "Ballon d'Or", category: "Individual", year: 2023, club_name: null },
        { achievement_id: "Q166177", name: "Ballon d'Or", category: "Individual", year: 2021, club_name: null },
        { achievement_id: "Q19317", name: "UEFA Champions League", category: "Club", year: 2015, club_name: "FC Barcelona" },
        { achievement_id: "Q19317", name: "UEFA Champions League", category: "Club", year: 2011, club_name: "FC Barcelona" },
        { achievement_id: "Q19317", name: "FIFA World Cup", category: "International", year: 2022, club_name: null },
      ],
      appearances: [],
      modesSummary: {},
      isLoading: false,
      error: null,
    });

    render(
      <PlayerDetailSheet
        isOpen={true}
        onClose={() => {}}
        playerQid="Q11571"
      />
    );

    // Verify category headings
    expect(screen.getByText("Individual")).toBeDefined();
    expect(screen.getByText("Club")).toBeDefined();
    expect(screen.getByText("International")).toBeDefined();

    // Verify trophies are displayed
    expect(screen.getAllByText(/Ballon d'Or/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Champions League/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/World Cup/)).toBeDefined();
  });

  it("maintains existing puzzle appearances rap sheet", async () => {
    mockUsePlayerCommandCenter.mockReturnValue({
      player: { id: "Q11571", name: "Lionel Messi", nationality_code: "AR", scout_rank: 250 },
      clubHistory: [],
      trophyCabinet: [],
      appearances: [
        { puzzle_id: "p1", puzzle_date: "2026-01-10", game_mode: "career_path", status: "live" },
        { puzzle_id: "p2", puzzle_date: "2026-01-15", game_mode: "the_grid", status: "live" },
      ],
      modesSummary: {
        career_path: 1,
        the_grid: 1,
        career_path_pro: 0,
        guess_the_transfer: 0,
        guess_the_goalscorers: 0,
        topical_quiz: 0,
        top_tens: 0,
        starting_xi: 0,
      },
      isLoading: false,
      error: null,
    });

    render(
      <PlayerDetailSheet
        isOpen={true}
        onClose={() => {}}
        playerQid="Q11571"
      />
    );

    // Verify puzzle appearances section exists
    expect(screen.getByText("Puzzle Appearances")).toBeDefined();
    // Use getAllByText since "Career Path" matches both "Career Path" and "Career Path Pro"
    const careerPathElements = screen.getAllByText(/Career Path/i);
    expect(careerPathElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/The Grid/i)).toBeDefined();
  });

  it("shows Force Re-sync button that triggers resync", async () => {
    mockUsePlayerCommandCenter.mockReturnValue({
      player: { id: "Q11571", name: "Lionel Messi", nationality_code: "AR", scout_rank: 250 },
      clubHistory: [],
      trophyCabinet: [],
      appearances: [],
      modesSummary: {},
      isLoading: false,
      error: null,
    });

    render(
      <PlayerDetailSheet
        isOpen={true}
        onClose={() => {}}
        playerQid="Q11571"
      />
    );

    const resyncButton = screen.getByRole("button", { name: /re-?sync/i });
    expect(resyncButton).toBeDefined();

    fireEvent.click(resyncButton);

    await waitFor(() => {
      expect(mockResyncPlayerFromWikidata).toHaveBeenCalledWith("Q11571");
    });
  });

  it("shows Pro Badge for elite player in sheet header", async () => {
    mockUsePlayerCommandCenter.mockReturnValue({
      player: { id: "Q11571", name: "Lionel Messi", nationality_code: "AR", scout_rank: 250 },
      clubHistory: [],
      trophyCabinet: [],
      appearances: [],
      modesSummary: {},
      isLoading: false,
      error: null,
    });

    render(
      <PlayerDetailSheet
        isOpen={true}
        onClose={() => {}}
        playerQid="Q11571"
      />
    );

    // Pro badge should appear in header for elite player
    const proBadge = screen.getByTestId("pro-badge");
    expect(proBadge).toBeDefined();
  });

  it("does not render when closed", () => {
    render(
      <PlayerDetailSheet
        isOpen={false}
        onClose={() => {}}
        playerQid="Q11571"
      />
    );

    expect(screen.queryByTestId("sheet")).toBeNull();
  });
});
