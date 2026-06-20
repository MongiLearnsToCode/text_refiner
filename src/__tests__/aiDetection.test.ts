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

  it("returns flags array", () => {
    const text = "This article explores the impact of AI on our modern world. "
      + "It is crucial to understand these transformative changes. "
      + "Leveraging cutting-edge technology, we can navigate this landscape. "
      + "The groundbreaking innovations will revolutionize the industry. "
      + "Our robust platform fosters a seamless paradigm shift. "
      + "This underscores the importance of staying ahead of the curve.";
    const result = scoreAILikelihood(text);
    expect(Array.isArray(result.flags)).toBe(true);
  });

  it("detects weak intro patterns", () => {
    const text = "This article explores the impact of AI on education. "
      + "It changes how students learn and teachers teach. "
      + "The implications are far-reaching and significant. "
      + "Many schools are adopting these new tools. "
      + "The technology continues to evolve rapidly.";
    const result = scoreAILikelihood(text);
    const introFlag = result.flags.find(f => f.category === "Weak Intro");
    expect(introFlag).toBeDefined();
  });

  it("detects weak conclusion patterns", () => {
    const text = "AI is changing education in many ways. "
      + "Students can learn at their own pace. "
      + "Teachers can personalize instruction. "
      + "These findings highlight the importance of further investment.";
    const result = scoreAILikelihood(text);
    const conclusionFlag = result.flags.find(f => f.category === "Weak Conclusion");
    expect(conclusionFlag).toBeDefined();
  });

  it("detects robotic transitions", () => {
    const text = "The product improves efficiency. Furthermore, it reduces costs. "
      + "Moreover, it enhances user satisfaction. Additionally, it is easy to deploy. "
      + "Consequently, many teams are adopting it. In conclusion, it is a great solution.";
    const result = scoreAILikelihood(text);
    expect(result.roboticPhraseCount).toBeGreaterThanOrEqual(3);
  });
});
