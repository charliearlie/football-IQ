import { describe, it, expect, afterEach } from "vitest";
import { isSubscriptionsEnabled } from "@/lib/billing/config";

const KEY = "NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED";

describe("isSubscriptionsEnabled", () => {
  const original = process.env[KEY];

  afterEach(() => {
    if (original === undefined) {
      delete process.env[KEY];
    } else {
      process.env[KEY] = original;
    }
  });

  it("is true when the env var is exactly 'true'", () => {
    process.env[KEY] = "true";
    expect(isSubscriptionsEnabled()).toBe(true);
  });

  it("is false when the env var is unset", () => {
    delete process.env[KEY];
    expect(isSubscriptionsEnabled()).toBe(false);
  });

  it("is false for any value other than 'true'", () => {
    process.env[KEY] = "1";
    expect(isSubscriptionsEnabled()).toBe(false);
    process.env[KEY] = "TRUE";
    expect(isSubscriptionsEnabled()).toBe(false);
    process.env[KEY] = "false";
    expect(isSubscriptionsEnabled()).toBe(false);
  });
});
