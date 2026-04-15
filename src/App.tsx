import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useAction } from 'convex/react';
import { api } from '../convex/_generated/api';
import { refineText, RefineOptions } from './services/geminiService';
import { generateVariants } from './services/variantsService';
import { PromptVersion, ToneOption } from './types';
import { fleschKincaid } from '@/utils/readability';
import { scorePrompt } from '@/utils/promptScore';
import Markdown from 'react-markdown';
import { Copy, ArrowRightLeft, Loader2, Check, Pin, PinOff, Trash2, History, GitCompare, Shuffle, ChevronDown, FileText, FileDown, BookmarkPlus, Lock, Zap, User, ClipboardPaste, SlidersHorizontal, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DiffView } from '@/components/DiffView';
import { ReadabilityBadge } from '@/components/ReadabilityBadge';
import { VariantsPanel } from '@/components/VariantsPanel';
import { UsageIndicator } from '@/components/UsageIndicator';
import { UpgradeModal } from '@/components/UpgradeModal';
import { authClient } from '@/lib/auth-client';
import { SignInPage } from '@/components/auth/SignInPage';
import { SignUpPage } from '@/components/auth/SignUpPage';
import { HistoryPage } from '@/components/HistoryPage';
import { SuccessPage } from '@/components/SuccessPage';
import { ProfilePage } from '@/components/ProfilePage';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
export type AuthSession = typeof authClient.$Infer.Session;

const CONTEXT_OPTIONS = [
  'Proposal writing',
  'Business reports',
  'Web or app development documentation',
  'Web or app development prompts',
  'General professional writing',
  'Technical explanations',
];

const PRESET_OPTIONS = ['None', 'Cursor coding prompt', 'Claude development prompt', 'GPT coding prompt'];

const FREE_MODES = [
  'Comprehensive Refinement',
  'Remove Em Dashes Only',
  'Grammar Correction Only',
] as const;

const PRO_MODES = [
  'De-AI / Humanize Text',
  'Email Polish',
  'Simplify',
  'Formalize',
] as const;

const PROCESSING_MODES = [...FREE_MODES, ...PRO_MODES];

const TONE_OPTIONS: ToneOption[] = ['Professional', 'Casual', 'Persuasive', 'Academic', 'Empathetic'];

const WORD_TARGET_OPTIONS = [
  { value: 'none', label: 'No target' },
  { value: 'short', label: 'Short (~100 words)' },
  { value: 'medium', label: 'Medium (~300 words)' },
  { value: 'long', label: 'Long (~500 words)' },
  { value: 'custom', label: 'Custom...' },
];

const EDITING_CHIP_LABELS: Record<string, string> = {
  removeEmDashes: 'Em Dashes',
  grammarCorrection: 'Grammar',
  clarityConciseness: 'Clarity',
  structuralRefinement: 'Structure',
  toneAlignment: 'Tone',
};

// ─── Auth Gate ───────────────────────────────────────────────────────────────

export default function App() {
  const { data: session, isPending } = authClient.useSession();
  const [authView, setAuthView] = useState<'signin' | 'signup'>('signin');

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    if (authView === 'signup') {
      return <SignUpPage onSwitchToSignIn={() => setAuthView('signin')} />;
    }
    return <SignInPage onSwitchToSignUp={() => setAuthView('signup')} />;
  }

  return <AppContent session={session} />;
}

// ─── Main App ─────────────────────────────────────────────────────────────────

function AppContent({ session }: { session: AuthSession }) {
  const saveRefinement = useMutation(api.refinements.save);
  const checkAndIncrementUsage = useMutation(api.usage.checkAndIncrement);
  const usageData = useQuery(api.usage.getUsage) ?? { count: 0, limit: 20 as number | null };
  const planData = useQuery(api.subscriptions.getUserPlan) ?? { plan: "free" as const };
  const saveTemplate = useMutation(api.promptTemplates.save);
  const removeTemplate = useMutation(api.promptTemplates.remove);
  const templates = useQuery(api.promptTemplates.list) ?? [];

  const isPro = planData.plan === "pro";
  const [view, setView] = useState<'editor' | 'history' | 'profile'>('editor');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('upgraded') === 'true';
  });

  useEffect(() => {
    if (showSuccess) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [showSuccess]);
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  // Mobile state
  const [mobileTab, setMobileTab] = useState<'input' | 'output'>('input');
  const [showMobileSettings, setShowMobileSettings] = useState(false);

  // Sidebar State — locked by default on lg+, unlocked on smaller screens
  const [isSidebarLocked, setIsSidebarLocked] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // Options State
  const [processingMode, setProcessingMode] = useState(PROCESSING_MODES[0]);
  const [context, setContext] = useState(CONTEXT_OPTIONS[4]);
  const [tone, setTone] = useState<ToneOption>('Professional');
  const [wordTarget, setWordTarget] = useState('none');
  const [customWordTarget, setCustomWordTarget] = useState('');
  const [customStyleGuide, setCustomStyleGuide] = useState('');
  const [styleGuideOpen, setStyleGuideOpen] = useState(false);
  const [developerMode, setDeveloperMode] = useState(false);
  const [editingControls, setEditingControls] = useState({
    removeEmDashes: true,
    grammarCorrection: true,
    clarityConciseness: true,
    structuralRefinement: true,
    toneAlignment: true,
  });
  const [aiPreset, setAiPreset] = useState(PRESET_OPTIONS[0]);
  const [structureGenerator, setStructureGenerator] = useState(false);
  const [optimizationPass, setOptimizationPass] = useState(false);

  // Variants State
  const [variants, setVariants] = useState<string[]>([]);
  const [showVariants, setShowVariants] = useState(false);
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);

  // Readability scores — Pro only
  const inputScore = useMemo(() => isPro && inputText.trim() ? fleschKincaid(inputText) : null, [isPro, inputText]);
  const outputScore = useMemo(() => isPro && outputText.trim() ? fleschKincaid(outputText) : null, [isPro, outputText]);

  // Prompt quality score (Developer Mode only)
  const promptScore = useMemo(() => developerMode && outputText.trim().split(/\s+/).length >= 10 ? scorePrompt(outputText) : null, [developerMode, outputText]);

  // Compare State
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);

  const handleRefine = async () => {
    if (!inputText.trim()) return;
    if (!isPro && (PRO_MODES as readonly string[]).includes(processingMode)) {
      setShowUpgradeModal(true);
      return;
    }
    setIsProcessing(true);
    try {
      await checkAndIncrementUsage({});
      const effectiveWordTarget = wordTarget === 'custom' ? customWordTarget : wordTarget;
      const options: RefineOptions = {
        processingMode,
        context,
        tone,
        developerMode,
        editingControls,
        aiPreset,
        structureGenerator,
        optimizationPass,
        wordTarget: effectiveWordTarget || 'none',
        customStyleGuide,
      };
      const result = await refineText(inputText, options);
      setOutputText(result);
      setMobileTab('output');
      await saveRefinement({
        label: `${processingMode} — ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        inputText,
        outputText: result,
        processingMode,
      });
    } catch (error: any) {
      const msg: string = error.message || '';
      if (msg.includes('USAGE_LIMIT_EXCEEDED')) {
        setShowUpgradeModal(true);
      } else {
        alert(msg || 'Failed to refine text. Please check your connection and try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (extension: 'txt' | 'md') => {
    const blob = new Blob([outputText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `refined-output.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const stripped = outputText.replace(/#{1,6}\s?/g, '').replace(/[*_`~>]/g, '').trim();
    const lines = doc.splitTextToSize(stripped, 180);
    doc.text(lines, 15, 15);
    doc.save('refined-output.pdf');
  };

  const handleGenerateVariants = async () => {
    if (!outputText || !inputText) return;
    setShowVariants(false);
    setCompareMode(false);
    setIsGeneratingVariants(true);
    try {
      const options: RefineOptions = {
        processingMode, context, tone, developerMode,
        editingControls, aiPreset, structureGenerator, optimizationPass,
        wordTarget: 'none', customStyleGuide: undefined,
      };
      const result = await generateVariants(inputText, outputText, options, 2);
      setVariants(result);
      setShowVariants(true);
    } catch (error: any) {
      alert(error.message || 'Failed to generate variants. Please try again.');
    } finally {
      setIsGeneratingVariants(false);
    }
  };

  const handleSelectVariant = (text: string) => {
    setOutputText(text);
    setShowVariants(false);
    setVariants([]);
  };

  const handleSaveTemplate = async () => {
    if (!inputText.trim()) return;
    const name = window.prompt('Template name:', `Template — ${new Date().toLocaleDateString()}`);
    if (!name?.trim()) return;
    await saveTemplate({ name: name.trim(), inputText, preset: aiPreset, structureGenerator, optimizationPass });
  };

  const handleLoadTemplate = (t: { inputText: string; preset: string; structureGenerator: boolean; optimizationPass: boolean }) => {
    setInputText(t.inputText);
    setAiPreset(t.preset);
    setStructureGenerator(t.structureGenerator);
    setOptimizationPass(t.optimizationPass);
  };

  const loadVersion = (version: PromptVersion) => {
    setOutputText(version.text);
    setCompareMode(false);
  };

  const toggleCompare = (versionId: string) => {
    if (compareMode && compareVersionId === versionId) {
      setCompareMode(false);
      setCompareVersionId(null);
    } else {
      setCompareMode(true);
      setCompareVersionId(versionId);
    }
  };

  const compareVersionText = versions.find((v) => v.id === compareVersionId)?.text || '';
  const isComprehensive = processingMode === 'Comprehensive Refinement';
  const refineDisabled = isProcessing || !inputText.trim() || (!isPro && (usageData.limit !== null) && usageData.count >= usageData.limit);

  // ─── Sidebar body (shared between desktop sidebar and mobile sheet) ───────────
  const sidebarBody = (
    <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
      {/* Mode — always visible */}
      <section className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wide">Mode</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setIsSidebarLocked(!isSidebarLocked); setIsSidebarHovered(false); }}
            title={isSidebarLocked ? 'Unlock sidebar' : 'Lock sidebar'}
            className="h-6 w-6 text-muted-foreground/40 hover:text-muted-foreground -mr-1 hidden md:flex"
          >
            {isSidebarLocked ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </Button>
        </div>
        <Select
          value={processingMode}
          onValueChange={(v) => {
            if (!isPro && (PRO_MODES as readonly string[]).includes(v)) {
              setShowUpgradeModal(true);
              return;
            }
            setProcessingMode(v);
          }}
        >
          <SelectTrigger className="w-full bg-muted/40 border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FREE_MODES.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
            {PRO_MODES.map((opt) => (
              <SelectItem key={opt} value={opt} disabled={!isPro}>
                <span className="flex items-center gap-2">
                  {opt}
                  {!isPro && <Lock className="w-3 h-3 text-muted-foreground/50" />}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!isPro && (
          <p className="text-[11px] text-muted-foreground/50">
            4 more modes on{' '}
            <button onClick={() => setShowUpgradeModal(true)} className="text-primary hover:underline">
              Pro
            </button>
          </p>
        )}
      </section>

      {/* Comprehensive-only controls */}
      <div className={`flex flex-col gap-4 transition-opacity duration-200 ${!isComprehensive ? 'opacity-30 pointer-events-none' : ''}`}>

        {/* Output shaping group */}
        <div className="rounded-xl bg-muted/30 border border-border/40 p-3 space-y-3">
          <section className="space-y-1.5">
            <span className="text-[11px] font-medium text-muted-foreground/60">Context</span>
            <Select value={context} onValueChange={setContext} disabled={developerMode}>
              <SelectTrigger className="w-full h-8 text-sm bg-background/60 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTEXT_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          <section className="space-y-1.5">
            <span className="text-[11px] font-medium text-muted-foreground/60">Tone</span>
            <Select value={tone} onValueChange={(v) => setTone(v as ToneOption)} disabled={developerMode}>
              <SelectTrigger className="w-full h-8 text-sm bg-background/60 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          <section className="space-y-1.5">
            <span className="text-[11px] font-medium text-muted-foreground/60">Length target</span>
            <Select
              value={wordTarget}
              onValueChange={(v) => { setWordTarget(v); setCustomWordTarget(''); }}
              disabled={developerMode}
            >
              <SelectTrigger className="w-full h-8 text-sm bg-background/60 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORD_TARGET_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {wordTarget === 'custom' && (
              <Input
                type="number"
                min={50}
                max={5000}
                placeholder="e.g. 250 words"
                value={customWordTarget}
                onChange={(e) => setCustomWordTarget(e.target.value)}
                className="h-8 text-sm bg-background/60 border-border/50"
              />
            )}
          </section>
        </div>

        {/* Editing chips */}
        <section className="space-y-2">
          <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wide">Editing</span>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(editingControls) as Array<keyof typeof editingControls>).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setEditingControls({ ...editingControls, [key]: !editingControls[key] })}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  editingControls[key]
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                {EDITING_CHIP_LABELS[key]}
              </button>
            ))}
          </div>
        </section>

        {/* Style Guide */}
        <section className="space-y-1.5">
          <button
            type="button"
            onClick={() => setStyleGuideOpen(!styleGuideOpen)}
            className="flex items-center justify-between w-full group"
          >
            <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wide group-hover:text-muted-foreground transition-colors">
              Style Guide
              {customStyleGuide && <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-primary inline-block align-middle" />}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground/40 transition-transform duration-200 ${styleGuideOpen ? 'rotate-180' : ''}`} />
          </button>
          {styleGuideOpen && (
            <div className="space-y-1.5">
              <p className="text-[11px] text-muted-foreground/60 leading-relaxed">Brand voice rules applied during Comprehensive Refinement.</p>
              <Textarea
                value={customStyleGuide}
                onChange={(e) => setCustomStyleGuide(e.target.value)}
                placeholder={"e.g.\n- Never use passive voice\n- Address reader as 'you'\n- British English spelling"}
                className="min-h-[100px] bg-muted/30 border-border/50 text-sm resize-none"
              />
              {customStyleGuide && (
                <button
                  type="button"
                  onClick={() => setCustomStyleGuide('')}
                  className="text-[11px] text-muted-foreground/50 hover:text-destructive transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </section>

        {/* Developer Mode */}
        <div className="rounded-xl bg-primary/5 border border-primary/15 p-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground leading-tight">Developer Mode</p>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5 leading-snug">Turn text into structured AI prompts.</p>
            </div>
            <Switch checked={developerMode} onCheckedChange={setDeveloperMode} className="shrink-0" />
          </div>

          {developerMode && (
            <div className="space-y-3 pt-1 border-t border-primary/15">
              <section className="space-y-1.5">
                <span className="text-[11px] font-medium text-muted-foreground/60">Preset</span>
                <Select value={aiPreset} onValueChange={setAiPreset}>
                  <SelectTrigger className="w-full h-8 text-sm bg-background/60 border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </section>
              <div className="space-y-2">
                {([
                  { id: 'structureGenerator', checked: structureGenerator, onChange: setStructureGenerator, label: 'Structure Generator' },
                  { id: 'optimizationPass', checked: optimizationPass, onChange: setOptimizationPass, label: 'Optimization Pass (2nd AI call)' },
                ] as const).map(({ id, checked, onChange, label }) => (
                  <label key={id} className="flex items-center gap-2.5 cursor-pointer group">
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={(v) => onChange(!!v)}
                    />
                    <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors leading-tight">{label}</span>
                  </label>
                ))}
              </div>

              {/* Prompt Templates */}
              <div className="space-y-2 pt-1 border-t border-primary/15">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wide">Templates</span>
                  <button
                    type="button"
                    onClick={handleSaveTemplate}
                    disabled={!inputText.trim()}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground/60 hover:text-primary transition-colors disabled:opacity-40 disabled:pointer-events-none"
                    title="Save current input as template"
                  >
                    <BookmarkPlus className="w-3 h-3" />
                    Save
                  </button>
                </div>
                {templates.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground/40 italic">No saved templates yet.</p>
                ) : (
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-0.5">
                    {templates.map((t) => (
                      <div
                        key={t._id}
                        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 bg-background/60 border border-border/40 group"
                      >
                        <button
                          type="button"
                          onClick={() => handleLoadTemplate(t)}
                          className="flex-1 text-left text-xs text-foreground/80 hover:text-foreground truncate transition-colors"
                          title={t.name}
                        >
                          {t.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeTemplate({ id: t._id })}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all shrink-0"
                          title="Delete template"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ─── Output panel header (shared between mobile and desktop) ─────────────────
  const outputPanelHeader = (
    <div className="bg-muted/50 border-b border-border px-4 py-2 flex items-center justify-between gap-2 shrink-0">
      <div className="flex items-center gap-2 min-w-0 flex-wrap">
        <h3 className="text-sm font-medium text-foreground shrink-0">Refined Output</h3>
        {!isPro && outputText && !developerMode && (
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-primary transition-colors"
            title="Readability scores available on Pro"
          >
            <Lock className="w-3 h-3" />
            Scores
          </button>
        )}
        {promptScore && (
          <span
            className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
              promptScore.total >= 68 ? 'text-green-700 bg-green-100' :
              promptScore.total >= 48 ? 'text-yellow-700 bg-yellow-100' :
              'text-red-700 bg-red-100'
            }`}
            title={`Prompt quality score: ${promptScore.total}/100`}
          >
            {promptScore.label}
          </span>
        )}
        {outputText && inputText && (
          <button
            onClick={() => setShowDiff(!showDiff)}
            title={showDiff ? 'Show rendered output' : 'Show changes'}
            className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border transition-colors shrink-0 ${
              showDiff
                ? 'bg-primary text-primary-foreground border-primary'
                : 'text-muted-foreground border-border hover:border-primary hover:text-primary'
            }`}
          >
            <GitCompare className="w-3 h-3" />
            Changes
          </button>
        )}
        {outputText && inputText && !developerMode && (
          <button
            onClick={handleGenerateVariants}
            disabled={isGeneratingVariants}
            title="Generate alternative versions"
            className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border transition-colors shrink-0 text-muted-foreground border-border hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {isGeneratingVariants
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <Shuffle className="w-3 h-3" />
            }
            {isGeneratingVariants ? 'Generating...' : 'Variants'}
          </button>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost" size="sm"
          onClick={handleCopy}
          disabled={!outputText}
          className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
        >
          {copied ? <Check className="w-3.5 h-3.5 mr-1 text-green-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
          {copied ? 'Copied!' : 'Copy'}
        </Button>
        {isPro ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={!outputText}
              className="inline-flex items-center h-7 text-xs text-muted-foreground hover:text-foreground px-2 rounded-md hover:bg-accent disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              <FileDown className="w-3.5 h-3.5 mr-1" />
              Export
              <ChevronDown className="w-3 h-3 ml-1" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDownload('txt')}>
                <FileText className="w-4 h-4 mr-2" />
                Plain text (.txt)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('md')}>
                <FileText className="w-4 h-4 mr-2" />
                Markdown (.md)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadPDF}>
                <FileDown className="w-4 h-4 mr-2" />
                PDF (.pdf)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="inline-flex items-center h-7 text-xs text-muted-foreground/50 hover:text-primary px-2 rounded-md transition-colors gap-1"
            title="Export available on Pro"
          >
            <Lock className="w-3 h-3" />
            Export
          </button>
        )}
      </div>
    </div>
  );

  const outputPanelBody = (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto prose prose-sm max-w-none">
      {outputText ? (
        showDiff && inputText ? (
          <DiffView
            original={inputText}
            revised={outputText}
            onApply={(text) => { setOutputText(text); setShowDiff(false); }}
          />
        ) : (
          <Markdown>{outputText}</Markdown>
        )
      ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm">
          Refined text will appear here...
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="h-dvh bg-background flex flex-col text-foreground overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 md:px-6 py-3 md:py-4 flex items-center justify-between sticky top-0 z-10 shrink-0">
          <div>
            <h1 className="text-lg md:text-xl font-semibold text-foreground leading-tight">Text Refiner</h1>
            <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Turn messy text into clean, professional writing.</p>
          </div>
          <div className="flex items-center gap-1.5 md:gap-3">
            <span className="text-sm text-muted-foreground hidden lg:block">{session.user.email}</span>
            <UsageIndicator
              count={usageData.count}
              limit={usageData.limit}
              onUpgrade={() => setShowUpgradeModal(true)}
            />
            {!isPro && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUpgradeModal(true)}
                className="gap-1.5 text-xs h-8 border-primary/40 text-primary hover:bg-primary/5"
              >
                <Zap className="w-3 h-3" />
                <span className="hidden sm:inline">Upgrade</span>
              </Button>
            )}
            {/* Desktop nav buttons */}
            <Button
              variant={view === 'history' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView(view === 'history' ? 'editor' : 'history')}
              title="Refinement history"
              className="hidden md:flex text-muted-foreground hover:text-foreground"
            >
              <History className="w-4 h-4" />
            </Button>
            <Button
              variant={view === 'profile' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView(view === 'profile' ? 'editor' : 'profile')}
              title="Account"
              className="hidden md:flex text-muted-foreground hover:text-foreground"
            >
              <User className="w-4 h-4" />
            </Button>
            {view === 'editor' && (
              <>
                {/* Mobile settings button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMobileSettings(true)}
                  title="Settings"
                  className="md:hidden h-9 w-9 text-muted-foreground hover:text-foreground"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </Button>
                {/* Desktop refine button */}
                <Button
                  onClick={handleRefine}
                  disabled={refineDisabled}
                  className="hidden md:flex px-6"
                >
                  {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isProcessing ? 'Refining...' : 'Refine Text'}
                </Button>
              </>
            )}
          </div>
        </header>

        {/* History View */}
        {view === 'history' && (
          <HistoryPage
            onBack={() => setView('editor')}
            onLoadRefinement={(input, output) => {
              setInputText(input);
              setOutputText(output);
              setView('editor');
            }}
            isPro={isPro}
            onUpgrade={() => setShowUpgradeModal(true)}
          />
        )}

        {/* Profile View */}
        {view === 'profile' && (
          <ProfilePage
            session={session}
            onBack={() => setView('editor')}
            onUpgrade={() => { setView('editor'); setShowUpgradeModal(true); }}
          />
        )}

        {/* Editor View */}
        <div className={`flex-1 flex overflow-hidden relative min-h-0 ${view !== 'editor' ? 'hidden' : ''}`}>

          {/* Desktop Sidebar (md+) */}
          <div
            className={`hidden md:block relative flex-shrink-0 transition-all duration-300 z-20 ${
              isSidebarLocked
                ? 'w-80'
                : 'w-2 bg-muted hover:bg-primary/30 cursor-pointer border-r border-border'
            }`}
            onMouseEnter={() => !isSidebarLocked && setIsSidebarHovered(true)}
            onMouseLeave={() => !isSidebarLocked && setIsSidebarHovered(false)}
          >
            <aside
              className={`absolute top-0 left-0 h-full bg-card border-r border-border overflow-y-auto flex flex-col transition-transform duration-300 w-80 ${
                isSidebarLocked
                  ? 'translate-x-0 shadow-none'
                  : isSidebarHovered
                  ? 'translate-x-0 shadow-2xl'
                  : '-translate-x-full shadow-none'
              }`}
            >
              <div className="flex flex-col h-full">
                {sidebarBody}
                {/* Sidebar footer */}
                <div className="px-5 py-4 border-t border-border/50 shrink-0">
                  <button
                    onClick={() => setView('history')}
                    className="flex items-center gap-2 text-sm text-muted-foreground/60 hover:text-foreground transition-colors w-full"
                  >
                    <History className="w-3.5 h-3.5 shrink-0" />
                    <span>Refinement history</span>
                  </button>
                </div>
              </div>
            </aside>
          </div>

          {/* Mobile: tab switcher + single panel */}
          <div className="md:hidden flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
            {/* Tab switcher */}
            <div className="flex border-b border-border bg-card shrink-0">
              <button
                onClick={() => setMobileTab('input')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  mobileTab === 'input'
                    ? 'text-foreground border-b-2 border-primary'
                    : 'text-muted-foreground'
                }`}
              >
                Input
              </button>
              <button
                onClick={() => setMobileTab('output')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${
                  mobileTab === 'output'
                    ? 'text-foreground border-b-2 border-primary'
                    : 'text-muted-foreground'
                }`}
              >
                Output
                {outputText && mobileTab !== 'output' && (
                  <span className="absolute top-2.5 right-[calc(50%-22px)] w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            </div>

            {/* Mobile Input Panel */}
            <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${mobileTab !== 'input' ? 'hidden' : ''}`}>
              <div className="bg-muted/50 border-b border-border px-4 py-2 flex items-center justify-between shrink-0">
                <h3 className="text-sm font-medium text-foreground">Raw Input</h3>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      const text = await navigator.clipboard.readText();
                      if (text) setInputText(text);
                    }}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground px-2"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5 mr-1" />
                    Paste
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setInputText('')}
                    disabled={!inputText}
                    className="h-8 text-xs text-muted-foreground hover:text-destructive px-2"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your rough text or messy ideas here..."
                className="flex-1 w-full p-4 resize-none border-0 rounded-none focus-visible:ring-0 text-foreground shadow-none bg-transparent text-base"
              />
            </div>

            {/* Mobile Output Panel */}
            <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${mobileTab !== 'output' ? 'hidden' : ''}`}>
              {outputPanelHeader}
              {showVariants && variants.length > 0 ? (
                <div className="flex-1 overflow-hidden flex flex-col p-3">
                  <VariantsPanel
                    variants={variants}
                    onSelect={handleSelectVariant}
                    onClose={() => { setShowVariants(false); setVariants([]); }}
                  />
                </div>
              ) : (
                outputPanelBody
              )}
            </div>
          </div>

          {/* Desktop: side-by-side panels (md+) */}
          <main className="hidden md:flex flex-1 overflow-hidden bg-muted/40 p-4 lg:p-6 gap-4 lg:gap-6">
            {/* Input Panel */}
            <div
              className={`flex flex-col bg-card rounded-xl shadow-sm border border-border overflow-hidden ${
                compareMode ? 'hidden' : 'flex-1'
              }`}
            >
              <div className="bg-muted/50 border-b border-border px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-medium text-foreground">Raw Input</h3>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      const text = await navigator.clipboard.readText();
                      if (text) setInputText(text);
                    }}
                    className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5 mr-1" />
                    Paste
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setInputText('')}
                    disabled={!inputText}
                    className="h-7 text-xs text-muted-foreground hover:text-destructive px-2"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your rough text or messy ideas here..."
                className="flex-1 w-full p-4 resize-none border-0 rounded-none focus-visible:ring-0 text-foreground shadow-none bg-transparent"
              />
            </div>

            {/* Output Panel */}
            <div className={`flex-1 flex flex-col bg-card rounded-xl shadow-sm border border-border overflow-hidden ${showVariants ? 'hidden' : ''}`}>
              {outputPanelHeader}
              {outputPanelBody}
            </div>

            {/* Variants Panel */}
            {showVariants && variants.length > 0 && (
              <VariantsPanel
                variants={variants}
                onSelect={handleSelectVariant}
                onClose={() => { setShowVariants(false); setVariants([]); }}
              />
            )}

            {/* Compare Panel */}
            {compareMode && (
              <div className="flex-1 flex flex-col bg-secondary/20 rounded-xl shadow-sm border border-primary/30 overflow-hidden">
                <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">
                    Comparing: {versions.find((v) => v.id === compareVersionId)?.label}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCompareMode(false)}
                    className="h-7 text-xs text-primary hover:text-primary/80 px-2"
                  >
                    Close
                  </Button>
                </div>
                <div className="flex-1 p-6 overflow-y-auto prose prose-sm max-w-none opacity-80">
                  <Markdown>{compareVersionText}</Markdown>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Mobile action bar — sticky above bottom nav */}
        {view === 'editor' && (
          <div className="md:hidden shrink-0 border-t border-border bg-card px-4 py-3">
            <Button
              onClick={handleRefine}
              disabled={refineDisabled}
              className="w-full h-11 text-base font-medium"
            >
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
              {isProcessing ? 'Refining...' : 'Refine Text'}
            </Button>
          </div>
        )}

        {/* Bottom navigation — mobile only */}
        <nav
          className="md:hidden shrink-0 flex border-t border-border bg-card"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <button
            onClick={() => setView('editor')}
            className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors min-h-[56px] ${
              view === 'editor' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-medium">Editor</span>
          </button>
          <button
            onClick={() => setView('history')}
            className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors min-h-[56px] ${
              view === 'history' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] font-medium">History</span>
          </button>
          <button
            onClick={() => setView('profile')}
            className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors min-h-[56px] ${
              view === 'profile' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Account</span>
          </button>
        </nav>
      </div>

      {/* Mobile Settings Bottom Sheet */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          showMobileSettings ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setShowMobileSettings(false)}
        />
        {/* Sheet */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl max-h-[88vh] flex flex-col transition-transform duration-300 ${
            showMobileSettings ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>
          {/* Sheet header */}
          <div className="px-5 py-3 border-b border-border flex items-center justify-between shrink-0">
            <h2 className="text-base font-semibold text-foreground">Settings</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMobileSettings(false)}
              className="h-8 w-8 text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {/* Sheet body */}
          <div className="overflow-y-auto flex-1 flex flex-col">
            {sidebarBody}
          </div>
        </div>
      </div>

      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
      {showSuccess && <SuccessPage onContinue={() => setShowSuccess(false)} />}
    </>
  );
}
