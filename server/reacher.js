const rolePrefixes = new Set(['admin', 'billing', 'contact', 'hello', 'help', 'info', 'marketing', 'sales', 'support']);

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function isLikelyEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

export async function checkEmailWithReacher(email) {
  const baseUrl = (process.env.REACHER_API_URL || '').replace(/\/$/, '');
  if (!baseUrl) {
    throw new Error('REACHER_API_URL is not configured');
  }

  const headers = { 'Content-Type': 'application/json' };
  if (process.env.REACHER_API_KEY && process.env.REACHER_API_KEY !== 'ADD_API_KEY_LATER') {
    headers.Authorization = `Bearer ${process.env.REACHER_API_KEY}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${baseUrl}/v0/check_email`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ to_email: email }),
      signal: controller.signal
    });
    const text = await response.text();
    let payload = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { raw: text };
    }
    if (!response.ok) {
      const reason = response.status === 401 ? 'Invalid Reacher API key' : `Reacher API error ${response.status}`;
      throw new Error(payload.message || payload.error || reason);
    }
    return mapReacherResponse(email, payload);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Reacher API timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function mapReacherResponse(originalEmail, raw) {
  const normalized = normalizeEmail(raw.input || raw.email || raw.to_email || originalEmail);
  const domain = normalized.includes('@') ? normalized.split('@').pop() : '';
  const isDisposable = Boolean(raw.is_disposable || raw.misc?.is_disposable);
  const isRoleAccount = Boolean(raw.is_role_account || raw.misc?.is_role_account || rolePrefixes.has(normalized.split('@')[0]));
  const isCatchAll = Boolean(raw.is_catch_all || raw.mx?.is_catch_all || raw.smtp?.is_catch_all);
  const syntaxValid = raw.syntax?.is_valid_syntax ?? raw.syntax_valid ?? isLikelyEmail(normalized);
  const mxAcceptsMail = raw.mx?.accepts_mail ?? raw.mx_accepts_mail ?? null;
  const reachable = raw.is_reachable || raw.result || raw.status || 'unknown';
  const reason = raw.reason || raw.message || raw.smtp?.error || raw.mx?.error || String(reachable);

  let status = 'unknown';
  if (isDisposable) {
    status = 'disposable';
  } else if (reachable === 'safe' || reachable === 'valid' || reachable === true) {
    status = 'valid';
  } else if (reachable === 'invalid' || reachable === 'hard_bounce' || reachable === false || syntaxValid === false) {
    status = 'invalid';
  } else if (reachable === 'risky' || reachable === 'catch_all' || reachable === 'accept_all' || isCatchAll) {
    status = 'risky';
  } else if (reachable === 'unknown' || reachable === 'timeout' || reachable === 'unverifiable') {
    status = 'unknown';
  }

  return {
    original_email: originalEmail,
    normalized_email: normalized,
    status,
    is_reachable: String(reachable),
    syntax_valid: Boolean(syntaxValid),
    domain,
    mx_accepts_mail: mxAcceptsMail,
    is_disposable: isDisposable,
    is_role_account: isRoleAccount,
    is_catch_all: isCatchAll,
    reason,
    raw_response: raw,
    checked_at: new Date().toISOString()
  };
}
