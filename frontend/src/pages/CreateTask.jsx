import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TaskAPI, UserAPI } from '../services/api';
import { Button, LoadingSpinner } from '../components';
import GroqAIService from '../services/groqAIService';

// ── Icons ──────────────────────────────────────────────────────────────────
const SparklesIcon = () => (
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

const BoltIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2L3 14h8v8l10-12h-8V2z" />
  </svg>
);

export default function CreateTask() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: '',
    due_date: '',
    story_points: '3',
    issue_type: 'story',
  });

  const [errors, setErrors] = useState({});

  // Inline AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiEnhanceLoading, setAiEnhanceLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiMessage, setAiMessage] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await UserAPI.listUsers();
      setUsers(response.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // ── Inline AI: Auto-Suggest Priority & Points from Title ─────────────────────
  const handleAISuggest = async () => {
    if (!formData.title.trim()) {
      setErrors(prev => ({ ...prev, title: 'Enter a summary first to run AI suggestions' }));
      return;
    }
    setAiLoading(true);
    setAiMessage(null);
    try {
      const result = await GroqAIService.analyzeTask(formData.title, formData.description);
      if (result && result.status === 'success') {
        const suggestedPri = result.priority?.suggested_priority || 'medium';
        const suggestedPts = String(result.story_points?.estimated_points || 3);
        const suggestedCat = result.category?.category || 'feature';

        setFormData(prev => ({
          ...prev,
          priority: suggestedPri,
          story_points: suggestedPts,
          issue_type: suggestedCat === 'bug' ? 'bug' : 'story',
        }));

        setAiSuggestions({
          priority: suggestedPri,
          points: suggestedPts,
          reasoning: result.priority?.reasoning || result.story_points?.reasoning,
          confidence: Math.round((result.priority?.confidence || 0.8) * 100),
        });

        setAiMessage('✨ AI auto-filled Priority, Story Points & Issue Type!');
        setTimeout(() => setAiMessage(null), 5000);
      } else {
        setAiMessage('AI suggestion unavailable. Please check backend config.');
      }
    } catch (err) {
      console.error('AI suggest error:', err);
      setAiMessage('Failed to get AI suggestions.');
    } finally {
      setAiLoading(false);
    }
  };

  // ── Inline AI: Enhance Description directly in textarea ─────────────────────
  const handleAIEnhanceDescription = async () => {
    if (!formData.title.trim()) {
      setErrors(prev => ({ ...prev, title: 'Enter a summary before enhancing description' }));
      return;
    }
    setAiEnhanceLoading(true);
    try {
      const result = await GroqAIService.enhanceDescription(formData.title, formData.description);
      if (result && result.status === 'success' && result.enhanced_description) {
        setFormData(prev => ({ ...prev, description: result.enhanced_description }));
        setAiMessage('✨ AI enhanced description with acceptance criteria!');
        setTimeout(() => setAiMessage(null), 5000);
      }
    } catch (err) {
      console.error('AI enhance error:', err);
    } finally {
      setAiEnhanceLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Task summary is required';
    if (formData.title.length > 255) newErrors.title = 'Summary must be less than 255 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
        due_date: formData.due_date ? `${formData.due_date}T00:00:00` : null,
        story_points: formData.story_points ? parseInt(formData.story_points) : null,
        issue_type: formData.issue_type || 'story',
      };

      await TaskAPI.createTask(payload);
      navigate('/tasks?success=Issue created successfully');
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errorMessage = Array.isArray(detail)
        ? detail.map(e => e.msg || JSON.stringify(e)).join('; ')
        : (typeof detail === 'string' ? detail : 'Failed to create task');
      setError(errorMessage);
      console.error('Error creating task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="max-w-3xl mx-auto py-4">
      {/* Top Breadcrumb & Title */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 mb-1">
            <span>PROJECT</span>
            <span>/</span>
            <span>ISSUES</span>
            <span>/</span>
            <span className="text-gray-500">NEW</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900" style={{ color: 'var(--text-primary)' }}>
            Create Issue
          </h1>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-sky-200 text-sky-700 bg-sky-50 hover:bg-sky-100 transition-all"
        >
          ← Back
        </button>
      </div>

      {/* Global AI Feedback Toast */}
      {aiMessage && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-500/20 animate-slideUp">
          <BoltIcon />
          <span>{aiMessage}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Main Single Form Card */}
      <div
        className="rounded-2xl border bg-white shadow-xl shadow-sky-900/5 p-6 md:p-8 space-y-6"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Issue Type Selector Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
              Issue Type
            </label>
            <div className="grid grid-cols-4 gap-2 p-1 rounded-xl bg-sky-50 border border-sky-100">
              {[
                { id: 'story', label: 'Story', icon: '📗' },
                { id: 'task',  label: 'Task',  icon: '🟦' },
                { id: 'bug',   label: 'Bug',   icon: '🔴' },
                { id: 'epic',  label: 'Epic',  icon: '🟪' },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, issue_type: t.id }))}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    formData.issue_type === t.id
                      ? 'bg-white text-sky-700 shadow-sm border border-sky-200'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Issue Summary Input WITH EMBEDDED GROQ AI BUTTON */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                Issue Summary <span className="text-rose-500">*</span>
              </label>

              {/* ✨ Embedded AI Autofill Action inside label/toolbar */}
              <button
                type="button"
                onClick={handleAISuggest}
                disabled={aiLoading || !formData.title.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-sky-700 bg-sky-100 hover:bg-sky-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-sky-300 shadow-sm"
                title="Automatically analyze title and populate priority, story points, and type using ultra-fast Groq AI"
              >
                {aiLoading ? (
                  <>
                    <span className="w-3 h-3 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                    <span>AI Analyzing...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon />
                    <span>✨ AI Autofill</span>
                  </>
                )}
              </button>
            </div>

            {/* Input with inline AI trigger */}
            <div className="relative">
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.ctrlKey) handleAISuggest();
                }}
                placeholder="e.g. Implement user permission roles and dashboard analytics"
                className={`w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all ${
                  errors.title
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                    : 'border-sky-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100'
                }`}
                style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
                required
              />
            </div>
            {errors.title && <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.title}</p>}

            {/* AI Suggestion Indicator Pill */}
            {aiSuggestions && (
              <div className="mt-2 flex items-center gap-2 p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900">
                <span className="font-bold text-sky-600">✨ AI Suggestion:</span>
                <span>Priority set to <strong>{aiSuggestions.priority.toUpperCase()}</strong> ({aiSuggestions.confidence}% confidence) · Story points estimated at <strong>{aiSuggestions.points} pts</strong></span>
              </div>
            )}
          </div>

          {/* Description WITH EMBEDDED AI ENHANCER TOOLBAR */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                Description
              </label>

              {/* ✨ Embedded AI Enhance Description Action Button */}
              <button
                type="button"
                onClick={handleAIEnhanceDescription}
                disabled={aiEnhanceLoading || !formData.title.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 disabled:opacity-40 transition-all shadow-sm"
                title="Generate structured acceptance criteria and details based on summary"
              >
                {aiEnhanceLoading ? (
                  <>
                    <span className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span>Enhancing...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon />
                    <span>✨ AI Enhance Description</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={5}
              placeholder="Provide context, acceptance criteria, or reproduction steps..."
              className="w-full px-4 py-3 rounded-xl border border-sky-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-sm outline-none transition-all resize-y"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Priority & Story Points Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-sm font-semibold outline-none transition-all"
                style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
              >
                <option value="low">⬇ Low Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="high">⬆ High Priority</option>
                <option value="urgent">🔴 Urgent / Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Story Points (Fibonacci)
              </label>
              <select
                name="story_points"
                value={formData.story_points}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-sm font-semibold outline-none transition-all"
                style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
              >
                <option value="1">1 pt — Trivial (&lt; 1 hr)</option>
                <option value="2">2 pts — Simple (1-3 hrs)</option>
                <option value="3">3 pts — Small (Half day)</option>
                <option value="5">5 pts — Medium (1-2 days)</option>
                <option value="8">8 pts — Large (3-5 days)</option>
                <option value="13">13 pts — Very Complex (1+ wk)</option>
              </select>
            </div>
          </div>

          {/* Assignee & Due Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Assignee
              </label>
              <select
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-sm outline-none transition-all"
                style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role || u.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-sm outline-none transition-all"
                style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {/* Form Submit & Cancel Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-sky-100">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-extrabold text-white bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Issue...</span>
                </>
              ) : (
                <>
                  <span>Create Issue</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
