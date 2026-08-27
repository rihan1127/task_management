import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardAPI, TaskAPI } from '../services/api';
import { LoadingSpinner } from '../components';
import StatCard from '../components/StatCard';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import { RoleBadge } from '../components/RoleBadge';
import { PermissionGate } from '../components/PermissionGate';
import { usePermissions } from '../hooks/usePermissions';
import { formatDueDate, formatRelative, getInitials, getAvatarColor } from '../utils/formatters';
import classNames from 'classnames';

// ── Role-specific hero greeting ───────────────────────────────────────────────
const ROLE_META = {
  admin:     { emoji: 'crown', greeting: 'System Overview', desc: 'Full visibility across the entire platform.', color: 'from-violet-600 to-indigo-600' },
  manager:   { emoji: 'target', greeting: "Team Dashboard",  desc: 'Your team\'s progress at a glance.',           color: 'from-blue-600 to-cyan-500' },
  developer: { emoji: 'laptop', greeting: 'My Workspace',   desc: 'Your tasks and personal progress.',            color: 'from-emerald-600 to-teal-500' },
  analyst:   { emoji: 'chart', greeting: 'Analytics View',  desc: 'Read-only visibility across all tasks.',        color: 'from-amber-500 to-orange-500' },
};

// ── Mini progress ring ────────────────────────────────────────────────────────
function ProgressRing({ pct = 0, size = 56, stroke = 5, color = '#6366f1' }) {
  const safePct = !Number.isFinite(Number(pct)) ? 0 : Math.min(Math.max(Number(pct), 0), 100);
  const r = Math.max((size - stroke) / 2, 1);
  const circ = 2 * Math.PI * r;
  const offset = Number.isFinite(circ) ? circ - (safePct / 100) * circ : 0;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-gray-200" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={Number.isFinite(offset) ? offset : 0} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
    </svg>
  );
}

// ── My task card (developer view) ─────────────────────────────────────────────
function MyTaskCard({ task, onClick }) {
  const dueOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
  return (
    <div onClick={onClick} className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all hover:shadow-sm"
      style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)' }}>
      <div className={classNames('w-2 h-2 rounded-full flex-shrink-0', {
        'bg-slate-400': task.status === 'pending',
        'bg-blue-500': task.status === 'in_progress',
        'bg-emerald-500': task.status === 'completed',
        'bg-red-500': task.status === 'blocked',
      })} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
        {task.due_date && (
          <p className={classNames('text-xs mt-0.5', dueOverdue ? 'text-red-500 font-medium' : 'text-gray-400')}>
            {dueOverdue ? 'Overdue' : formatDueDate(task.due_date).label}
          </p>
        )}
      </div>
      <PriorityBadge priority={task.priority} />
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { can, role, user } = usePermissions();
  const [stats, setStats] = useState(null);
  const [overdue, setOverdue] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const promises = [DashboardAPI.getStats()];
      if (can('view_all_tasks')) {
        promises.push(DashboardAPI.getOverdueTasks(), DashboardAPI.getUpcomingTasks(7));
      }
      if (role === 'developer' || role === 'analyst') {
        promises.push(TaskAPI.listTasks({ assigned_to: user?.id, page_size: 20 }));
      }
      const results = await Promise.all(promises);
      setStats(results[0].data);
      if (can('view_all_tasks')) {
        setOverdue(results[1]?.data?.tasks || []);
        setUpcoming(results[2]?.data?.tasks || []);
      }
      if (role === 'developer' || role === 'analyst') {
        const idx = can('view_all_tasks') ? 3 : 1;
        setMyTasks(results[idx]?.data?.tasks || []);
      }
    } catch (err) {
      setError('Failed to load dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-24"><LoadingSpinner /></div>;
  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">{error}</div>;

  const tasks = stats?.tasks || {};
  const team  = stats?.team  || {};
  const priorityDist = stats?.priority_distribution || {};
  const trends = stats?.trends || {};
  const me = stats?.current_user || {};
  const priorityMax = Math.max(...Object.values(priorityDist), 1);
  const roleMeta = ROLE_META[role] || ROLE_META.developer;
  const completionRate = Number.isFinite(Number(tasks.completion_rate)) ? Number(tasks.completion_rate) : 0;

  return (
    <div className="space-y-6">

      {/* ── Hero greeting ───────────────────────────────────────────────── */}
      <div className={classNames('rounded-2xl p-6 text-white relative overflow-hidden bg-gradient-to-r', roleMeta.color)}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <RoleBadge role={role} size="md" />
            </div>
            <h1 className="text-2xl font-extrabold mt-1">{roleMeta.greeting}</h1>
            <p className="text-white/70 text-sm mt-1">Welcome back, <strong>{user?.name}</strong> — {roleMeta.desc}</p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-center">
              <div className="relative inline-flex">
                <ProgressRing pct={completionRate} size={64} stroke={5} color="rgba(255,255,255,0.9)" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{completionRate.toFixed(0)}%</span>
                </div>
              </div>
              <p className="text-xs text-white/60 mt-1">Done</p>
            </div>
            <PermissionGate permission="create_task">
              <button onClick={() => navigate('/tasks/new')}
                className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm backdrop-blur-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
                </svg>
                New Task
              </button>
            </PermissionGate>
          </div>
        </div>
      </div>

      {/* ── Metrics strip — adapts per role ────────────────────────────── */}
      {can('view_all_tasks') ? (
        /* Admin + Manager: full system metrics */
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          {[
            { title: 'Total Tasks',  value: tasks.total,       color: 'blue',   path: '/tasks',                    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
            { title: 'Pending',      value: tasks.pending,     color: 'amber',  path: '/tasks?status=pending',     icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            { title: 'In Progress',  value: tasks.in_progress, color: 'purple', path: '/tasks?status=in_progress', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            { title: 'Completed',    value: tasks.completed,   color: 'green',  path: '/tasks?status=completed',   icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
            { title: 'Overdue',      value: tasks.overdue,     color: 'red',    path: '/tasks',                    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
          ].map(s => (
            <StatCard key={s.title} title={s.title} value={s.value} color={s.color}
              onClick={() => navigate(s.path)}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon}/>
              </svg>} />
          ))}
        </div>
      ) : (
        /* Developer / Analyst: personal metrics */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { title: 'My Tasks',      value: me.assigned_total ?? 0, color: 'blue' },
            { title: 'Pending',       value: me.pending        ?? 0, color: 'amber' },
            { title: 'In Progress',   value: me.in_progress    ?? 0, color: 'purple' },
            { title: 'Completed',     value: me.completed      ?? 0, color: 'green' },
          ].map(s => (
            <StatCard key={s.title} title={s.title} value={s.value} color={s.color}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>} />
          ))}
        </div>
      )}

      {/* ── Main content grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Priority Distribution — all roles */}
        <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-base font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Priority Distribution</h2>
          <div className="space-y-4">
            {[
              { key: 'urgent', label: 'Urgent', bar: 'bg-rose-500',   text: 'text-rose-600' },
              { key: 'high',   label: 'High',   bar: 'bg-orange-500', text: 'text-orange-600' },
              { key: 'medium', label: 'Medium', bar: 'bg-amber-400',  text: 'text-amber-600' },
              { key: 'low',    label: 'Low',    bar: 'bg-sky-400',    text: 'text-sky-600' },
            ].map(({ key, label, bar, text }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span className={classNames('text-sm font-bold', text)}>{priorityDist[key] ?? 0}</span>
                </div>
                <div className="w-full rounded-full h-2" style={{ background: 'var(--border)' }}>
                  <div className={classNames('h-2 rounded-full transition-all duration-700', bar)}
                    style={{ width: `${((priorityDist[key] ?? 0) / priorityMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Overview — admin & manager & analyst only */}
        {can('view_team') ? (
          <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <h2 className="text-base font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Team Overview</h2>
            <div className="space-y-3">
              {[
                { label: 'Total Members',      value: team.total_users,          icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                { label: 'Active Contributors', value: team.active_contributors, icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                { label: 'Completion Rate',     value: `${completionRate.toFixed(1)}%`, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                { label: 'Created Today',       value: trends.tasks_created_today ?? 0, icon: 'M12 4v16m8-8H4' },
                { label: 'Completed Today',     value: trends.tasks_completed_today ?? 0, icon: 'M5 13l4 4L19 7' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <span className="text-sm flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon}/>
                    </svg>
                    {item.label}
                  </span>
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Developer: show personal stats card */
          <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <h2 className="text-base font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>My Progress</h2>
            <div className="flex items-center justify-center py-4">
              <div className="relative">
                <ProgressRing pct={me.assigned_total > 0 ? (me.completed / me.assigned_total) * 100 : 0} size={96} stroke={7} color="#10b981" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                    {me.assigned_total > 0 ? Math.round((me.completed / me.assigned_total) * 100) : 0}%
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>done</span>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {[
                { label: 'Assigned', val: me.assigned_total ?? 0, c: 'text-blue-600 bg-blue-50' },
                { label: 'In Progress', val: me.in_progress ?? 0, c: 'text-violet-600 bg-violet-50' },
                { label: 'Completed', val: me.completed ?? 0, c: 'text-emerald-600 bg-emerald-50' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between px-3 py-1.5 rounded-lg"
                  style={{ background: 'var(--bg-muted)' }}>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
                  <span className={classNames('text-xs font-bold px-2 py-0.5 rounded-full', r.c)}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status summary */}
        <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-base font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Status Breakdown</h2>
          <div className="space-y-2.5">
            {[
              { key: 'pending',     label: 'Pending',     val: tasks.pending,     c: 'bg-slate-100 text-slate-700' },
              { key: 'in_progress', label: 'In Progress', val: tasks.in_progress, c: 'bg-blue-100 text-blue-700' },
              { key: 'completed',   label: 'Completed',   val: tasks.completed,   c: 'bg-emerald-100 text-emerald-700' },
              { key: 'blocked',     label: 'Blocked',     val: tasks.blocked,     c: 'bg-red-100 text-red-700' },
            ].map(s => (
              <div key={s.key}
                className="flex items-center justify-between cursor-pointer px-3 py-2 rounded-lg transition-colors"
                style={{ background: 'var(--bg-muted)' }}
                onClick={() => navigate(can('view_all_tasks') ? `/tasks?status=${s.key}` : '/kanban')}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-muted)'}
              >
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                <span className={classNames('text-xs font-bold px-2.5 py-1 rounded-full', s.c)}>{s.val ?? 0}</span>
              </div>
            ))}
          </div>

          {/* Role capability notice */}
          {(role === 'developer' || role === 'analyst') && (
            <div className="mt-4 p-3 rounded-xl text-xs" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)' }}>
              <p className="font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Your access level</p>
              <ul className="space-y-1" style={{ color: 'var(--text-muted)' }}>
                {role === 'developer' && <>
                  <li>&#x2713; View &amp; update your assigned tasks</li>
                  <li>&#x2713; Post comments</li>
                  <li>&#x2717; Cannot create or delete tasks</li>
                  <li>&#x2717; Cannot reassign tasks</li>
                </>}
                {role === 'analyst' && <>
                  <li>&#x2713; Read-only view of all tasks</li>
                  <li>&#x2713; View reports &amp; team data</li>
                  <li>&#x2717; Cannot modify any tasks</li>
                </>}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ── Developer: My Tasks list ──────────────────────────────────── */}
      {(role === 'developer') && myTasks.length > 0 && (
        <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>My Assigned Tasks</h2>
            <button onClick={() => navigate('/kanban')} className="text-xs text-blue-500 hover:text-blue-700 font-semibold">
              Kanban view
            </button>
          </div>
          <div className="space-y-2">
            {myTasks.slice(0, 8).map(t => (
              <MyTaskCard key={t.id} task={t} onClick={() => navigate(`/tasks/${t.id}`)} />
            ))}
          </div>
        </div>
      )}

      {/* ── Admin+Manager: Overdue & Upcoming ────────────────────────── */}
      {can('view_all_tasks') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overdue */}
          <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Overdue Tasks</h2>
              {overdue.length > 0 && (
                <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">{overdue.length}</span>
              )}
            </div>
            {overdue.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                <div className="text-3xl mb-2">&#x2705;</div>
                <p className="text-sm">No overdue tasks — great work!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {overdue.slice(0, 5).map(task => (
                  <div key={task.id}
                    className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors"
                    style={{ background: '#fff1f2', border: '1px solid #fecdd3' }}
                    onClick={() => navigate(`/tasks/${task.id}`)}>
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
                      <p className="text-xs text-red-500 mt-0.5">{task.days_overdue != null ? `${task.days_overdue}d overdue` : 'Overdue'}</p>
                    </div>
                    <PriorityBadge priority={task.priority} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming */}
          <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Due This Week</h2>
              {upcoming.length > 0 && (
                <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">{upcoming.length}</span>
              )}
            </div>
            {upcoming.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                <div className="text-3xl mb-2">&#x1F4C5;</div>
                <p className="text-sm">Nothing due this week</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.slice(0, 5).map(task => {
                  const { label: dueLabel, isSoon } = formatDueDate(task.due_date);
                  return (
                    <div key={task.id}
                      className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors"
                      style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
                      onClick={() => navigate(`/tasks/${task.id}`)}>
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
                        <p className={classNames('text-xs mt-0.5', isSoon ? 'text-amber-600 font-medium' : 'text-gray-400')}>
                          {dueLabel}
                        </p>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
