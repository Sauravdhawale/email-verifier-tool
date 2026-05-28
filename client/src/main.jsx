import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  Home,
  ListChecks,
  Loader2,
  MailCheck,
  PlugZap,
  Search,
  Settings,
  UploadCloud,
  XCircle
} from 'lucide-react';
import './styles.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const navItems = [
  { id: 'home', label: 'Home', icon: Home, path: '/' },
  { id: 'lists', label: 'Lists', icon: ListChecks, path: '/lists' },
  { id: 'verify', label: 'Verify', icon: MailCheck, path: '/verify' },
  { id: 'settings', label: 'API Settings', icon: Settings, path: '/settings' }
];

const statusColors = {
  valid: '#42b883',
  risky: '#eea858',
  unknown: '#aebbc1',
  disposable: '#4197b5',
  invalid: '#de4c67',
  duplicate: '#6b7cff'
};

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function useRoute() {
  const [route, setRoute] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return route;
}

function App() {
  const route = useRoute();
  const active = route.startsWith('/lists')
    ? 'lists'
    : route.startsWith('/verify')
      ? 'verify'
      : route.startsWith('/settings')
        ? 'settings'
        : 'home';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><MailCheck size={19} /></div>
          <span>EmailCheck</span>
        </div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={active === item.id ? 'nav-item active' : 'nav-item'} onClick={() => navigate(item.path)}>
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Internal validation workspace</p>
            <strong>Bulk Email Verification</strong>
          </div>
        </header>
        {active === 'home' && <HomePage />}
        {active === 'lists' && <ListsPage />}
        {active === 'verify' && <ManualVerifyPage />}
        {active === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}

function HomePage() {
  const [tab, setTab] = useState('list');
  return (
    <section className="page centered-page">
      <h1>Smarter Email Verification Starts Here</h1>
      <div className="tabs">
        <button className={tab === 'list' ? 'tab active' : 'tab'} onClick={() => setTab('list')}>Verify List</button>
        <button className={tab === 'manual' ? 'tab active' : 'tab'} onClick={() => setTab('manual')}>Verify Manually</button>
      </div>
      {tab === 'list' ? <UploadPanel /> : <ManualVerifyPage embedded />}
    </section>
  );
}

function UploadPanel() {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  async function upload(file) {
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(apiUrl('/api/jobs/upload'), { method: 'POST', body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Upload failed');
      navigate('/lists');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className={dragging ? 'upload-box dragging' : 'upload-box'}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        upload(event.dataTransfer.files[0]);
      }}
    >
      <input ref={inputRef} type="file" accept=".csv,.xlsx" hidden onChange={(event) => upload(event.target.files[0])} />
      <UploadCloud size={42} />
      <p>Drop your file here, or <button className="link-button" onClick={() => inputRef.current?.click()}>Browse file</button></p>
      <span>Upload Excel or CSV file with emails in a single column</span>
      <button className="primary-button" onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="spin" size={18} /> : <FileSpreadsheet size={18} />}
        {uploading ? 'Uploading...' : 'Browse file'}
      </button>
      {error && <div className="error-line"><AlertCircle size={16} />{error}</div>}
    </div>
  );
}

function ListsPage() {
  const [jobs, setJobs] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const hasProcessing = jobs.some((job) => ['waiting', 'processing'].includes(job.status));

  async function loadJobs() {
    try {
      const response = await fetch(apiUrl('/api/jobs'));
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to load jobs');
      setJobs(payload.jobs || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (!hasProcessing) return undefined;
    const timer = setInterval(loadJobs, 5000);
    return () => clearInterval(timer);
  }, [hasProcessing]);

  const filtered = jobs.filter((job) => `${job.id} ${job.file_name}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <h2>Lists</h2>
          <p>Newest validation jobs appear first.</p>
        </div>
        <button className="secondary-button" onClick={() => navigate('/')}>
          <UploadCloud size={17} />
          Add List
        </button>
      </div>
      <label className="search-box">
        <Search size={17} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search job id or filename" />
      </label>
      <div className="filter-tabs">
        <span>All ({jobs.length})</span>
        <span>Completed ({jobs.filter((job) => job.status === 'complete').length})</span>
        <span>Processing ({jobs.filter((job) => ['waiting', 'processing'].includes(job.status)).length})</span>
        <span>Failed ({jobs.filter((job) => job.status === 'failed').length})</span>
      </div>
      {loading ? <EmptyState text="Loading validation jobs..." /> : filtered.length ? filtered.map((job) => <JobCard key={job.id} job={job} />) : <EmptyState text="No uploaded lists yet." />}
    </section>
  );
}

function JobCard({ job }) {
  const progress = job.total_records ? Math.round((Number(job.emails_checked || 0) / Number(job.total_records)) * 100) : 0;
  const complete = job.status === 'complete';
  const failed = job.status === 'failed';

  return (
    <article className="job-card">
      <div className="job-meta">
        <h3>{job.file_name}</h3>
        <p>Added <strong>{formatDate(job.created_at)}</strong></p>
        <p>Job ID <strong>{job.id}</strong></p>
        <p>Status <StatusPill status={job.status} /></p>
        <p>Total records found <strong>{job.total_records || 0}</strong></p>
        <p>Emails checked <strong>{job.emails_checked || 0}</strong></p>
        <p>Duplicate emails found <strong>{job.duplicate_count || 0}</strong></p>
        {!complete && !failed && (
          <div className="progress-track">
            <span style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        )}
        {!complete && !failed && <small>{progress}% complete</small>}
      </div>
      <div className="status-summary">
        <h4>Validation Status</h4>
        <StatusRow label="Valid" value={job.valid_count} total={job.emails_checked} color={statusColors.valid} />
        <StatusRow label="Accept All / Risky" value={job.risky_count} total={job.emails_checked} color={statusColors.risky} />
        <StatusRow label="Unknown" value={job.unknown_count} total={job.emails_checked} color={statusColors.unknown} />
        <StatusRow label="Disposable" value={job.disposable_count} total={job.emails_checked} color={statusColors.disposable} />
        <StatusRow label="Invalid" value={job.invalid_count} total={job.emails_checked} color={statusColors.invalid} />
      </div>
      <DonutChart job={job} />
      <div className="job-actions">
        {complete ? (
          <a className="download-button" href={apiUrl(`/api/jobs/${job.id}/download`)}>
            <Download size={18} />
            Download cleaned CSV
          </a>
        ) : failed ? (
          <div className="failed-box"><XCircle size={18} />Validation failed</div>
        ) : (
          <div className="processing-box"><Loader2 className="spin" size={20} />Processing list</div>
        )}
      </div>
    </article>
  );
}

function StatusRow({ label, value = 0, total = 0, color }) {
  const pct = total ? ((Number(value) / Number(total)) * 100).toFixed(1) : '0.0';
  return (
    <div className="status-row">
      <span><i style={{ background: color }} />{label}</span>
      <strong>{value || 0}</strong>
      <em>{pct}%</em>
    </div>
  );
}

function DonutChart({ job }) {
  const values = [
    { value: Number(job.valid_count || 0), color: statusColors.valid },
    { value: Number(job.risky_count || 0), color: statusColors.risky },
    { value: Number(job.unknown_count || 0), color: statusColors.unknown },
    { value: Number(job.disposable_count || 0), color: statusColors.disposable },
    { value: Number(job.invalid_count || 0), color: statusColors.invalid }
  ];
  const total = values.reduce((sum, item) => sum + item.value, 0) || 1;
  let offset = 0;
  const gradient = values.map((item) => {
    const start = offset;
    const end = offset + (item.value / total) * 100;
    offset = end;
    return `${item.color} ${start}% ${end}%`;
  }).join(', ');
  return <div className="donut" style={{ background: `conic-gradient(${gradient})` }}><span /></div>;
}

function ManualVerifyPage({ embedded = false }) {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function verify() {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const response = await fetch(apiUrl('/api/verify/single'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Verification failed');
      setResult(payload.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={embedded ? 'manual-panel embedded' : 'page manual-page'}>
      {!embedded && <div className="page-heading"><div><h2>Verify</h2><p>Check one email address at a time.</p></div></div>}
      <div className="manual-card">
        <label>Email address</label>
        <div className="manual-input-row">
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" />
          <button className="primary-button" onClick={verify} disabled={loading || !email.trim()}>
            {loading ? <Loader2 className="spin" size={18} /> : <MailCheck size={18} />}
            Verify Email
          </button>
        </div>
        {error && <div className="error-line"><AlertCircle size={16} />{error}</div>}
      </div>
      {result && (
        <div className="result-card">
          <h3>{result.original_email}</h3>
          <StatusPill status={result.status} />
          <p>{result.reason || 'No reason returned'}</p>
          <div className="result-grid">
            <Metric label="Domain" value={result.domain || '-'} />
            <Metric label="Disposable" value={yesNo(result.is_disposable)} />
            <Metric label="Role account" value={yesNo(result.is_role_account)} />
            <Metric label="Catch-all" value={yesNo(result.is_catch_all)} />
          </div>
        </div>
      )}
    </section>
  );
}

function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(apiUrl('/api/settings')).then((res) => res.json()).then(setSettings).catch(() => setSettings({}));
  }, []);

  async function testConnection() {
    setLoading(true);
    setTest(null);
    try {
      const response = await fetch(apiUrl('/api/settings/test'));
      const payload = await response.json();
      setTest({ ok: response.ok, message: payload.message || payload.error });
    } catch (err) {
      setTest({ ok: false, message: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page">
      <div className="page-heading"><div><h2>API Settings</h2><p>Backend-only Reacher configuration.</p></div></div>
      <div className="settings-grid">
        <div className="setting-card">
          <PlugZap size={24} />
          <span>Reacher API Base URL</span>
          <strong>{settings?.reacherApiUrl || 'Not configured'}</strong>
        </div>
        <div className="setting-card">
          <Database size={24} />
          <span>API key</span>
          <strong>{settings?.hasApiKey ? 'Configured and hidden' : 'Not configured'}</strong>
        </div>
      </div>
      <button className="primary-button" onClick={testConnection} disabled={loading}>
        {loading ? <Loader2 className="spin" size={18} /> : <Activity size={18} />}
        Test Reacher API Connection
      </button>
      {test && <div className={test.ok ? 'success-line' : 'error-line'}>{test.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}{test.message}</div>}
    </section>
  );
}

function StatusPill({ status }) {
  return <span className={`status-pill ${status}`}>{status}</span>;
}

function Metric({ label, value }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function EmptyState({ text }) {
  return <div className="empty-state">{text}</div>;
}

function yesNo(value) {
  return value === true ? 'Yes' : value === false ? 'No' : '-';
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

createRoot(document.getElementById('root')).render(<App />);
