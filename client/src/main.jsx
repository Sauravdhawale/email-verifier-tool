import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertCircle,
  CheckCircle2,
  Home,
  Loader2,
  MailCheck,
  Shield,
  Server,
  Globe,
  User,
  Bug,
  XCircle
} from 'lucide-react';

import './styles.css';

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://verify.arkentechsolutions.com/v1/check_email';

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <MailCheck size={20} />
          </div>
          <span>Arken Verify</span>
        </div>

        <nav>
          <button className="nav-item active">
            <Home size={20} />
            <span>Email Verification</span>
          </button>
        </nav>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">ArkenTechSolutions</p>
            <strong>Advanced Email Verification Dashboard</strong>
          </div>
        </header>

        <Dashboard />
      </main>
    </div>
  );
}

function Dashboard() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function verifyEmail() {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to_email: email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setResult(data);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page manual-page">

      <div className="page-heading">
        <div>
          <h2>Email Verification</h2>
          <p>
            Verify deliverability, SMTP connectivity, MX records,
            disposable detection and more.
          </p>
        </div>
      </div>

      <div className="manual-card">

        <label>Email Address</label>

        <div className="manual-input-row">

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />

          <button
            className="primary-button"
            onClick={verifyEmail}
            disabled={loading || !email.trim()}
          >
            {loading ? (
              <Loader2 className="spin" size={18} />
            ) : (
              <MailCheck size={18} />
            )}

            {loading ? 'Verifying...' : 'Verify'}
          </button>

        </div>

        {error && (
          <div className="error-line">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

      </div>

      {result && (
        <>

          {/* MAIN STATUS */}
          <div className="result-card">

            <div className="result-header">

              <div>
                <h3>{result.input}</h3>
                <p>{result.syntax?.normalized_email}</p>
              </div>

              <StatusBadge status={result.is_reachable} />

            </div>

          </div>

          {/* EMAIL DETAILS */}
          <div className="dashboard-grid">

            <InfoCard
              icon={<User size={20} />}
              title="Email Information"
            >
              <Metric label="Username" value={result.syntax?.username} />
              <Metric label="Domain" value={result.syntax?.domain} />
              <Metric
                label="Syntax Valid"
                value={yesNo(result.syntax?.is_valid_syntax)}
              />
              <Metric
                label="Normalized"
                value={result.syntax?.normalized_email}
              />
            </InfoCard>

            {/* SMTP */}
            <InfoCard
              icon={<Server size={20} />}
              title="SMTP Validation"
            >
              <Metric
                label="SMTP Connect"
                value={yesNo(result.smtp?.can_connect_smtp)}
              />

              <Metric
                label="Deliverable"
                value={yesNo(result.smtp?.is_deliverable)}
              />

              <Metric
                label="Catch All"
                value={yesNo(result.smtp?.is_catch_all)}
              />

              <Metric
                label="Inbox Full"
                value={yesNo(result.smtp?.has_full_inbox)}
              />

              <Metric
                label="Disabled"
                value={yesNo(result.smtp?.is_disabled)}
              />
            </InfoCard>

            {/* MX */}
            <InfoCard
              icon={<Globe size={20} />}
              title="MX Records"
            >
              <Metric
                label="Accepts Mail"
                value={yesNo(result.mx?.accepts_mail)}
              />

              <div className="mx-records">
                <strong>MX Servers</strong>

                {result.mx?.records?.length ? (
                  result.mx.records.map((record, index) => (
                    <div key={index} className="mx-record">
                      {record}
                    </div>
                  ))
                ) : (
                  <div className="mx-record">No MX records found</div>
                )}
              </div>
            </InfoCard>

            {/* SECURITY */}
            <InfoCard
              icon={<Shield size={20} />}
              title="Security & Risk"
            >
              <Metric
                label="Disposable"
                value={yesNo(result.misc?.is_disposable)}
              />

              <Metric
                label="Role Account"
                value={yesNo(result.misc?.is_role_account)}
              />

              <Metric
                label="Business Email"
                value={result.misc?.is_b2c ? 'No' : 'Yes'}
              />

              <Metric
                label="HaveIBeenPwned"
                value={
                  result.misc?.haveibeenpwned
                    ? 'Compromised'
                    : 'Safe'
                }
              />
            </InfoCard>

            {/* DEBUG */}
            <InfoCard
              icon={<Bug size={20} />}
              title="Debug Information"
            >
              <Metric
                label="Backend"
                value={result.debug?.backend_name}
              />

              <Metric
                label="Verification Time"
                value={`${result.debug?.duration?.secs || 0}.${Math.floor((result.debug?.duration?.nanos || 0) / 1000000)}s`}
              />

              <Metric
                label="SMTP Host"
                value={
                  result.debug?.smtp?.verif_method?.host || '-'
                }
              />

              <Metric
                label="SMTP Port"
                value={
                  result.debug?.smtp?.verif_method?.verif_method?.smtp_port || '-'
                }
              />
            </InfoCard>

          </div>

        </>
      )}
    </section>
  );
}

function InfoCard({ icon, title, children }) {
  return (
    <div className="info-card">

      <div className="info-card-header">
        {icon}
        <h3>{title}</h3>
      </div>

      <div className="info-card-content">
        {children}
      </div>

    </div>
  );
}

function StatusBadge({ status }) {

  const normalized = String(status || '').toLowerCase();

  if (normalized === 'safe') {
    return (
      <div className="success-line">
        <CheckCircle2 size={18} />
        Safe
      </div>
    );
  }

  if (
    normalized === 'risky' ||
    normalized === 'unknown'
  ) {
    return (
      <div className="warning-line">
        <AlertCircle size={18} />
        Risky
      </div>
    );
  }

  return (
    <div className="error-line">
      <XCircle size={18} />
      Invalid
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric-row">
      <span>{label}</span>
      <strong>{String(value || '-')}</strong>
    </div>
  );
}

function yesNo(value) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return '-';
}

createRoot(document.getElementById('root')).render(<App />);
