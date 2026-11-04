import {
  dateOnly,
  daysBetween,
  isSameDay,
  monthYear,
  parseDate,
  relativeDate,
  shortDate,
  shortWithTime,
  toIsoDate,
} from "../../src/core/date-labels";

describe("date-labels", () => {
  it("formats short and long dates", () => {
    const date = new Date(2026, 9, 24, 14, 5);
    expect(shortDate(date)).toBe("24 Oct");
    expect(shortWithTime(date)).toBe("24 Oct, 14:05");
    expect(monthYear(date)).toBe("Octubre 2026");
  });

  it("labels relative dates in Spanish", () => {
    const now = new Date(2026, 9, 24);
    expect(relativeDate(new Date(2026, 9, 24), now)).toBe("Hoy");
    expect(relativeDate(new Date(2026, 9, 25), now)).toBe("Mañana");
    expect(relativeDate(new Date(2026, 9, 23), now)).toBe("Ayer");
    expect(relativeDate(new Date(2026, 9, 27), now)).toBe("En 3 días");
    expect(relativeDate(new Date(2026, 9, 22), now)).toBe("Hace 2 días");
    expect(relativeDate(new Date(2026, 9, 31), now)).toBe("31 Oct");
  });

  it("keeps date-only values on the same local day", () => {
    const parsed = parseDate("2026-10-24");
    expect(parsed).not.toBeNull();
    expect(isSameDay(parsed as Date, new Date(2026, 9, 24))).toBe(true);
    expect(toIsoDate(parsed as Date)).toBe("2026-10-24");
  });

  it("counts days between dates ignoring time", () => {
    expect(daysBetween(new Date(2026, 9, 24, 23, 0), new Date(2026, 9, 21, 1, 0))).toBe(3);
    expect(dateOnly(new Date(2026, 9, 24, 23, 0)).getHours()).toBe(0);
  });
});
