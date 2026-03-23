import { useState } from 'react';
import { refineText, RefineOptions } from './services/geminiService';
import { PromptVersion } from './types';
import Markdown from 'react-markdown';
import { Copy, Save, ArrowRightLeft, Loader2, Check, Pin, PinOff, Trash2 } from 'lucide-react';

const CONTEXT_OPTIONS = [
  'Proposal writing',
  'Business reports',
  'Web or app development documentation',
  'Web or app development prompts',
  'General professional writing',
  'Technical explanations',
];

const PRESET_OPTIONS = ['None', 'Cursor coding prompt', 'Claude development prompt', 'GPT coding prompt'];

const PROCESSING_MODES = [
  'Comprehensive Refinement',
  'Remove Em Dashes Only',
  'Grammar Correction Only',
  'De-AI / Humanize Text'
];

export default function App() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sidebar State
  const [isSidebarLocked, setIsSidebarLocked] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // Options State
  const [processingMode, setProcessingMode] = useState(PROCESSING_MODES[0]);
  const [context, setContext] = useState(CONTEXT_OPTIONS[4]);
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

  // Versioning State
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);
  const [versionLabel, setVersionLabel] = useState('');

  const handleRefine = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    try {
      const options: RefineOptions = {
        processingMode,
        context,
        developerMode,
        editingControls,
        aiPreset,
        structureGenerator,
        optimizationPass,
      };
      const result = await refineText(inputText, options);
      setOutputText(result);
    } catch (error: any) {
      alert(error.message || 'Failed to refine text. Please check your connection and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveVersion = () => {
    if (!outputText.trim()) return;
    const newVersion: PromptVersion = {
      id: Date.now().toString(),
      label: versionLabel || `Version ${versions.length + 1}`,
      text: outputText,
      timestamp: Date.now(),
    };
    setVersions([newVersion, ...versions]);
    setVersionLabel('');
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Text Refiner & Prompt Builder</h1>
          <p className="text-sm text-slate-500">Turn messy text into clean, professional writing.</p>
        </div>
        <button
          onClick={handleRefine}
          disabled={isProcessing || !inputText.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
          {isProcessing ? 'Refining...' : 'Refine Text'}
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Controls */}
        <div 
          className={`relative flex-shrink-0 transition-all duration-300 z-20 ${isSidebarLocked ? 'w-80' : 'w-2 bg-slate-200 hover:bg-indigo-300 cursor-pointer border-r border-slate-300'}`}
          onMouseEnter={() => !isSidebarLocked && setIsSidebarHovered(true)}
          onMouseLeave={() => !isSidebarLocked && setIsSidebarHovered(false)}
        >
          <aside 
            className={`absolute top-0 left-0 h-full bg-white border-r border-slate-200 overflow-y-auto flex flex-col transition-transform duration-300 w-80 ${
              isSidebarLocked ? 'translate-x-0 shadow-none' : isSidebarHovered ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none'
            }`}
          >
            <div className="p-6 flex flex-col gap-8">
              <div className="flex justify-between items-center -mb-4">
                <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Settings</h2>
                <button 
                  onClick={() => {
                    setIsSidebarLocked(!isSidebarLocked);
                    setIsSidebarHovered(false);
                  }}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                  title={isSidebarLocked ? "Unlock Sidebar (Autohide)" : "Lock Sidebar"}
                >
                  {isSidebarLocked ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                </button>
              </div>
              
              {/* Processing Mode */}
              <section>
            <h2 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wider">Processing Mode</h2>
            <select
              value={processingMode}
              onChange={(e) => setProcessingMode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {PROCESSING_MODES.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </section>

          <div className={`flex flex-col gap-8 ${processingMode !== 'Comprehensive Refinement' ? 'opacity-40 pointer-events-none transition-opacity' : 'transition-opacity'}`}>
            {/* Writing Context */}
            <section>
              <h2 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wider">Writing Context</h2>
              <select
                value={context}
                onChange={(e) => setContext(e.target.value)}
                disabled={developerMode}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {CONTEXT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </section>

            {/* Developer Mode */}
            <section className="bg-indigo-50 -mx-6 px-6 py-4 border-y border-indigo-100">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-semibold text-indigo-900 block">Developer Prompt Mode</span>
                  <span className="text-xs text-indigo-700 block mt-1">Transform ideas into structured AI prompts.</span>
                </div>
                <input
                  type="checkbox"
                  checked={developerMode}
                  onChange={(e) => setDeveloperMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-indigo-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 relative"></div>
              </label>

              {developerMode && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-indigo-900 mb-1 block">Preset AI Prompt Output</label>
                    <select
                      value={aiPreset}
                      onChange={(e) => setAiPreset(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {PRESET_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={structureGenerator}
                      onChange={(e) => setStructureGenerator(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-indigo-900">Prompt Structure Generator</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={optimizationPass}
                      onChange={(e) => setOptimizationPass(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-indigo-900">Prompt Optimization Pass (2nd AI Pass)</span>
                  </label>
                </div>
              )}
            </section>

            {/* Editing Controls */}
            <section>
              <h2 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wider">Editing Controls</h2>
              <div className="space-y-3">
                {Object.entries(editingControls).map(([key, value]) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer group">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setEditingControls({ ...editingControls, [key]: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>
                    <span className="text-sm text-slate-700 group-hover:text-slate-900">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* Versioning */}
          <section>
            <h2 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wider">Saved Versions</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Label (e.g., Claude v1)"
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSaveVersion}
                disabled={!outputText.trim()}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-md transition-colors disabled:opacity-50"
                title="Save current output"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {versions.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No saved versions yet.</p>
              ) : (
                versions.map((v) => (
                  <div key={v.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-md p-2">
                    <button
                      onClick={() => loadVersion(v)}
                      className="text-sm text-slate-700 hover:text-indigo-600 font-medium truncate flex-1 text-left"
                    >
                      {v.label}
                    </button>
                    <button
                      onClick={() => toggleCompare(v.id)}
                      className={`p-1 rounded-md transition-colors ${
                        compareVersionId === v.id ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                      }`}
                      title="Compare with current output"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
            </div>
          </aside>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 flex overflow-hidden bg-slate-100 p-6 gap-6">
          {/* Input Panel */}
          <div className={`flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${compareMode ? 'hidden' : 'flex-1'}`}>
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-700">Raw Input</h3>
              <button
                onClick={() => setInputText('')}
                disabled={!inputText}
                className="text-slate-500 hover:text-red-600 disabled:opacity-50 flex items-center gap-1 text-xs font-medium transition-colors"
                title="Clear input"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your rough text or messy ideas here..."
              className="flex-1 w-full p-4 resize-none focus:outline-none text-slate-700"
            />
          </div>

          {/* Output Panel */}
          <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-700">Refined Output</h3>
              <button
                onClick={handleCopy}
                disabled={!outputText}
                className="text-slate-500 hover:text-slate-700 disabled:opacity-50 flex items-center gap-1 text-xs font-medium transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto prose prose-slate prose-sm max-w-none">
              {outputText ? (
                <div className="markdown-body">
                  <Markdown>{outputText}</Markdown>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 italic">
                  Refined text will appear here...
                </div>
              )}
            </div>
          </div>

          {/* Compare Panel (conditionally rendered) */}
          {compareMode && (
            <div className="flex-1 flex flex-col bg-indigo-50/50 rounded-xl shadow-sm border border-indigo-200 overflow-hidden relative">
              <div className="bg-indigo-100/50 border-b border-indigo-200 px-4 py-2 flex items-center justify-between">
                <h3 className="text-sm font-medium text-indigo-900">
                  Comparing with: {versions.find((v) => v.id === compareVersionId)?.label}
                </h3>
                <button
                  onClick={() => setCompareMode(false)}
                  className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                >
                  Close Compare
                </button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto prose prose-indigo prose-sm max-w-none opacity-80">
                <div className="markdown-body">
                  <Markdown>{compareVersionText}</Markdown>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
