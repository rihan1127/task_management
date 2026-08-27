/**
 * AIAnalysisPanel
 * Reusable Groq AI panel that shows priority, category, and story point suggestions.
 * Designed to slot into any form that has a title/description.
 */

import { useState, useCallback, useRef } from 'react';
import GroqAIService from '../services/groqAIService';

// ── Tiny icon components ────────────────────────────────────────────────────
const SparkleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l1.5 4.5L11 9l-4.5 1.5L5 15l-1.5-4.5L-1 9l4.5-1.5L5 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 13l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

// ── Priority/Category colour helpers ────────────────────────────────────────
const PRIORITY_STYLES = {
  urgent: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', dot: 'bg-red-500' },
  high:   { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', dot: 'bg-orange-500' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', dot: 'bg-yellow-500' },
  low:    { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', dot: 'bg-green-500' },
};

const CATEGORY_STYLES = {
  bug:           { bg: 'bg-red-50',     text: 'text-red-600',    emoji: '🐛' },
  feature:       { bg: 'bg-blue-50',    text: 'text-blue-600',   emoji: '✨' },
  improvement:   { bg: 'bg-indigo-50',  text: 'text-indigo-600', emoji: '⚡' },
  documentation: { bg: 'bg-gray-100',   text: 'text-gray-600',   emoji: '📝' },
  refactor:      { bg: 'bg-purple-50',  text: 'text-purple-600', emoji: '🔧' },
  test:          { bg: 'bg-cyan-50',    text: 'text-cyan-600',   emoji: '🧪' },
  deployment:    { bg: 'bg-teal-50',    text: 'text-teal-600',   emoji: '🚀' },
  security:      { bg: 'bg-rose-50',    text: 'text-rose-600',   emoji: '🔒' },
};

const FIB_POINTS = [1, 2, 3, 5, 8, 13];

// ── Confidence bar ──────────────────────────────────────────────────────────
function ConfidenceBar({ value }) {
  const pct = Math.round((value || 0) * 100);
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-yellow-400' : 'bg-gray-400';
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-semibold tabular-nums" style={{ color: 'var(--text-muted)' }}>
        {pct}%
      </span>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
/**
 * @param {object} props
 * @param {string} props.title - Task title (watched for debounced analysis)
 * @param {string} props.description - Task description
 * @param {function} props.onAccept - Called with { priority, category, storyPoints } when user accepts
 * @param {boolean} [props.compact=false] - Compact mode for modals
 */
export default function AIAnalysisPanel({ title, description = '', onAccept, compact = false }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [enhancedDesc, setEnhancedDesc] = useState(null);
  const [loadingDesc, setLoadingDesc] = useState(false);
  const debounceRef = useRef(null);

  const runAnalysis = useCallback(async () => {
    if (!title?.trim() || title.trim().length < 4) {
      setError('Enter at least 4 characters in the title to get AI suggestions.');
      return;
    }
    setLoading(true);
    setError(null);
    setAccepted(false);
    setEnhancedDesc(null);
    try {
      const result = await GroqAIService.analyzeTask(title, description);
      if (result.status === 'success') {
        setAnalysis(result);
      } else if (result.status === 'disabled') {
        setError('AI is not configured. Add your GROQ_API_KEY to the backend .env file.');
      } else {
        setError(result.message || 'AI analysis failed. Please try again.');
      }
    } catch {
      setError('Could not reach AI service.');
    } finally {
      setLoading(false);
    }
  }, [title, description]);

  const handleEnhanceDescription = async () => {
    if (!title?.trim()) return;
    setLoadingDesc(true);
    try {
      const result = await GroqAIService.enhanceDescription(title, description);
      if (result.status === 'success') setEnhancedDesc(result.enhanced_description);
    } finally {
      setLoadingDesc(false);
    }
  };

  const handleAccept = () => {
    if (!analysis) return;
    setAccepted(true);
    onAccept?.({
      priority: analysis.priority?.suggested_priority || 'medium',
      category: analysis.category?.category || 'feature',
      storyPoints: analysis.story_points?.estimated_points || 3,
      enhancedDescription: enhancedDesc || null,
    });
  };

  const pStyles = analysis ? (PRIORITY_STYLES[analysis.priority?.suggested_priority] || PRIORITY_STYLES.medium) : null;
  const cStyles = analysis ? (CATEGORY_STYLES[analysis.category?.category] || CATEGORY_STYLES.feature) : null;

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
            <SparkleIcon />
          </div>
          <span className="text-white font-bold text-sm tracking-tight">Groq AI Assistant</span>
          <span className="text-[10px] text-blue-200 font-semibold bg-white/10 px-2 py-0.5 rounded-full">
            ⚡ Ultra-fast
          </span>
        </div>
        {analysis && (
          <button
            onClick={runAnalysis}
            className="text-white/70 hover:text-white p-1 rounded transition-colors"
            title="Re-analyze"
          >
            <RefreshIcon />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Trigger */}
        {!analysis && !loading && (
          <div className="space-y-3">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Let Groq AI instantly suggest priority, category, and story points based on your task title and description.
            </p>
            {error && (
              <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{error}</p>
            )}
            <button
              type="button"
              onClick={runAnalysis}
              disabled={!title?.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)' }}
            >
              <SparkleIcon />
              Analyze with Groq AI
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-4 gap-3">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
              <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Analyzing with Groq…</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>LPU inference — typically under 150ms</p>
            </div>
          </div>
        )}

        {/* Results */}
        {analysis && !loading && (
          <div className="space-y-3">
            {/* Priority */}
            <div className={`rounded-xl p-3 border ${pStyles.bg} ${pStyles.border}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Priority</span>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${pStyles.bg} ${pStyles.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${pStyles.dot}`} />
                  {analysis.priority?.suggested_priority?.toUpperCase()}
                </div>
              </div>
              <ConfidenceBar value={analysis.priority?.confidence} />
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-secondary)' }}>{analysis.priority?.reasoning}</p>
            </div>

            {/* Category */}
            <div className={`rounded-xl p-3 border ${cStyles.bg}`} style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Category</span>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${cStyles.bg} ${cStyles.text}`}>
                  {cStyles.emoji} {analysis.category?.category}
                </span>
              </div>
              <ConfidenceBar value={analysis.category?.confidence} />
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-secondary)' }}>{analysis.category?.reasoning}</p>
            </div>

            {/* Story Points */}
            <div className="rounded-xl p-3 border" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Story Points</span>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {analysis.story_points?.estimated_points} pts
                </span>
              </div>
              <div className="flex gap-1.5 mb-2">
                {FIB_POINTS.map(p => (
                  <div
                    key={p}
                    className={`flex-1 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                      p === analysis.story_points?.estimated_points
                        ? 'bg-indigo-600 text-white shadow-sm scale-110'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {p}
                  </div>
                ))}
              </div>
              <ConfidenceBar value={analysis.story_points?.confidence} />
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-secondary)' }}>{analysis.story_points?.reasoning}</p>
            </div>

            {/* Enhance Description */}
            {!compact && (
              <div className="rounded-xl p-3 border" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    AI Description
                  </span>
                </div>
                {enhancedDesc ? (
                  <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                    {enhancedDesc}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleEnhanceDescription}
                    disabled={loadingDesc}
                    className="w-full py-1.5 rounded-lg border border-dashed text-xs font-semibold transition-colors hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                  >
                    {loadingDesc ? '✨ Enhancing…' : '✨ Enhance description with AI'}
                  </button>
                )}
              </div>
            )}

            {/* Provider badge */}
            <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
              Powered by <strong>Groq</strong> · {analysis.model}
            </p>

            {/* Accept button */}
            {!accepted ? (
              <button
                type="button"
                onClick={handleAccept}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm text-white shadow-sm transition-all"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                <CheckIcon />
                Apply AI Suggestions
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                <CheckIcon />
                Suggestions Applied!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
