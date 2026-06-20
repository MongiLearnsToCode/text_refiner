import type { ToneOption } from "../types";

export interface RefineOptions {
  processingMode: string;
  context: string;
  developerMode: boolean;
  editingControls: {
    removeEmDashes: boolean;
    grammarCorrection: boolean;
    clarityConciseness: boolean;
    structuralRefinement: boolean;
    toneAlignment: boolean;
  };
  aiPreset: string;
  structureGenerator: boolean;
  optimizationPass: boolean;
  tone: ToneOption;
  wordTarget?: string;
  customStyleGuide?: string;
}

const TONE_INSTRUCTIONS: Record<ToneOption, string> = {
  Professional: "Use a formal, authoritative, and polished tone appropriate for business audiences.",
  Casual: "Use a relaxed, conversational, and approachable tone — as if talking to a colleague.",
  Persuasive: "Use a confident, compelling tone that motivates the reader to agree or take action.",
  Academic: "Use a precise, evidence-oriented tone with structured argumentation, avoiding colloquialisms.",
  Empathetic: "Use a warm, understanding tone that acknowledges the reader's perspective and feelings.",
};

interface RefinePrompts {
  prompt: string;
  optimizationPrompt?: string;
}

export function buildRefinePrompts(text: string, options: RefineOptions): RefinePrompts {
  const {
    processingMode,
    context,
    developerMode,
    editingControls,
    aiPreset,
    structureGenerator,
    optimizationPass,
    tone,
    wordTarget,
    customStyleGuide,
  } = options;

  let prompt = "";

  if (processingMode === "Remove Em Dashes Only") {
    prompt = `You are an expert editor. Your ONLY task is to remove all em dashes (—) from the following text and replace them with contextually correct punctuation such as commas, periods, semicolons, or parentheses. Do NOT change any other words, grammar, or formatting.\n\nHere is the raw text:\n<raw_text>\n${text}\n</raw_text>\n\nProvide ONLY the modified text in your response, without any conversational filler.`;
  } else if (processingMode === "Grammar Correction Only") {
    prompt = `You are an expert editor. Your ONLY task is to correct any grammar, spelling, and language errors in the following text. Do NOT rewrite the text for tone, style, or structure unless it is grammatically incorrect. Preserve the original meaning, voice, and formatting.\n\nHere is the raw text:\n<raw_text>\n${text}\n</raw_text>\n\nProvide ONLY the corrected text in your response, without any conversational filler.`;
  } else if (processingMode === "De-AI / Humanize Text") {
    prompt = `You are an expert human editor. Your task is to rewrite the following text so it sounds like a person wrote it — not a language model. The text likely contains a bundle of AI signals: word-level patterns, uniform sentence rhythm, generic intros and conclusions, and over-scaffolded structure.

Apply these strict rules in order:

1. REPLACE FOCAL AI WORDS WITH GROUNDED ALTERNATIVES
   - delve / delving → look at, examine, test, get into
   - underscore / underscores → show, make clear, point to, reveal
   - intricate / intricacies → complex, layered, specific — or describe it
   - showcasing / showcases → shows, presents, includes, features
   - emphasizing → shows, makes clear, reminds us
   - advancements → changes, improvements, new tools, findings
   - realm → field, area, context, industry, topic
   - groundbreaking → new, unusual, first of its kind, unexpected
   - aligns / aligning → matches, supports, fits, works with
   - garnered → earned, got, drew, built
   - comprehending → understanding, grasping, learning
   - pivotal → important, central, decisive
   - transformative → change-making, game-changing, world-changing
   - impactful → effective, influential, significant
   - seamless → smooth, easy, uninterrupted
   - holistic → comprehensive, complete, broad
   - robust → strong, reliable, solid, sturdy

2. CUT FILLER PHRASES AND ADVERBS
   - Remove throat-clearing openers: "Here's the thing", "The uncomfortable truth is", "It turns out", "Let me be clear", "The truth is", "I'm going to be honest", "Can we talk about", "Here's what I find interesting"
   - Remove emphasis crutches: "Full stop", "Period", "Let that sink in", "Make no mistake"
   - Remove all filler adverbs: really, just, literally, genuinely, honestly, simply, actually, deeply, truly, fundamentally, inherently, inevitably, interestingly, importantly, crucially, essentially, basically, absolutely, utterly
   - Remove meta-commentary: "Plot twist", "Spoiler", "Hint:", "Let me walk you through", "The rest of this", "In this section we'll", "As we'll see", "I want to explore"
   - Remove vague significance: "The implications are significant", "The reasons are structural", "The stakes are high", "The consequences are real"

3. FIX THE INTRO — ENTER THROUGH A PROBLEM, SCENE, OR CLAIM
   - Replace "In today's rapidly evolving world…" with the specific change, pressure, or event
   - Replace "This article / post explores…" with the question, problem, or scene
   - Replace "Let's dive into…" with a concrete opening sentence
   - Replace "X has become increasingly important…" by showing the consequence instead of claiming importance
   - Replace "In an era of innovation…" by saying what actually changed
   - Replace "Now more than ever…" by naming the specific condition that makes it true

4. FIX THE CONCLUSION — END WITH A CONCRETE CONSEQUENCE
   - Replace "In conclusion…" or "Ultimately…" by ending with the actual point
   - Replace "These findings highlight the importance of…" by stating the effect, the limit, or who it changes things for
   - Replace "The possibilities are endless…" by narrowing to what is actually supported
   - Replace "Only time will tell…" by naming what you expect, or name the uncertainty specifically
   - Replace "As we move forward…" with the next real step or question
   - Replace "This underscores the importance of…" by showing the consequence directly

5. BREAK FORMULAIC STRUCTURES
   - No "Not only X but also Y" — state the two things directly instead
   - No binary contrasts: "Not because X, but because Y" — state Y directly
   - No "X isn't the problem. Y is." or "The answer isn't X. It's Y." — just state the point
   - No negative listing: don't list what something isn't before revealing what it is
   - No dramatic fragmentation: no staccato sentence fragments for emphasis ("[Noun]. That's it. That's the [thing].")
   - No rhetorical setups: "What if I told you", "Here's what I mean", "Think about it"
   - Break balanced three-part lists ("saves time, improves efficiency, and enhances productivity") — break the rhythm or add a specific example

6. VARY RHYTHM DELIBERATELY
   - Mix short sentences (3-5 words), medium, and longer ones — three consecutive sentences of similar length sounds robotic
   - Fragment one sentence if it earns it. Then let a longer one follow.
   - No Wh- sentence starters: don't start sentences with What, When, Where, Which, Who, Why, How
   - Remove all em dashes (—); replace with commas, periods, semicolons, or parentheses
   - Vary paragraph endings — not every paragraph should end with a punchy one-liner

7. USE ACTIVE VOICE WITH REAL SUBJECTS
   - Every sentence needs a human subject doing something. No passive voice.
   - No false agency: inanimate objects don't perform human actions. A complaint doesn't "become a fix" — someone fixed it. Data doesn't "tell us" — someone reads it.
   - Name the person: "The team fixed it that week" beats "the complaint becomes a fix"

8. BE SPECIFIC — ADD ONE LIMIT, CAVEAT, OR CONDITION
   - No vague declaratives that announce importance without naming the thing
   - No lazy extremes (every, always, never, everyone) doing vague work — name the actual scope
   - Say the specific thing, not the abstraction about it
   - Add one limit, caveat, or condition that shows the writer knows the edges of the claim

9. CUT OVER-SMOOTH TRANSITIONS
   - Delete at least one transition phrase (moreover, furthermore, additionally, ultimately, it is worth noting that)
   - The sentences before and after can usually hold together without it

10. TRUST READERS — CUT QUOTABLES
    - State facts directly. Skip softening, justification, and hand-holding
    - If any sentence sounds like a pull-quote or manufactured profundity, rewrite it as a plain statement
    - Skip meta-summary labels: "A key takeaway is…", "The bottom line is…", "Here are N lessons / tips"

Here is the raw text:\n<raw_text>\n${text}\n</raw_text>\n\nProvide ONLY the humanized text in your response, without any conversational filler.`;
  } else if (processingMode === "Simplify") {
    prompt = `You are an expert at plain-English communication. Your task is to simplify the following text so that anyone can understand it — even someone with no background in the subject.

Apply these rules:
- Replace jargon, acronyms, and technical terms with plain everyday words. If a technical term must appear, define it in parentheses on first use.
- Break long sentences into shorter ones (aim for 15–20 words max per sentence).
- Use active voice throughout.
- Replace abstract nouns with concrete verbs where possible (e.g. "make a decision" → "decide").
- If the text contains numbered steps or bullet points, keep that structure — clarity over prose.
- Do NOT add information that wasn't in the original. Do NOT oversimplify to the point of losing accuracy.

Here is the text to simplify:
<raw_text>
${text}
</raw_text>

Provide ONLY the simplified text in your response, without any commentary.`;
  } else if (processingMode === "Formalize") {
    prompt = `You are an expert legal and academic editor. Your task is to rewrite the following text in a formal, professional register suitable for legal documents, academic papers, or official correspondence.

Apply these rules:
- Use precise, unambiguous language. Avoid contractions (e.g. "don't" → "do not").
- Prefer the passive voice where it confers objectivity (e.g. "The committee reviewed" → "The matter was reviewed by the committee"), but use active voice when the subject must be clear.
- Replace colloquialisms and informal phrases with formal equivalents (e.g. "find out" → "ascertain", "look into" → "investigate", "use" → "utilise").
- Ensure all claims are appropriately hedged where necessary (e.g. "appears to", "it is submitted that", "may be construed as").
- Organise complex information into clearly delineated sections or clauses where appropriate.
- Remove em dashes (—) and replace with formal punctuation (semicolons, colons, or parenthetical clauses).
- Correct all grammar and spelling errors, using British English conventions.

Here is the text to formalise:
<raw_text>
${text}
</raw_text>

Provide ONLY the formalised text in your response, without any commentary.`;
  } else if (processingMode === "Email Polish") {
    prompt = `You are an expert email copywriter and communications specialist. Polish the following email for professional, clear, and persuasive impact.

Apply these improvements:
1. Subject line: If present, make it specific, benefit-led, and under 50 characters. If absent, propose one prefixed with "Subject: ".
2. Opening hook: Rewrite the opening sentence to immediately establish relevance. Eliminate generic openers like "I hope this email finds you well."
3. Body: Ensure it is scannable — short paragraphs, active voice, no redundant sentences.
4. Call to action: Ensure exactly one clear, specific CTA near the end (e.g. "Can we schedule a 20-minute call on Thursday?" not "Let me know what you think.").
5. Sign-off: End with a professional but warm sign-off. Preserve the sender's name if present.
6. Remove em dashes (—) and replace with contextually correct punctuation.
7. Correct all grammar and spelling errors.

Preserve the original intent and any specific details (names, dates, figures).

Here is the email to polish:
<raw_email>
${text}
</raw_email>

Provide ONLY the polished email in your response, without any commentary or explanation.`;
  } else {
    prompt = `You are an expert editor and technical writer. Your task is to refine the following rough text.\n\n`;

    if (developerMode) {
      prompt += `The user wants to transform this text into a structured prompt for an AI coding agent.\n`;
    } else {
      prompt += `The target writing context is: ${context}. Adjust tone, structure, and vocabulary appropriately.\n`;
      prompt += `Tone target: ${TONE_INSTRUCTIONS[tone]}\n`;
    }

    prompt += `\nPlease apply the following editing rules:\n`;
    if (editingControls.removeEmDashes) {
      prompt += `- Remove em dashes (—) and replace them with contextually correct punctuation such as commas, periods, semicolons, or parentheses.\n`;
    }
    if (editingControls.grammarCorrection) {
      prompt += `- Correct any grammar, spelling, and language errors.\n`;
    }
    if (editingControls.clarityConciseness) {
      prompt += `- Improve clarity and conciseness. Remove fluff.\n`;
    }
    if (editingControls.structuralRefinement) {
      prompt += `- Refine the structure, improving paragraph flow and sentence clarity.\n`;
    }
    if (editingControls.toneAlignment && !developerMode) {
      prompt += `- Align the tone perfectly with the selected writing context (${context}).\n`;
    }

    if (developerMode) {
      if (structureGenerator) {
        prompt += `\nSince this is a Developer Prompt, reorganize the output into the following explicit sections:\n`;
        prompt += `- Goal\n- Requirements\n- Constraints\n- Tech stack\n- Expected output\n`;
      }
      if (aiPreset !== "None") {
        prompt += `\nFormat the output to match the style commonly used for a ${aiPreset} prompt, ensuring it is immediately usable.\n`;
      }
    }

    if (wordTarget && wordTarget !== "none") {
      const targetMap: Record<string, string> = {
        short: "approximately 100 words",
        medium: "approximately 300 words",
        long: "approximately 500 words",
      };
      const targetDesc = targetMap[wordTarget] ?? `approximately ${wordTarget} words`;
      prompt += `- Target output length: ${targetDesc}. Trim or expand content proportionally to meet this target.\n`;
    }

    if (customStyleGuide?.trim()) {
      prompt += `\nAdditional brand/style guidelines to follow strictly:\n<style_guide>\n${customStyleGuide.trim()}\n</style_guide>\n`;
    }

    prompt += `\nHere is the raw text to refine:\n<raw_text>\n${text}\n</raw_text>\n\nProvide ONLY the refined text in your response, without any conversational filler.`;
  }

  let optimizationPrompt: string | undefined;

  if (developerMode && optimizationPass) {
    optimizationPrompt = `You are an expert AI prompt engineer. Review the following prompt intended for an AI coding agent and optimize it.
Your goals:
- Remove any remaining ambiguity or vague language.
- Tighten instructions to be highly actionable.
- Ensure all requirements are explicit.
- Produce cleaner step-based instructions when appropriate.
- Improve overall compatibility with AI coding tools.

Here is the prompt to optimize:
<prompt>
${prompt}
</prompt>

Provide ONLY the optimized prompt in your response, without any conversational filler.`;
  }

  return { prompt, optimizationPrompt };
}

export function buildSentenceRefinePrompt(
  contextText: string,
  sentence: string,
  options: RefineOptions
): string {
  let prompt = `You are an expert editor. Refine the following sentence to match the required style, tone, and editing rules.

Your task is to produce ONLY the refined version of the single sentence provided below. Do not modify or repeat the surrounding context.

`;

  if (!options.developerMode) {
    prompt += `Target context: ${options.context}\n`;
    prompt += `Tone: ${TONE_INSTRUCTIONS[options.tone]}\n`;
  }

  prompt += `\nEditing rules:\n`;
  if (options.editingControls.removeEmDashes) {
    prompt += `- Replace em dashes (—) with correct punctuation (commas, periods, semicolons, or parentheses).\n`;
  }
  if (options.editingControls.grammarCorrection) {
    prompt += `- Correct grammar, spelling, and language errors.\n`;
  }
  if (options.editingControls.clarityConciseness) {
    prompt += `- Improve clarity and conciseness. Remove fluff.\n`;
  }
  if (options.editingControls.structuralRefinement) {
    prompt += `- Improve sentence flow and structure.\n`;
  }
  if (options.editingControls.toneAlignment && !options.developerMode) {
    prompt += `- Align the tone to "${options.tone}".\n`;
  }

  if (options.customStyleGuide?.trim()) {
    prompt += `\nStyle guide:\n${options.customStyleGuide.trim()}\n`;
  }

  if (contextText.trim()) {
    prompt += `\nSurrounding context (read-only — do NOT modify):\n<context>\n${contextText.trim()}\n</context>\n\n`;
  }

  prompt += `Refine only this sentence:\n<sentence>\n${sentence}\n</sentence>\n\n`;
  prompt += `Provide ONLY the refined sentence in your response. No commentary, no labels, no extra text.`;

  return prompt;
}

export function buildVariantsPrompt(
  originalInput: string,
  currentOutput: string,
  options: RefineOptions,
  count = 2
): string {
  return `You are an expert editor. Below is an original text and one refined version of it.

Original text:
<original>
${originalInput}
</original>

Current refined version:
<current>
${currentOutput}
</current>

Your task: produce ${count} ALTERNATIVE refined versions of the original text. Each alternative should achieve the same goals as the current version but differ meaningfully in sentence structure, phrasing, level of detail, or paragraph organisation.

Context: ${options.context}
Tone: ${options.tone ?? "Professional"}

Format your response as exactly ${count} versions separated by the delimiter "---VARIANT---". Output only the variant text — no labels, numbering, or commentary.`;
}
