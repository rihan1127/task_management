/**
 * Groq AI Service
 * Frontend client for AI-powered task analysis features.
 * All calls are backed by Groq's ultra-fast LPU inference (< 150ms).
 */

import apiClient from './api';

const GroqAIService = {
  /**
   * Full AI analysis: priority + category + story points in ONE request.
   * Most efficient — use this when creating or editing a task.
   * @param {string} title
   * @param {string} description
   * @returns {Promise<{status, priority, category, story_points, provider, model}>}
   */
  async analyzeTask(title, description = '') {
    try {
      const { data } = await apiClient.post('/ai/analyze', { title, description });
      return data;
    } catch (err) {
      console.error('[GroqAI] analyzeTask failed:', err?.response?.data || err.message);
      return { status: 'error', message: 'AI analysis unavailable' };
    }
  },

  /**
   * Suggest priority for a task.
   * @returns {Promise<{status, suggested_priority, confidence, reasoning}>}
   */
  async suggestPriority(title, description = '') {
    try {
      const { data } = await apiClient.post('/ai/suggest-priority', { title, description });
      return data;
    } catch (err) {
      console.error('[GroqAI] suggestPriority failed:', err?.response?.data || err.message);
      return { status: 'error', suggested_priority: 'medium' };
    }
  },

  /**
   * Categorize a task (bug/feature/improvement/etc).
   * @returns {Promise<{status, category, confidence, reasoning}>}
   */
  async categorizeTask(title, description = '') {
    try {
      const { data } = await apiClient.post('/ai/categorize', { title, description });
      return data;
    } catch (err) {
      console.error('[GroqAI] categorizeTask failed:', err?.response?.data || err.message);
      return { status: 'error', category: 'feature' };
    }
  },

  /**
   * Estimate Fibonacci story points for a task.
   * @returns {Promise<{status, estimated_points, confidence, reasoning}>}
   */
  async estimateEffort(title, description = '', category = 'feature') {
    try {
      const { data } = await apiClient.post('/ai/estimate-effort', { title, description, category });
      return data;
    } catch (err) {
      console.error('[GroqAI] estimateEffort failed:', err?.response?.data || err.message);
      return { status: 'error', estimated_points: 3 };
    }
  },

  /**
   * Enhance/expand a task description with acceptance criteria.
   * @returns {Promise<{status, enhanced_description}>}
   */
  async enhanceDescription(title, description = '') {
    try {
      const { data } = await apiClient.post('/ai/enhance-description', { title, description });
      return data;
    } catch (err) {
      console.error('[GroqAI] enhanceDescription failed:', err?.response?.data || err.message);
      return { status: 'error' };
    }
  },

  /**
   * Check if the Groq AI service is enabled on the backend.
   * @returns {Promise<{ai_enabled, provider, model, features}>}
   */
  async getStatus() {
    try {
      const { data } = await apiClient.get('/ai/status');
      return data;
    } catch {
      return { ai_enabled: false };
    }
  },
};

export default GroqAIService;
