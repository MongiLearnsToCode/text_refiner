import { useState, useMemo } from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import Markdown from "react-markdown";
import {
  Trash2, ArrowUpLeft, ChevronDown, Pencil, Check, X,
  Clock, ArrowLeft, LayoutList, LayoutGrid, Search, SlidersHorizontal, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ViewMode = "list" | "grid";

const DATE_FILTERS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];

const FREE_HISTORY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface HistoryPageProps {
  onLoadRefinement: (inputText: string, outputText: string) => void;
  onBack: () => void;
  isPro: boolean;
  onUpgrade: () => void;
}

export function HistoryPage({ onLoadRefinement, onBack, isPro, onUpgrade }: HistoryPageProps) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.refinements.list,
    {},
    { initialNumItems: 20 }
  );

  const remove = useMutation(api.refinements.remove);
  const updateLabel = useMutation(api.refinements.updateLabel);

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Free plan: only show last 30 days
  const planFilteredResults = useMemo(() =>
    isPro ? results : results.filter((r) => Date.now() - r._creationTime < FREE_HISTORY_MS),
    [results, isPro]
  );

  const hiddenCount = results.length - planFilteredResults.length;

  const availableModes = useMemo(() => {
    const modes = new Set(planFilteredResults.map((r) => r.processingMode));
    return Array.from(modes).sort();
  }, [planFilteredResults]);

  const filteredResults = useMemo(() => {
    return planFilteredResults.filter((item) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!item.label.toLowerCase().includes(q) && !item.inputText.toLowerCase().includes(q) && !item.outputText.toLowerCase().includes(q)) return false;
      }
      if (modeFilter !== "all" && item.processingMode !== modeFilter) return false;
      if (dateFilter !== "all") {
        const age = Date.now() - item._creationTime;
        if (dateFilter === "today" && age > 86_400_000) return false;
        if (dateFilter === "week" && age > 604_800_000) return false;
        if (dateFilter === "month" && age > 2_592_000_000) return false;
      }
      return true;
    });
  }, [results, searchQuery, modeFilter, dateFilter]);

  const hasActiveFilters = searchQuery || modeFilter !== "all" || dateFilter !== "all";

  const startEdit = (id: string, currentLabel: string) => {
    setEditingId(id);
    setEditLabel(currentLabel);
  };

  const saveEdit = async (id: Id<"refinements">) => {
    if (editLabel.trim()) await updateLabel({ id, label: editLabel.trim() });
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const isEmpty = planFilteredResults.length === 0 && status === "Exhausted";
  const isFilteredEmpty = filteredResults.length === 0 && !isEmpty;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        {/* Title row */}
        <div className="px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="gap-2 font-medium">
              <ArrowLeft className="w-4 h-4" />
              Back to Editor
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <h2 className="text-sm font-semibold text-foreground">Refinement History</h2>
            {planFilteredResults.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {hasActiveFilters
                  ? `${filteredResults.length} of ${planFilteredResults.length}`
                  : planFilteredResults.length}{" "}
                {planFilteredResults.length === 1 ? "entry" : "entries"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={() => setViewMode("list")} title="List view">
              <LayoutList className="w-3.5 h-3.5" />
            </Button>
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={() => setViewMode("grid")} title="Grid view">
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Filter row */}
        <div className="px-6 py-2.5 flex items-center gap-3 border-t border-border/50 bg-muted/20">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search labels, input, output…"
              className="pl-8 h-8 text-sm bg-background/60 border-border/50"
            />
          </div>
          <Select value={modeFilter} onValueChange={setModeFilter}>
            <SelectTrigger className="w-44 h-8 text-sm bg-background/60 border-border/50">
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-muted-foreground/60 shrink-0" />
              <SelectValue placeholder="All modes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modes</SelectItem>
              {availableModes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-36 h-8 text-sm bg-background/60 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_FILTERS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <button
              onClick={() => { setSearchQuery(""); setModeFilter("all"); setDateFilter("all"); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Free-tier history limit banner */}
      {!isPro && hiddenCount > 0 && (
        <div className="px-6 py-3 bg-primary/5 border-b border-primary/15 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing last 30 days · <strong>{hiddenCount}</strong> older {hiddenCount === 1 ? "entry" : "entries"} hidden
          </p>
          <button
            onClick={onUpgrade}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5" />
            Upgrade for full history
          </button>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <Clock className="w-10 h-10 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">No refinements yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Refinements are saved automatically when you use the editor.
            </p>
            <Button variant="outline" onClick={onBack} className="mt-6 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Go to Editor
            </Button>
          </div>
        ) : isFilteredEmpty ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <Search className="w-10 h-10 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">No results match your filters</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Try adjusting the search or filter criteria.</p>
            <button
              onClick={() => { setSearchQuery(""); setModeFilter("all"); setDateFilter("all"); }}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : viewMode === "list" ? (
          <ListView
            results={filteredResults}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
            editingId={editingId}
            editLabel={editLabel}
            setEditLabel={setEditLabel}
            startEdit={startEdit}
            saveEdit={saveEdit}
            cancelEdit={cancelEdit}
            formatDate={formatDate}
            onLoadRefinement={onLoadRefinement}
            remove={remove}
          />
        ) : (
          <GridView
            results={filteredResults}
            editingId={editingId}
            editLabel={editLabel}
            setEditLabel={setEditLabel}
            startEdit={startEdit}
            saveEdit={saveEdit}
            cancelEdit={cancelEdit}
            formatDate={formatDate}
            onLoadRefinement={onLoadRefinement}
            remove={remove}
          />
        )}

        {status === "CanLoadMore" && (
          <div className="flex justify-center pt-6">
            <Button variant="outline" onClick={() => loadMore(20)}>
              Load more
            </Button>
          </div>
        )}
        {status === "LoadingMore" && (
          <div className="flex justify-center pt-6">
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared types ─────────────────────────────────────────────────────────────

interface RefinementItem {
  _id: Id<"refinements">;
  _creationTime: number;
  label: string;
  inputText: string;
  outputText: string;
  processingMode: string;
}

interface SharedProps {
  results: RefinementItem[];
  editingId: string | null;
  editLabel: string;
  setEditLabel: (v: string) => void;
  startEdit: (id: string, label: string) => void;
  saveEdit: (id: Id<"refinements">) => void;
  cancelEdit: () => void;
  formatDate: (ts: number) => string;
  onLoadRefinement: (input: string, output: string) => void;
  remove: (args: { id: Id<"refinements"> }) => void;
}

// ─── Inline label editor ──────────────────────────────────────────────────────

function LabelEditor({
  id, label, editingId, editLabel, setEditLabel, startEdit, saveEdit, cancelEdit,
}: {
  id: Id<"refinements">;
  label: string;
  editingId: string | null;
  editLabel: string;
  setEditLabel: (v: string) => void;
  startEdit: (id: string, label: string) => void;
  saveEdit: (id: Id<"refinements">) => void;
  cancelEdit: () => void;
}) {
  if (editingId === id) {
    return (
      <div className="flex items-center gap-1.5 min-w-0">
        <Input
          value={editLabel}
          onChange={(e) => setEditLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveEdit(id);
            if (e.key === "Escape") cancelEdit();
          }}
          className="h-7 text-sm"
          autoFocus
        />
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-primary" onClick={() => saveEdit(id)}>
          <Check className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground" onClick={cancelEdit}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="font-medium text-sm text-foreground truncate">{label}</span>
      <button
        onClick={() => startEdit(id, label)}
        className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      >
        <Pencil className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────

function ListView({
  results, expandedId, setExpandedId, ...shared
}: SharedProps & { expandedId: string | null; setExpandedId: (id: string | null) => void }) {
  return (
    <div className="space-y-2.5">
      {results.map((item) => (
        <div key={item._id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <LabelEditor id={item._id} label={item.label} {...shared} />
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{shared.formatDate(item._creationTime)}</span>
                <Badge variant="outline" className="text-xs px-1.5 py-0">{item.processingMode}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary"
                title="Load into editor" onClick={() => shared.onLoadRefinement(item.inputText, item.outputText)}
              >
                <ArrowUpLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                title="Delete" onClick={() => shared.remove({ id: item._id })}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost" size="icon"
                className={`h-7 w-7 text-muted-foreground transition-transform duration-200 ${expandedId === item._id ? "rotate-180" : ""}`}
                onClick={() => setExpandedId(expandedId === item._id ? null : item._id)}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {expandedId === item._id && (
            <div className="border-t border-border grid grid-cols-2 divide-x divide-border">
              <div className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Input</p>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{item.inputText}</p>
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Output</p>
                <div className="prose prose-sm max-w-none"><Markdown>{item.outputText}</Markdown></div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Grid view ────────────────────────────────────────────────────────────────

function GridView({ results, ...shared }: SharedProps) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
      {results.map((item) => (
        <div key={item._id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
          {/* Card header */}
          <div className="px-4 pt-4 pb-3">
            <LabelEditor id={item._id} label={item.label} {...shared} />
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">{shared.formatDate(item._creationTime)}</span>
              <Badge variant="outline" className="text-xs px-1.5 py-0">{item.processingMode}</Badge>
            </div>
          </div>

          {/* Output snippet */}
          <div className="px-4 flex-1">
            <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed">
              {item.outputText.replace(/[#*`_>]/g, "").trim()}
            </p>
          </div>

          {/* Card footer */}
          <div className="px-3 py-2 mt-3 border-t border-border flex items-center justify-end gap-1">
            <Button
              variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary"
              title="Load into editor" onClick={() => shared.onLoadRefinement(item.inputText, item.outputText)}
            >
              <ArrowUpLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
              title="Delete" onClick={() => shared.remove({ id: item._id })}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
