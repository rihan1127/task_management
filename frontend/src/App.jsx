import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TasksList from './pages/TasksList';
import TaskDetail from './pages/TaskDetail';
import CreateTask from './pages/CreateTask';
import Users from './pages/Users';
import ExternalData from './pages/ExternalData';
import KanbanView from './pages/KanbanView';
import Backlog from './pages/Backlog';
import Roadmap from './pages/Roadmap';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { NotificationCenter, ToastStack } from './components/NotificationCenter';
import { ProtectedPage } from './components/PermissionGate';
import { usePermissions } from './hooks/usePermissions';
import { RoleBadge } from './components/RoleBadge';
import { CreateIssueModal } from './components';
import './App.css';

// ─── Jira Navigation SVG Icons ───────────────────────────────────────────────
const Icons = {
  Dashboard: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Roadmap: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Board: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  ),
  Backlog: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  Tasks: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  External: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  Menu: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Sun: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M18.364 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  ),
  Moon: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
};

const ALL_NAV_ITEMS = [
  { to: '/',         icon: Icons.Dashboard, label: 'Dashboard',   exact: true,  permission: null },
  { to: '/roadmap',  icon: Icons.Roadmap,   label: 'Roadmap',     exact: false, permission: 'view_kanban' },
  { to: '/kanban',   icon: Icons.Board,     label: 'Board',       exact: false, permission: 'view_kanban' },
  { to: '/backlog',  icon: Icons.Backlog,   label: 'Backlog',     exact: false, permission: 'view_kanban' },
  { to: '/tasks',    icon: Icons.Tasks,     label: 'All Issues',  exact: false, permission: 'view_all_tasks' },
  { to: '/users',    icon: Icons.Users,     label: 'Team',        exact: false, permission: 'manage_users' },
  { to: '/external', icon: Icons.External,  label: 'Integrations',exact: false, permission: 'view_externals' },
];

function useNavItems() {
  const { can } = usePermissions();
  return ALL_NAV_ITEMS.filter(item => item.permission === null || can(item.permission));
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg-app)' }}>
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  return (
    <button
      id="theme-toggle"
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
      style={{ color: 'var(--text-secondary)' }}
    >
      {isDark ? <Icons.Sun /> : <Icons.Moon />}
    </button>
  );
}

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { user, logout } = useAuth();
  const navItems = useNavItems();
  const { can } = usePermissions();

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-app)' }}>
      {/* ── Jira Sidebar ── */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-[72px]'} transition-all duration-300 flex flex-col flex-shrink-0`}
        style={{ background: 'var(--bg-sidebar)' }}
      >
        {/* Project Header */}
        <div className="px-4 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {sidebarOpen && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
                J
              </div>
              <div className="min-w-0">
                <span className="font-bold text-sm tracking-tight text-white block truncate">TaskHub Software</span>
                <span className="text-[10px] text-gray-400 block tracking-wider uppercase font-semibold">Scrum Project</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--sidebar-text)' }}
            title={sidebarOpen ? 'Collapse' : 'Expand'}
          >
            <Icons.Menu />
          </button>
        </div>

        {/* Planning Navigation */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {sidebarOpen && (
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Planning & Work
            </div>
          )}
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <NavLink key={to} to={to} icon={<Icon />} label={label} open={sidebarOpen} exact={exact} />
          ))}
        </div>

        {/* User + Logout */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className={`flex items-center gap-3 ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.name?.[0] || 'U'}
            </div>
            {sidebarOpen && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
                  <div className="mt-0.5">
                    <RoleBadge role={user?.role} />
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                  style={{ color: 'var(--sidebar-text)' }}
                >
                  <Icons.Logout />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main Workspace ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Jira Top Bar */}
        <header className="px-6 py-3 flex-shrink-0 flex items-center justify-between gap-4"
          style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            {/* Global Jira + Create Button */}
            {can('create_task') && (
              <button
                id="jira-global-create-btn"
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex-shrink-0"
              >
                <span className="text-sm font-black">+</span> Create
              </button>
            )}

            {/* Global Search */}
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="search"
                placeholder="Search issues, keys (PROJ-1)..."
                className="pl-9 pr-4 py-1.5 rounded-lg w-full text-xs outline-none transition-all"
                style={{
                  background: 'var(--bg-muted)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationCenter />
          </div>
        </header>

        {/* Page Container */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 max-w-screen-xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/roadmap" element={
                <ProtectedPage permission="view_kanban"><Roadmap /></ProtectedPage>
              } />
              <Route path="/kanban" element={
                <ProtectedPage permission="view_kanban"><KanbanView /></ProtectedPage>
              } />
              <Route path="/backlog" element={
                <ProtectedPage permission="view_kanban"><Backlog /></ProtectedPage>
              } />
              <Route path="/tasks" element={
                <ProtectedPage permission="view_all_tasks"><TasksList /></ProtectedPage>
              } />
              <Route path="/tasks/new" element={
                <ProtectedPage permission="create_task"><CreateTask /></ProtectedPage>
              } />
              <Route path="/tasks/:taskId" element={<TaskDetail />} />
              <Route path="/users" element={
                <ProtectedPage permission="manage_users"><Users /></ProtectedPage>
              } />
              <Route path="/external" element={
                <ProtectedPage permission="view_externals"><ExternalData /></ProtectedPage>
              } />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </div>
        </div>
      </main>

      {/* Global Jira Create Issue Modal */}
      <CreateIssueModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onIssueCreated={() => {
          // Trigger refresh if needed
        }}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <Router>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              } />
            </Routes>
            <ToastStack />
          </AuthProvider>
        </Router>
      </NotificationProvider>
    </ThemeProvider>
  );
}

function NavLink({ to, icon, label, open, exact = false }) {
  const location = useLocation();
  const isActive = exact
    ? location.pathname === to
    : location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      title={!open ? label : undefined}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium ${
        isActive ? 'bg-blue-600 text-white shadow-sm' : 'hover:text-white'
      }`}
      style={!isActive ? { color: 'var(--sidebar-text)' } : {}}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--sidebar-hover)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = ''; }}
    >
      <span className="flex-shrink-0">{icon}</span>
      {open && <span className="truncate">{label}</span>}
    </Link>
  );
}

export default App;
