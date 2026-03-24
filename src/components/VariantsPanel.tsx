import { useState } from "react";
import Markdown from "react-markdown";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VariantsPanelProps {
  variants: string[];
  onSelect: (text: string) => void;
  onClose: () => void;
}

export function VariantsPanel({ variants, onSelect, onClose }: VariantsPanelProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = variants.length;

  return (
    <div className="flex-1 flex flex-col bg-card rounded-xl shadow-sm border border-primary/30 overflow-hidden">
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-foreground">
            Variant {activeIndex + 1} of {total}
          </h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground"
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex((i) => i - 1)}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground"
              disabled={activeIndex === total - 1}
              onClick={() => setActiveIndex((i) => i + 1)}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="h-7 text-xs px-3 gap-1"
            onClick={() => onSelect(variants[activeIndex])}
          >
            <Check className="w-3 h-3" />
            Use this
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-primary hover:text-primary/80 px-2"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto prose prose-sm max-w-none">
        <Markdown>{variants[activeIndex]}</Markdown>
      </div>
    </div>
  );
}
