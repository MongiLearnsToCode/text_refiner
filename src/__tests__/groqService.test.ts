import { describe, it, expect } from "vitest";
import { buildRefinePrompts, buildVariantsPrompt, RefineOptions } from "@/services/groqService";

const baseOptions: RefineOptions = {
  processingMode: "Comprehensive Refinement",
  context: "General professional writing",
  developerMode: false,
  editingControls: {
    removeEmDashes: true,
    grammarCorrection: true,
    clarityConciseness: true,
    structuralRefinement: true,
    toneAlignment: true,
  },
  aiPreset: "None",
  structureGenerator: false,
  optimizationPass: false,
  tone: "Professional",
  wordTarget: "none",
};

describe("buildRefinePrompts", () => {
  it("returns prompt for Remove Em Dashes Only mode", () => {
    const { prompt } = buildRefinePrompts("Test text — with dash.", {
      ...baseOptions,
      processingMode: "Remove Em Dashes Only",
    });
    expect(prompt).toContain("remove all em dashes");
    expect(prompt).toContain("Test text — with dash.");
  });

  it("returns optimization prompt when optimizationPass is enabled", () => {
    const { optimizationPrompt } = buildRefinePrompts("Test text.", {
      ...baseOptions,
      developerMode: true,
      optimizationPass: true,
    });
    expect(optimizationPrompt).toBeDefined();
    expect(optimizationPrompt).toContain("optimize");
  });

  it("does not return optimization prompt when disabled", () => {
    const { optimizationPrompt } = buildRefinePrompts("Test text.", baseOptions);
    expect(optimizationPrompt).toBeUndefined();
  });

  it("includes custom style guide when provided", () => {
    const { prompt } = buildRefinePrompts("Test text.", {
      ...baseOptions,
      customStyleGuide: "Never use passive voice.",
    });
    expect(prompt).toContain("Never use passive voice");
  });
});

describe("buildVariantsPrompt", () => {
  it("includes original and current text in prompt", () => {
    const prompt = buildVariantsPrompt("Original", "Refined", baseOptions, 2);
    expect(prompt).toContain("Original");
    expect(prompt).toContain("Refined");
    expect(prompt).toContain("---VARIANT---");
  });
});
