import { describe, it, expect } from "vitest";
import { parseVariantsResponse } from "@/services/variantsService";

describe("parseVariantsResponse", () => {
  it("parses variants separated by delimiter", () => {
    const raw = "First variant\n---VARIANT---\nSecond variant";
    const result = parseVariantsResponse(raw, 2, "fallback");
    expect(result).toHaveLength(2);
    expect(result[0]).toBe("First variant");
    expect(result[1]).toBe("Second variant");
  });

  it("fills with fallback when not enough variants", () => {
    const raw = "Only one";
    const result = parseVariantsResponse(raw, 3, "fallback");
    expect(result).toHaveLength(3);
    expect(result[1]).toBe("fallback");
    expect(result[2]).toBe("fallback");
  });

  it("returns only requested count", () => {
    const raw = "A\n---VARIANT---\nB\n---VARIANT---\nC";
    const result = parseVariantsResponse(raw, 2, "fallback");
    expect(result).toHaveLength(2);
  });
});
