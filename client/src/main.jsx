import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertCircle,
  CheckCircle2,
  Home,
  Loader2,
  MailCheck,
  XCircle
} from 'lucide-react';

import './styles.css';

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://verify.arkentechsolutions.com/v0/check_email';

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <MailCheck size={20} />
          </div>
          <span>EmailCheck</span>
        </div>

        <nav>
          <button className="nav-item active">
            <Home size={20} />
            <span>Verify Email</span>
          </button>
        </nav>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Email Verification Tool</p>
            <strong>Verify Email Addresses Instantly</strong>
          </div>
        </header>

        <ManualVerifyPage />
      </main>
    </div>
  );
}

function ManualVerifyPage() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function verify() {
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

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.message ||
          payload?.error ||
          'Verification failed'
        );
      }

      console.log(payload);

      setResult({
        email: email,
        reachable: payload.is_reachable,
        syntaxValid: payload.syntax?.is_valid_syntax,
        mxRecords: payload.mx?.has_mx_records,
        smtpCheck: payload.smtp?.can_connect_smtp,
        disposable: payload.is_disposable,
        roleAccount: payload.is_role_account,
        catchAll: payload.is_catch_all,
        domain: email.split('@')[1]
      });

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
          <h2>Verify Email</h2>
          <p>Check whether an email address is valid and reachable.</p>
        </div>
      </div>

      <div className="manual-card">
        <label>Email Address</label>

        <div className="manual-input-row">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
          />

          <button
            className="primary-button"
            onClick={verify}
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
        <div className="result-card">
          <div className="result-header">
            <h3>{result.email}</h3>

            <StatusBadge reachable={result.reachable} />
          </div>

          <div className="result-grid">

            <Metric
              label="Domain"
              value={result.domain}
            />

            <Metric
              label="Syntax Valid"
              value={yesNo(result.syntaxValid)}
            />

            <Metric
              label="MX Records"
              value={yesNo(result.mxRecords)}
            />

            <Metric
              label="SMTP Reachable"
              value={yesNo(result.smtpCheck)}
            />

            <Metric
              label="Disposable"
              value={yesNo(result.disposable)}
            />

            <Metric
              label="Role Account"
              value={yesNo(result.roleAccount)}
            />

            <Metric
              label="Catch All"
              value={yesNo(result.catchAll)}
            />

          </div>
        </div>
      )}
    </section>
  );
}

function StatusBadge({ reachable }) {

  const status = String(reachable || '').toLowerCase();

  if (
    status === 'safe' ||
    status === 'valid' ||
    status === 'reachable'
  ) {
    return (
      <div className="success-line">
        <CheckCircle2 size={18} />
        Valid
      </div>
    );
  }

  if (
    status === 'risky' ||
    status === 'unknown'
  ) {
    return (
      <div className="warning-line">
        <AlertCircle size={18} />
        Risky / Unknown
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
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function yesNo(value) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return '-';
}

createRoot(document.getElementById('root')).render(<App />);
