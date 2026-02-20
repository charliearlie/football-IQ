import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  markPlayed,
  hasPlayedToday,
  getPlayResult,
  getDaysPlayed,
  copyToClipboard,
} from "../playSession";

// ============================================================================
// Helpers
// ============================================================================

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function keyFor(slug: string, date?: string): string {
  return `footballiq_played_${slug}_${date ?? todayStr()}`;
}

// ============================================================================
// Setup — reset localStorage before every test
// ============================================================================

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

// ============================================================================
// markPlayed
// ============================================================================

describe("markPlayed", () => {
  it("writes a value to localStorage with the correct key format", () => {
    markPlayed("career-path", { won: true, shareText: "great game" });

    const key = keyFor("career-path");
    const stored = localStorage.getItem(key);
    expect(stored).not.toBeNull();
  });

  it("stores the correct won flag and shareText", () => {
    markPlayed("career-path", { won: true, shareText: "great game" });

    const raw = localStorage.getItem(keyFor("career-path"))!;
    const parsed = JSON.parse(raw);
    expect(parsed.won).toBe(true);
    expect(parsed.shareText).toBe("great game");
  });

  it("stores a numeric timestamp", () => {
    const before = Date.now();
    markPlayed("transfer-guess", { won: false, shareText: "better luck next time" });
    const after = Date.now();

    const raw = localStorage.getItem(keyFor("transfer-guess"))!;
    const parsed = JSON.parse(raw);
    expect(parsed.timestamp).toBeGreaterThanOrEqual(before);
    expect(parsed.timestamp).toBeLessThanOrEqual(after);
  });

  it("stores won: false correctly", () => {
    markPlayed("connections", { won: false, shareText: "no luck" });

    const raw = localStorage.getItem(keyFor("connections"))!;
    const parsed = JSON.parse(raw);
    expect(parsed.won).toBe(false);
  });

  it("does nothing when window is undefined (SSR)", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    const originalWindow = globalThis.window;

    // Simulate SSR by temporarily making window undefined
    Object.defineProperty(globalThis, "window", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    try {
      markPlayed("career-path", { won: true, shareText: "test" });
      expect(setItemSpy).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: originalWindow,
        configurable: true,
        writable: true,
      });
    }
  });

  it("silently swallows localStorage errors", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    // Should not throw
    expect(() =>
      markPlayed("career-path", { won: true, shareText: "test" })
    ).not.toThrow();
  });
});

// ============================================================================
// hasPlayedToday
// ============================================================================

describe("hasPlayedToday", () => {
  it("returns false when the game has not been played", () => {
    expect(hasPlayedToday("career-path")).toBe(false);
  });

  it("returns true after markPlayed is called for the same slug", () => {
    markPlayed("career-path", { won: true, shareText: "nice" });
    expect(hasPlayedToday("career-path")).toBe(true);
  });

  it("returns false for a different game slug even after another is played", () => {
    markPlayed("career-path", { won: true, shareText: "nice" });
    expect(hasPlayedToday("connections")).toBe(false);
  });

  it("returns false when window is undefined (SSR)", () => {
    const originalWindow = globalThis.window;

    Object.defineProperty(globalThis, "window", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    try {
      expect(hasPlayedToday("career-path")).toBe(false);
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: originalWindow,
        configurable: true,
        writable: true,
      });
    }
  });

  it("returns false when localStorage.getItem throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });

    expect(hasPlayedToday("career-path")).toBe(false);
  });
});

// ============================================================================
// getPlayResult
// ============================================================================

describe("getPlayResult", () => {
  it("returns null when the game has not been played", () => {
    expect(getPlayResult("career-path")).toBeNull();
  });

  it("returns the stored result after markPlayed", () => {
    markPlayed("career-path", { won: true, shareText: "Football IQ - Career Path\n19 Feb" });

    const result = getPlayResult("career-path");
    expect(result).not.toBeNull();
    expect(result!.won).toBe(true);
    expect(result!.shareText).toBe("Football IQ - Career Path\n19 Feb");
  });

  it("returns null for an unplayed game even when other games are stored", () => {
    markPlayed("career-path", { won: true, shareText: "text" });
    expect(getPlayResult("connections")).toBeNull();
  });

  it("accepts an explicit date parameter to retrieve results from a specific day", () => {
    const pastDate = "2026-01-15";
    const key = keyFor("career-path", pastDate);
    const storedValue = { won: false, shareText: "old result", timestamp: 1000 };
    localStorage.setItem(key, JSON.stringify(storedValue));

    const result = getPlayResult("career-path", pastDate);
    expect(result).not.toBeNull();
    expect(result!.won).toBe(false);
    expect(result!.shareText).toBe("old result");
  });

  it("returns null when window is undefined (SSR)", () => {
    const originalWindow = globalThis.window;

    Object.defineProperty(globalThis, "window", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    try {
      expect(getPlayResult("career-path")).toBeNull();
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: originalWindow,
        configurable: true,
        writable: true,
      });
    }
  });

  it("returns null when localStorage contains invalid JSON", () => {
    localStorage.setItem(keyFor("career-path"), "not-valid-json{{{");
    expect(getPlayResult("career-path")).toBeNull();
  });
});

// ============================================================================
// getDaysPlayed
// ============================================================================

describe("getDaysPlayed", () => {
  it("returns 0 when localStorage is empty", () => {
    expect(getDaysPlayed()).toBe(0);
  });

  it("returns 1 after playing on a single day", () => {
    markPlayed("career-path", { won: true, shareText: "" });
    expect(getDaysPlayed()).toBe(1);
  });

  it("counts two games played on the same day as 1 distinct day", () => {
    markPlayed("career-path", { won: true, shareText: "" });
    markPlayed("connections", { won: false, shareText: "" });
    expect(getDaysPlayed()).toBe(1);
  });

  it("counts games played on different days as distinct days", () => {
    const date1 = "2026-01-10";
    const date2 = "2026-01-11";

    localStorage.setItem(
      keyFor("career-path", date1),
      JSON.stringify({ won: true, shareText: "", timestamp: 1 })
    );
    localStorage.setItem(
      keyFor("career-path", date2),
      JSON.stringify({ won: true, shareText: "", timestamp: 2 })
    );

    expect(getDaysPlayed()).toBe(2);
  });

  it("ignores keys that do not start with the footballiq_played prefix", () => {
    localStorage.setItem("some_other_app_key_2026-01-01", "irrelevant");
    localStorage.setItem("unrelated", "data");
    expect(getDaysPlayed()).toBe(0);
  });

  it("ignores footballiq_played keys that do not end with a valid date segment", () => {
    // Key ends with something that is not YYYY-MM-DD
    localStorage.setItem("footballiq_played_career-path_notadate", "{}");
    expect(getDaysPlayed()).toBe(0);
  });

  it("returns 0 when window is undefined (SSR)", () => {
    const originalWindow = globalThis.window;

    Object.defineProperty(globalThis, "window", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    try {
      expect(getDaysPlayed()).toBe(0);
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: originalWindow,
        configurable: true,
        writable: true,
      });
    }
  });

  it("returns 0 when localStorage iteration throws", () => {
    // Seed an item so localStorage.length > 0, then replace localStorage.key
    // with a throwing stub. happy-dom storage methods are own properties, not
    // inherited from Storage.prototype, so we must stub on the instance.
    localStorage.setItem(
      keyFor("career-path"),
      JSON.stringify({ won: true, shareText: "", timestamp: 1 })
    );
    vi.spyOn(localStorage, "key").mockImplementation(() => {
      throw new Error("SecurityError");
    });

    expect(getDaysPlayed()).toBe(0);
  });
});

// ============================================================================
// copyToClipboard
// ============================================================================

// happy-dom exposes navigator.clipboard as a getter-only property, so
// Object.assign cannot overwrite it. We use Object.defineProperty instead.
function mockClipboard(impl: { writeText: (text: string) => Promise<void> }) {
  Object.defineProperty(navigator, "clipboard", {
    value: impl,
    configurable: true,
    writable: true,
  });
}

describe("copyToClipboard", () => {
  it("calls navigator.clipboard.writeText with the provided text", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard({ writeText });

    await copyToClipboard("hello world");
    expect(writeText).toHaveBeenCalledWith("hello world");
  });

  it("returns true when clipboard.writeText succeeds", async () => {
    mockClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });

    const result = await copyToClipboard("test text");
    expect(result).toBe(true);
  });

  it("falls back to execCommand when clipboard API throws", async () => {
    mockClipboard({
      writeText: vi.fn().mockRejectedValue(new Error("NotAllowedError")),
    });

    // happy-dom does not define document.execCommand; define it before spying.
    Object.defineProperty(document, "execCommand", {
      value: vi.fn().mockReturnValue(true),
      configurable: true,
      writable: true,
    });
    const execCommandSpy = vi.spyOn(document, "execCommand");

    const result = await copyToClipboard("fallback text");
    expect(execCommandSpy).toHaveBeenCalledWith("copy");
    expect(result).toBe(true);
  });

  it("returns false when both clipboard API and execCommand fail", async () => {
    mockClipboard({
      writeText: vi.fn().mockRejectedValue(new Error("NotAllowedError")),
    });

    // happy-dom does not define document.execCommand; define it before spying.
    Object.defineProperty(document, "execCommand", {
      value: vi.fn().mockImplementation(() => {
        throw new Error("execCommand not supported");
      }),
      configurable: true,
      writable: true,
    });

    const result = await copyToClipboard("failing text");
    expect(result).toBe(false);
  });
});
