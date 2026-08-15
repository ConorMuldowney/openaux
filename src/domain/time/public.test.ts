import { describe, expect, it } from "vitest";
import {
  isAtOrAfterUtcInstant,
  isBeforeUtcInstant,
  isWithinUtcWindow,
  toUtcDateTimeString,
} from "@/src/domain/time/public";

describe("utc time boundary rules", () => {
  it("serializes dates as UTC ISO strings", () => {
    const date = new Date("2026-06-12T10:15:30.000Z");

    expect(toUtcDateTimeString(date)).toBe("2026-06-12T10:15:30.000Z");
  });

  it("treats window opens as start-inclusive", () => {
    const boundary = new Date("2026-06-12T10:00:00.000Z");

    expect(isBeforeUtcInstant(new Date("2026-06-12T09:59:59.999Z"), boundary)).toBe(true);
    expect(isBeforeUtcInstant(boundary, boundary)).toBe(false);
  });

  it("treats window closes as end-exclusive", () => {
    const boundary = new Date("2026-06-12T11:00:00.000Z");

    expect(isAtOrAfterUtcInstant(new Date("2026-06-12T10:59:59.999Z"), boundary)).toBe(false);
    expect(isAtOrAfterUtcInstant(boundary, boundary)).toBe(true);
  });

  it("recognizes an active UTC window across exact boundaries", () => {
    const opensAt = new Date("2026-06-12T10:00:00.000Z");
    const closesAt = new Date("2026-06-12T11:00:00.000Z");

    expect(isWithinUtcWindow(new Date("2026-06-12T09:59:59.999Z"), opensAt, closesAt)).toBe(false);
    expect(isWithinUtcWindow(opensAt, opensAt, closesAt)).toBe(true);
    expect(isWithinUtcWindow(new Date("2026-06-12T10:30:00.000Z"), opensAt, closesAt)).toBe(true);
    expect(isWithinUtcWindow(closesAt, opensAt, closesAt)).toBe(false);
  });
});