import { describe, it, expect } from "vitest";
import { scorePrompt } from "@/utils/promptScore";

describe("scorePrompt", () => {
  it("returns 'Too short' for very short text", () => {
    const result = scorePrompt("Hi");
    expect(result.total).toBe(0);
    expect(result.label).toBe("Too short");
  });

  it("scores a detailed prompt higher than a vague one", () => {
    const detailed = "Create a React component that fetches data from an API and displays it in a table. "
      + "The component should accept a URL prop, handle loading and error states, "
      + "and render the data in a sortable table. Must use TypeScript.";
    const vague = "Help me with something in my code.";

    const detailedScore = scorePrompt(detailed);
    const vagueScore = scorePrompt(vague);

    expect(detailedScore.total).toBeGreaterThan(vagueScore.total);
  });
});
