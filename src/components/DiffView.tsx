import { useMemo, useState } from "react";
import { diffWords } from "diff";
import { CheckCheck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DiffChunk {
  id: string;
  type: "unchanged" | "change";
  value?: string;   // unchanged text
  removed?: string; // original text in a change
  added?: string;   // revised text in a change
}

function buildChunks(original: string, revised: string): DiffChunk[] {
  const parts = diffWords(original, revised);
  const chunks: DiffChunk[] = [];
  let id = 0;
  let i = 0;
  while (i < parts.length) {
    const p = parts[i];
    if (!p.added && !p.removed) {
      chunks.push({ id: `u${id++}`, type: "unchanged", value: p.value });
      i++;
    } else {
      let removed = "";
      let added = "";
      while (i < parts.length && (parts[i].added || parts[i].removed)) {
        if (parts[i].removed) removed += parts[i].value;
        else if (parts[i].added) added += parts[i].value;
        i++;
      }
      chunks.push({ id: `c${id++}`, type: "change", removed, added });
    }
  }
  return chunks;
}

interface DiffViewProps {
  original: string;
  revised: string;
  onApply?: (text: string) => void;
}

export function DiffView({ original, revised, onApply }: DiffViewProps) {
  const chunks = useMemo(() => buildChunks(original, revised), [original, revised]);
  // Track which change chunks have been rejected (all start accepted)
  const [rejected, setRejected] = useState<Set<string>>(new Set());

  const changeChunks = chunks.filter((c) => c.type === "change");
  const rejectedCount = rejected.size;
  const acceptedCount = changeChunks.length - rejectedCount;

  const addedWords = changeChunks
    .filter((c) => !rejected.has(c.id) && c.added)
    .reduce((n, c) => n + c.added!.split(/\s+/).filter(Boolean).length, 0);
  const removedWords = changeChunks
    .filter((c) => !rejected.has(c.id) && c.removed)
    .reduce((n, c) => n + c.removed!.split(/\s+/).filter(Boolean).length, 0);

  const toggle = (id: string) =>
    setRejected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const applyText = useMemo(
    () =>
      chunks
        .map((c) => {
          if (c.type === "unchanged") return c.value!;
          return rejected.has(c.id) ? (c.removed ?? "") : (c.added ?? "");
        })
        .join(""),
    [chunks, rejected]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Stats + actions */}
      <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-border shrink-0 flex-wrap">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
          +{addedWords} added
        </span>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
          −{removedWords} removed
        </span>
        {changeChunks.length > 0 && (
          <>
            <span className="text-xs text-muted-foreground ml-auto">
              {acceptedCount}/{changeChunks.length} accepted
            </span>
            {rejectedCount > 0 && (
              <button
                onClick={() => setRejected(new Set())}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                title="Accept all changes"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
            {onApply && (
              <Button size="sm" className="h-6 text-xs px-3 gap-1" onClick={() => onApply(applyText)}>
                <CheckCheck className="w-3 h-3" />
                Apply
              </Button>
            )}
          </>
        )}
      </div>

      {/* Hint */}
      {changeChunks.length > 0 && onApply && (
        <p className="text-[11px] text-muted-foreground/55 mb-3 shrink-0 leading-relaxed">
          Click any highlighted word to toggle it. <span className="text-green-700">Green</span> = accepted addition &middot; <span className="line-through text-red-500">Red</span> = accepted deletion &middot; <span className="text-amber-700">Amber</span> = rejected.
        </p>
      )}

      {/* Diff body */}
      <div className="flex-1 overflow-y-auto">
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
          {chunks.map((chunk) => {
            if (chunk.type === "unchanged") {
              return <span key={chunk.id}>{chunk.value}</span>;
            }

            const isRejected = rejected.has(chunk.id);

            if (isRejected) {
              return (
                <span key={chunk.id}>
                  {chunk.removed ? (
                    // Rejected change — show the original text in amber; click to re-accept
                    <span
                      className="bg-amber-100 text-amber-800 rounded px-0.5 cursor-pointer hover:bg-amber-200 transition-colors"
                      onClick={() => toggle(chunk.id)}
                      title="Click to accept this change"
                    >
                      {chunk.removed}
                    </span>
                  ) : (
                    // Pure insertion that was rejected — show a ghost dot so it's still clickable
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-sm border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-green-500 transition-colors align-middle mx-0.5"
                      onClick={() => toggle(chunk.id)}
                      title="Click to re-accept this addition"
                    />
                  )}
                </span>
              );
            }

            // Accepted state
            return (
              <span key={chunk.id}>
                {chunk.removed && (
                  <del
                    className="bg-red-50 text-red-500 line-through decoration-red-400 rounded px-0.5 cursor-pointer hover:bg-red-100 transition-colors"
                    onClick={() => toggle(chunk.id)}
                    title="Click to keep this text"
                  >
                    {chunk.removed}
                  </del>
                )}
                {chunk.added && (
                  <mark
                    className="bg-green-100 text-green-900 rounded px-0.5 not-italic cursor-pointer hover:bg-green-200 transition-colors"
                    onClick={() => toggle(chunk.id)}
                    title="Click to reject this change"
                  >
                    {chunk.added}
                  </mark>
                )}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
}
