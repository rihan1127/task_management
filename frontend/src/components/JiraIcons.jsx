import classNames from 'classnames';

// ── Jira Issue Type Icons ──────────────────────────────────────────────────
export function StoryIcon({ className = "w-4 h-4" }) {
  return (
    <span className={classNames("inline-flex items-center justify-center flex-shrink-0 text-emerald-600", className)} title="Story">
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0-4H7V7h10v2z"/>
      </svg>
    </span>
  );
}

export function BugIcon({ className = "w-4 h-4" }) {
  return (
    <span className={classNames("inline-flex items-center justify-center flex-shrink-0 text-rose-600", className)} title="Bug">
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="8"/>
      </svg>
    </span>
  );
}

export function TaskIcon({ className = "w-4 h-4" }) {
  return (
    <span className={classNames("inline-flex items-center justify-center flex-shrink-0 text-sky-600", className)} title="Task">
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    </span>
  );
}

export function EpicIcon({ className = "w-4 h-4" }) {
  return (
    <span className={classNames("inline-flex items-center justify-center flex-shrink-0 text-purple-600", className)} title="Epic">
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
      </svg>
    </span>
  );
}

export function IssueTypeIcon({ type = "story", className = "w-4 h-4" }) {
  switch (type?.toLowerCase()) {
    case 'bug':  return <BugIcon className={className} />;
    case 'task': return <TaskIcon className={className} />;
    case 'epic': return <EpicIcon className={className} />;
    default:     return <StoryIcon className={className} />;
  }
}

export function IssueTypeBadge({ type = "story", showLabel = true }) {
  const meta = {
    story: { label: 'Story', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    bug:   { label: 'Bug',   bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    task:  { label: 'Task',  bg: 'bg-sky-50 text-sky-700 border-sky-200' },
    epic:  { label: 'Epic',  bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  }[type?.toLowerCase()] || { label: 'Story', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };

  return (
    <span className={classNames("inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border", meta.bg)}>
      <IssueTypeIcon type={type} className="w-3.5 h-3.5" />
      {showLabel && meta.label}
    </span>
  );
}

// ── Jira Priority Icons ────────────────────────────────────────────────────
export function JiraPriorityIcon({ priority = "medium", className = "w-3.5 h-3.5" }) {
  switch (priority?.toLowerCase()) {
    case 'urgent':
      return (
        <span className={classNames("inline-flex items-center justify-center text-rose-600", className)} title="Urgent / Highest">
          <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7M5 9l7-7 7 7" />
          </svg>
        </span>
      );
    case 'high':
      return (
        <span className={classNames("inline-flex items-center justify-center text-orange-500", className)} title="High">
          <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </span>
      );
    case 'low':
      return (
        <span className={classNames("inline-flex items-center justify-center text-sky-500", className)} title="Low">
          <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      );
    default: // medium
      return (
        <span className={classNames("inline-flex items-center justify-center text-amber-500", className)} title="Medium">
          <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M4 8h16" />
          </svg>
        </span>
      );
  }
}
