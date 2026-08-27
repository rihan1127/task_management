import { useState, useEffect } from 'react';
import { TaskAPI } from '../services/api';
import { EpicIcon } from '../components/JiraIcons';
import { LoadingSpinner } from '../components';
import { useNotifications } from '../context/NotificationContext';
import { formatDate } from '../utils/formatters';

const EPICS = [
  { name: 'Security & Auth', desc: 'JWT authentication, RBAC hierarchy, refresh tokens, audit logs', quarter: 'Q3 2026', color: 'from-violet-500 to-indigo-600' },
  { name: 'User Experience', desc: 'Jira-grade UI redesign, dark mode, slide-out inspector drawers', quarter: 'Q3 2026', color: 'from-blue-500 to-cyan-500' },
  { name: 'DevOps & Infrastructure', desc: 'PostgreSQL clustering, Docker multi-stage containers, CI/CD pipelines', quarter: 'Q4 2026', color: 'from-emerald-500 to-teal-600' },
  { name: 'Real-time Collaboration', desc: 'WebSocket live sync, active typing alerts, instant board refresh', quarter: 'Q4 2026', color: 'from-amber-500 to-orange-500' },
  { name: 'Developer Platform', desc: 'Public OpenAPI/Swagger documentation and webhook integrations', quarter: 'Q1 2027', color: 'from-rose-500 to-pink-600' },
];

export default function Roadmap() {
  const { notify } = useNotifications();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    TaskAPI.listTasks({ page_size: 100 })
      .then(res => setTasks(res.data.items || []))
      .catch(() => notify('Failed to load roadmap tasks', 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Roadmap & Epics Timeline</h1>
          <p className="text-sm text-gray-500 mt-0.5">High-level strategic initiatives, epics, and release timeline</p>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="space-y-4">
        {EPICS.map(epic => {
          const epicTasks = tasks.filter(t => t.epic_name === epic.name);
          const completedTasks = epicTasks.filter(t => t.status === 'completed');
          const totalPoints = epicTasks.reduce((s, t) => s + (t.story_points || 0), 0);
          const completedPoints = completedTasks.reduce((s, t) => s + (t.story_points || 0), 0);
          const pct = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : (epicTasks.length > 0 ? Math.round((completedTasks.length / epicTasks.length) * 100) : 0);

          return (
            <div
              key={epic.name}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4 transition-all hover:border-blue-300"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${epic.color} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
                    <EpicIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>{epic.name}</h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        {epic.quarter}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 max-w-2xl">{epic.desc}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold" style={{ color: 'var(--text-primary)' }}>{pct}% complete</span>
                  <p className="text-xs text-gray-400 mt-0.5">{completedTasks.length} of {epicTasks.length} issues done ({completedPoints}/{totalPoints} pts)</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${epic.color} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Epic Issue Chips */}
              {epicTasks.length > 0 && (
                <div className="flex gap-2 flex-wrap pt-1">
                  {epicTasks.map(t => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border border-gray-200 font-medium"
                      style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)' }}
                    >
                      <span className="font-bold text-gray-400">PROJ-{t.id}</span>
                      <span className="truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>{t.title}</span>
                      <span className={`w-2 h-2 rounded-full ${t.status === 'completed' ? 'bg-emerald-500' : t.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-400'}`} />
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
