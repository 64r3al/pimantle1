import puzzleAvailability from "./data/puzzle_availability.json";

describe("bundled puzzle data", () => {
  test("declares the complete Pimantle and Semantle archive ranges", () => {
    expect(puzzleAvailability.pimantle).toEqual({ min: 0, max: 232 });
    expect(puzzleAvailability.semantle).toEqual({ min: 0, max: 99 });
  });

  test("includes valid non-negative puzzle index ranges", () => {
    expect(puzzleAvailability.pimantle.min).toBe(0);
    expect(puzzleAvailability.semantle.min).toBe(0);
    expect(puzzleAvailability.pimantle.max).toBeGreaterThanOrEqual(puzzleAvailability.pimantle.min);
    expect(puzzleAvailability.semantle.max).toBeGreaterThanOrEqual(puzzleAvailability.semantle.min);
  });
});
