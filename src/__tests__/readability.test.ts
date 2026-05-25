import { describe, it, expect } from "vitest";
import { fleschKincaid } from "@/utils/readability";

describe("fleschKincaid", () => {
  it("returns N/A for empty text", () => {
    const result = fleschKincaid("");
    expect(result.score).toBe(0);
    expect(result.label).toBe("N/A");
  });

  it("returns Very Easy for simple text", () => {
    const result = fleschKincaid("The cat sat on the mat.");
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.label).toBe("Very Easy");
  });

  it("returns Very Confusing for complex text", () => {
    const text = "The aforementioned constitutional jurisprudence necessitates a comprehensive re-evaluation of the fundamental philosophical underpinnings.";
    const result = fleschKincaid(text);
    expect(result.label).toBe("Very Confusing");
  });

  it("strips markdown syntax before scoring", () => {
    const md = "# Heading\n\nSome **bold** and *italic* text.";
    const result = fleschKincaid(md);
    expect(result.wordCount).toBeGreaterThan(0);
  });
});
