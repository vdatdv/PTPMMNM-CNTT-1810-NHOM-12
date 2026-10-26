/**
 * Quản lý phiên đăng nhập tích hợp PHP Backend API.
 */

const SESSION_KEY = 'designmark.session';
const ALLOWED_NEXT = new Set([
  'dashboard.php',
  'projects.php',
  'project.php',
  'review.php',
  'compare.php',
  'feedback.php',
  'users.php',
  'register.php',
  'verify.php',
  'projects.html',
  'project.html',
  'review.html',
  'compare.html',
  'feedback.html'
]);

export const ROLE_LABELS = {
  manager: 'Quản lý',
  reviewer: 'Góp ý',
  viewer: 'Chỉ xem'
};

function readRaw() {
  try {
    return localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
  } catch (err) {
    return null;
  }
}

export function getSession() {
  const raw = readRaw();
  if (raw) {
    try {
      const data = JSON.parse(raw);
      if (data && (data.userId || data.username)) {
        return {
          userId: data.userId || data.id,
          username: data.username,
          name: data.name || data.username,
          role: data.role || 'viewer',
          title: data.title || '',
          color: data.color || '#4F46E5',
          isVerified: data.isVerified !== undefined ? Number(data.isVerified) : 1,
          remember: Boolean(data.remember)
        };
      }
    } catch (err) {}
  }

  // Fallback to PHP injected session if present
  if (typeof window !== 'undefined' && window.DESIGNMARK_SESSION && window.DESIGNMARK_SESSION.userId) {
    const s = window.DESIGNMARK_SESSION;
    const sessionObj = {
      userId: s.userId || s.id,
      username: s.username,
      name: s.name || s.username,
      role: s.role || 'viewer',
      title: s.title || '',
      color: s.color || '#4F46E5',
      isVerified: s.isVerified !== undefined ? Number(s.isVerified) : 1,
      remember: true
    };
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionObj));
    } catch (ignore) {}
    return sessionObj;
  }

  return null;
}

export function setSession(user, remember) {
  const payload = JSON.stringify({
    userId: user.userId || user.id,
    username: user.username,
    name: user.name || user.username,
    role: user.role || 'viewer',
    title: user.title || '',
    color: user.color || '#4F46E5',
    isVerified: user.isVerified !== undefined ? Number(user.isVerified) : (user.is_verified !== undefined ? Number(user.is_verified) : 1),
    remember: Boolean(remember)
  });
  try {
    if (remember) {
      localStorage.setItem(SESSION_KEY, payload);
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY, payload);
      localStorage.removeItem(SESSION_KEY);
    }
  } catch (err) {
    throw new Error('Không lưu được phiên đăng nhập trên trình duyệt này.');
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch (err) {
    /* bỏ qua lỗi bộ nhớ trình duyệt */
  }
}

export function requireAuth() {
  const session = getSession();
  if (!session) {
    const loc = typeof window !== 'undefined' ? window.location : null;
    const file = loc ? loc.pathname.split('/').pop() : 'dashboard.php';
    const next = `${file || 'dashboard.php'}${loc ? loc.search : ''}`;
    if (loc && loc.replace) {
      loc.replace(`index.php?next=${encodeURIComponent(next)}`);
    }
    return null;
  }
  return session;
}

export function redirectAfterLogin() {
  const params = new URLSearchParams(location.search);
  const next = params.get('next') || '';
  const file = next.split('?')[0];
  if (ALLOWED_NEXT.has(file) && !next.includes('://') && !next.startsWith('//')) {
    location.href = next;
    return;
  }
  location.href = 'dashboard.php';
}

/**
 * Đăng nhập: gửi thông tin lên PHP API endpoint /api/auth.php và lưu phiên.
 */
export async function login(username, password, remember) {
  const name = String(username || '').trim().toLowerCase();
  const pass = String(password || '');
  if (!name) {
    const error = new Error('Vui lòng nhập tên đăng nhập.');
    error.code = 'VALIDATION';
    throw error;
  }
  if (!pass.trim()) {
    const error = new Error('Vui lòng nhập mật khẩu. Mật khẩu không được để trống.');
    error.code = 'VALIDATION';
    throw error;
  }

  const res = await fetch('api/auth.php?action=login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: name, password: pass, remember })
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || 'Đăng nhập không thành công.');
    err.code = data.code || 'AUTH';
    throw err;
  }
  setSession(data, remember);
  try {
    sessionStorage.setItem('designmark.welcome', data.name);
  } catch (ignore) {}
  return getSession();
}

export async function logout() {
  try {
    await fetch('api/auth.php?action=logout', { method: 'POST' });
  } catch (ignore) {}
  clearSession();
  location.href = 'index.php';
}

export async function switchAccount(username) {
  try {
    const res = await fetch('api/auth.php?action=switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    if (res.ok) {
      const data = await res.json();
      setSession(data, true);
      location.reload();
    }
  } catch (ignore) {}
}

export async function registerAccount({ username, name, password, title }) {
  const res = await fetch('api/auth.php?action=register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, name, password, title })
  });
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.error || 'Đăng ký không thành công.');
    error.code = data.code || 'REGISTRATION_ERROR';
    throw error;
  }
  return data;
}

export async function verifyAccount({ username, code }) {
  const res = await fetch('api/auth.php?action=verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, code })
  });
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.error || 'Xác minh không thành công.');
    error.code = data.code || 'VERIFICATION_ERROR';
    throw error;
  }
  return data;
}

export function roleLabel(role) {
  return ROLE_LABELS[role] || role || '';
}

