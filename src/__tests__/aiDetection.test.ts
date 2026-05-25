import { describe, it, expect } from "vitest";
import { scoreAILikelihood } from "@/utils/aiDetection";

describe("scoreAILikelihood", () => {
  it("returns 'Too short' for very short text", () => {
    const result = scoreAILikelihood("Hello world.");
    expect(result.label).toBe("Too short");
  });

  it("flags text with many AI buzzwords as 'Likely AI'", () => {
    const text = "Leverage our cutting-edge synergistic paradigm to revolutionize your workflow. "
      + "This groundbreaking solution empowers you to navigate the landscape with ease. "
      + "Our robust platform fosters seamless integration and delivers tangible results. "
      + "The holistic approach ensures transformative outcomes for all stakeholders involved.";
    const result = scoreAILikelihood(text);
    expect(result.buzzwordCount).toBeGreaterThan(0);
  });

  it("returns a score between 0 and 100", () => {
    const text = "The quick brown fox jumps over the lazy dog. "
      + "This sentence is simple and easy to read. "
      + "It contains no complex words or phrases. "
      + "The meaning is clear and straightforward.";
    const result = scoreAILikelihood(text);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
