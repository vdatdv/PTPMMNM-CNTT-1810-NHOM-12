/**
 * Thành phần giao diện dùng chung. Không chứa nghiệp vụ dự án.
 * Phân quyền hiển thị chỉ là lớp demo; API vẫn kiểm tra lại.
 */
import { getSession, logout, roleLabel, switchAccount } from './auth.js';
import { api, isPreferLocal, setPreferLocal, checkDatabaseHealth } from './api.js';

const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  folder: '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z"/>',
  message: '<path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H9l-4 3.5V6.5Z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  logout: '<path d="M10 7V5.5A1.5 1.5 0 0 1 11.5 4h7A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 10 18.5V17"/><path d="M4 12h10M11 8l4 4-4 4"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="m20 20-3.5-3.5"/>',
  upload: '<path d="M12 16V6M8 9l4-4 4 4"/><path d="M5 19h14"/>',
  pin: '<path d="M12 21s6-5.1 6-10a6 6 0 1 0-12 0c0 4.9 6 10 6 10Z"/><circle cx="12" cy="11" r="1.6" fill="currentColor" stroke="none"/>',
  cursor: '<path d="m5 4 6.5 15 1.8-5.7L19 11.5 5 4Z"/>',
  square: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
  zoomIn: '<circle cx="11" cy="11" r="6"/><path d="M11 8v6M8 11h6M20 20l-3.5-3.5"/>',
  zoomOut: '<circle cx="11" cy="11" r="6"/><path d="M8 11h6M20 20l-3.5-3.5"/>',
  fit: '<path d="M9 4H5v4M15 4h4v4M9 20H5v-4M15 20h4v-4"/>',
  compare: '<path d="M4 6h7v12H4zM13 6h7v12h-7z"/>',
  download: '<path d="M12 5v10M8 11l4 4 4-4M5 19h14"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  alert: '<path d="M12 4 3 19h18L12 4Z"/><path d="M12 10v4M12 16.5v.5"/>',
  users: '<path d="M8 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16.5 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path d="M3.5 19c.6-2.4 2.4-3.5 4.5-3.5s3.9 1.1 4.5 3.5M14 15.6c1.4-.4 2.7-.1 3.8.8 1 .8 1.6 1.8 1.9 2.6"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/>',
  panels: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M10 5v14"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  wifi: '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="19" r="1"/>'
};

const escapeHandlers = [];

if (typeof document !== 'undefined') {
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const handler = escapeHandlers[escapeHandlers.length - 1];
    if (!handler) return;
    event.preventDefault();
    handler();
  });
}

export function pushEscape(handler) {
  escapeHandlers.push(handler);
  return () => {
    const index = escapeHandlers.indexOf(handler);
    if (index >= 0) escapeHandlers.splice(index, 1);
  };
}

export function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.75');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.classList.add('icon');
  svg.innerHTML = ICONS[name] || ICONS.grid;
  return svg;
}

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value == null || value === false) return;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = String(value);
    else if (key === 'dataset') Object.entries(value).forEach(([name, data]) => { node.dataset[name] = data; });
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value === true ? '' : String(value));
  });
  const list = Array.isArray(children) ? children : [children];
  list.forEach((child) => {
    if (child == null || child === false) return;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  });
  return node;
}

export function announce(message) {
  const region = document.getElementById('live-region');
  if (!region) return;
  region.textContent = '';
  window.setTimeout(() => {
    region.textContent = message;
  }, 20);
}

export function formatDate(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

export function formatDay(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export function avatarEl(user, size = 28) {
  const node = el('span', {
    class: 'avatar',
    title: user?.name || '',
    style: `width:${size}px;height:${size}px;background:${user?.color || '#4F46E5'}`
  }, (user?.name || '?').trim().charAt(0).toUpperCase());
  return node;
}

export function statusBadge(status) {
  const open = status !== 'resolved';
  return el('span', { class: open ? 'badge badge-open' : 'badge badge-resolved' }, [
    el('span', { class: 'badge-dot', 'aria-hidden': 'true' }),
    open ? 'Chưa xử lý' : 'Đã xử lý'
  ]);
}

export function roleBadge(role) {
  return el('span', { class: `badge badge-role role-${role}` }, roleLabel(role));
}

export function emptyState({ title, text, action }) {
  return el('div', { class: 'empty-state' }, [
    el('div', { class: 'empty-mark', 'aria-hidden': 'true' }, [icon('folder')]),
    el('h2', { text: title }),
    text ? el('p', { text }) : null,
    action || null
  ]);
}

export function setBusy(button, busy, busyLabel) {
  if (!button) return;
  if (busy) {
    if (!button.dataset.label) button.dataset.label = button.textContent;
    button.disabled = true;
    button.dataset.loading = 'true';
    button.replaceChildren(el('span', { class: 'spinner', 'aria-hidden': 'true' }), document.createTextNode(busyLabel || 'Đang lưu...'));
  } else {
    button.disabled = false;
    delete button.dataset.loading;
    button.textContent = button.dataset.label || button.textContent;
  }
}

export function toast(message, type = 'info') {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const node = el('div', { class: `toast toast-${type}`, role: type === 'error' ? 'alert' : 'status' }, [
    icon(type === 'success' ? 'check' : type === 'error' ? 'alert' : 'message'),
    el('span', { text: message })
  ]);
  root.append(node);
  requestAnimationFrame(() => node.classList.add('is-in'));
  window.setTimeout(() => {
    node.classList.remove('is-in');
    window.setTimeout(() => node.remove(), 220);
  }, 3200);
  announce(message);
}

function focusable(container) {
  return [...container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter((node) => !node.disabled && node.offsetParent !== null);
}

export function openModal({ title, content, size = '' }) {
  const root = document.getElementById('modal-root');
  const previous = document.activeElement;
  const titleId = `modal-title-${Date.now()}`;
  const card = el('div', { class: `modal-card ${size}`, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId }, [
    el('div', { class: 'modal-head' }, [
      el('h2', { id: titleId, text: title }),
      el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Đóng hộp thoại', onclick: () => close() }, [icon('close')])
    ]),
    el('div', { class: 'modal-body' }, [content])
  ]);
  const backdrop = el('div', { class: 'modal-backdrop', onclick: (event) => { if (event.target === backdrop) close(); } }, [card]);
  root.append(backdrop);
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => backdrop.classList.add('is-in'));
  const removeEscape = pushEscape(() => close());
  const onKey = (event) => {
    if (event.key !== 'Tab') return;
    const items = focusable(card);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  card.addEventListener('keydown', onKey);
  window.setTimeout(() => {
    const items = focusable(card);
    (items.find((item) => item !== card.querySelector('.icon-btn')) || items[0] || card).focus();
  }, 30);
  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    removeEscape();
    backdrop.classList.remove('is-in');
    window.setTimeout(() => backdrop.remove(), 180);
    if (!root.querySelector('.modal-backdrop')) document.body.classList.remove('modal-open');
    if (previous && typeof previous.focus === 'function') previous.focus();
  }
  return { close, card, backdrop };
}

export function confirmDialog({ title, message, confirmText = 'Xác nhận', cancelText = 'Hủy', danger = false }) {
  return new Promise((resolve) => {
    const content = el('div', {}, [
      el('p', { class: 'modal-copy', text: message }),
      el('div', { class: 'modal-actions' }, [
        el('button', { type: 'button', class: 'btn btn-secondary', text: cancelText, onclick: () => done(false) }),
        el('button', { type: 'button', class: danger ? 'btn btn-danger' : 'btn btn-primary', text: confirmText, onclick: () => done(true) })
      ])
    ]);
    const modal = openModal({ title, content });
    function done(value) {
      modal.close();
      resolve(value);
    }
  });
}

export function fieldError(input, message) {
  const id = `${input.id || 'field'}-error`;
  let node = input.parentElement.querySelector('.field-error');
  if (!node) {
    node = el('p', { class: 'field-error', id });
    input.insertAdjacentElement('afterend', node);
  }
  node.textContent = message || '';
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (message) input.setAttribute('aria-describedby', node.id);
}

export function setBreadcrumb(items) {
  const nav = document.getElementById('breadcrumb');
  if (!nav) return;
  nav.replaceChildren();
  items.forEach((item, index) => {
    if (index) nav.append(el('span', { class: 'crumb-sep', 'aria-hidden': 'true' }, '/'));
    if (item.href && index < items.length - 1) {
      nav.append(el('a', { href: item.href, text: item.label }));
    } else {
      nav.append(el('span', { text: item.label, 'aria-current': index === items.length - 1 ? 'page' : null }));
    }
  });
}

export function setPageTitle(title) {
  document.title = `${title} — DesignMark`;
  const node = document.getElementById('topbar-title');
  if (node) node.textContent = title;
}

function closeDrawer() {
  document.querySelector('.app-shell')?.classList.remove('is-drawer-open');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (backdrop) backdrop.hidden = true;
  document.getElementById('menu-toggle')?.setAttribute('aria-expanded', 'false');
}

let drawerEscape = null;

export function mountChrome({ active }) {
  const session = getSession();
  const sidebar = document.getElementById('sidebar');
  const topbar = document.getElementById('topbar');
  if (!sidebar || !topbar || !session) return;
  const collapsed = localStorage.getItem('designmark.sidebar') === '1';
  document.querySelector('.app-shell')?.classList.toggle('is-collapsed', collapsed);

  const brand = el('a', { class: 'brand', href: 'dashboard.php' }, [
    el('span', { class: 'brand-mark', 'aria-hidden': 'true' }, 'D'),
    el('span', { class: 'brand-text' }, [
      el('strong', { text: 'DesignMark' }),
      el('small', { text: 'Góp ý thiết kế' })
    ])
  ]);
  const collapseBtn = el('button', {
    type: 'button',
    class: 'icon-btn collapse-btn',
    'aria-label': collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên',
    'data-tooltip': 'Thu gọn',
    onclick: () => {
      const shell = document.querySelector('.app-shell');
      const next = !shell.classList.contains('is-collapsed');
      shell.classList.toggle('is-collapsed', next);
      localStorage.setItem('designmark.sidebar', next ? '1' : '0');
      collapseBtn.setAttribute('aria-label', next ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên');
    }
  }, [icon('panels')]);

  const navLinks = [
    navLink('grid', 'Tổng quan dự án', 'dashboard.php', active === 'overview' || active === 'dashboard'),
    navLink('folder', 'Danh sách dự án', 'projects.php', active === 'projects'),
    navLink('message', 'Góp ý', 'feedback.php', active === 'feedback')
  ];

  if (session.role === 'manager') {
    navLinks.push(navLink('users', 'Quản lý tài khoản', 'users.php', active === 'users'));
  }

  const nav = el('nav', { class: 'side-nav', 'aria-label': 'Mục chính' }, navLinks);

  sidebar.replaceChildren(
    el('div', { class: 'side-top' }, [brand, collapseBtn]),
    nav,
    el('div', { class: 'side-account' }, [
      el('div', { class: 'account-row' }, [
        avatarEl(session, 36),
        el('div', { class: 'account-meta' }, [
          el('strong', { text: session.name }),
          el('span', { text: roleLabel(session.role) })
        ])
      ]),
      el('div', { class: 'account-actions', style: 'margin-top: 12px;' }, [
        el('button', {
          type: 'button',
          class: 'btn btn-secondary btn-sm',
          style: 'width: 100%; justify-content: center;',
          onclick: () => logout()
        }, [icon('logout'), 'Đăng xuất'])
      ])
    ])
  );

  topbar.replaceChildren(
    el('div', { class: 'topbar-left' }, [
      el('button', {
        type: 'button',
        class: 'icon-btn menu-toggle',
        id: 'menu-toggle',
        'aria-label': 'Mở menu',
        'aria-expanded': 'false',
        onclick: () => {
          const shell = document.querySelector('.app-shell');
          const open = !shell.classList.contains('is-drawer-open');
          shell.classList.toggle('is-drawer-open', open);
          const backdrop = document.getElementById('sidebar-backdrop');
          if (backdrop) backdrop.hidden = !open;
          document.getElementById('menu-toggle').setAttribute('aria-expanded', open ? 'true' : 'false');
          if (open) {
            drawerEscape = pushEscape(closeDrawer);
            sidebar.querySelector('a, button')?.focus();
          } else if (drawerEscape) {
            drawerEscape();
            drawerEscape = null;
          }
        }
      }, [icon('menu')]),
      el('div', { class: 'topbar-titles' }, [
        el('nav', { id: 'breadcrumb', class: 'breadcrumb', 'aria-label': 'Breadcrumb' }),
        el('h1', { id: 'topbar-title', text: 'DesignMark' })
      ])
    ]),
    el('div', { class: 'topbar-right' }, [
      el('button', {
        type: 'button',
        id: 'db-network-badge',
        class: 'db-network-badge is-remote',
        title: 'Cài đặt kết nối cơ sở dữ liệu & Tối ưu mạng yếu',
        onclick: () => openNetworkSettingsModal()
      }, [
        icon('wifi'),
        el('span', { class: 'db-badge-text', text: 'Trực tuyến (Supabase)' })
      ]),
      el('div', { class: 'topbar-user' }, [
        avatarEl(session, 32),
        el('div', {}, [
          el('strong', { text: session.name }),
          el('span', { text: `${session.username} · ${roleLabel(session.role)}` })
        ])
      ])
    ])
  );

  setupNetworkBadgeListeners();

  const backdrop = document.getElementById('sidebar-backdrop');
  if (backdrop) {
    backdrop.onclick = () => {
      closeDrawer();
      if (drawerEscape) {
        drawerEscape();
        drawerEscape = null;
      }
    };
  }
}

function updateTopBadge(detail = {}) {
  const badgeBtn = document.getElementById('db-network-badge');
  if (!badgeBtn) return;
  const preferLocal = isPreferLocal();
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  let modeClass = 'is-remote';
  let iconName = 'wifi';
  let label = 'Trực tuyến (Supabase)';

  if (isOffline) {
    modeClass = 'is-offline';
    iconName = 'alert';
    label = 'Mất mạng (CSDL Cục bộ)';
  } else if (preferLocal) {
    modeClass = 'is-local';
    iconName = 'zap';
    label = '⚡ CSDL Cục bộ (Mạng yếu)';
  } else if (detail.engine === 'sqlite' || detail.fallback) {
    modeClass = 'is-fallback';
    iconName = 'zap';
    label = '⚡ Dùng CSDL Cục bộ (Mạng yếu)';
  }

  badgeBtn.className = `db-network-badge ${modeClass}`;
  badgeBtn.replaceChildren(
    icon(iconName),
    el('span', { class: 'db-badge-text', text: label })
  );
}

let networkListenersSetup = false;
function setupNetworkBadgeListeners() {
  if (networkListenersSetup) {
    updateTopBadge();
    return;
  }
  networkListenersSetup = true;

  window.addEventListener('dm:db-mode', (e) => updateTopBadge(e.detail));
  window.addEventListener('dm:prefer-local-changed', () => updateTopBadge());
  window.addEventListener('online', () => updateTopBadge());
  window.addEventListener('offline', () => updateTopBadge());
  updateTopBadge();
}

export function openNetworkSettingsModal() {
  const preferLocal = isPreferLocal();
  const modalContainer = el('div', { class: 'network-modal-content' });

  // Status card
  const statusBox = el('div', { class: 'network-status-box' }, [
    el('div', { class: 'network-status-header' }, [
      icon('database'),
      el('strong', { text: 'Trạng thái Kết nối & Động cơ CSDL' })
    ]),
    el('div', { id: 'network-ping-info', class: 'network-ping-info' }, [
      el('span', { class: 'spinner spinner-dark', style: 'display:inline-block; margin-right:6px;' }),
      'Đang kiểm tra kết nối...'
    ])
  ]);

  function updateSelection(local) {
    setPreferLocal(local);
    modalContainer.querySelectorAll('.network-mode-card').forEach(c => c.classList.remove('is-selected'));
    if (local) {
      modalContainer.querySelectorAll('.network-mode-card')[1]?.classList.add('is-selected');
    } else {
      modalContainer.querySelectorAll('.network-mode-card')[0]?.classList.add('is-selected');
    }
    runPingTest();
  }

  // Options radio group
  const modeGroup = el('div', { class: 'network-mode-options' }, [
    el('label', { class: `network-mode-card ${!preferLocal ? 'is-selected' : ''}` }, [
      el('input', {
        type: 'radio',
        name: 'dm_net_mode',
        value: 'auto',
        checked: !preferLocal,
        onchange: () => updateSelection(false)
      }),
      el('div', { class: 'mode-card-body' }, [
        el('div', { class: 'mode-card-title' }, [
          icon('wifi'),
          el('strong', { text: 'Chế độ Tự động (Mặc định)' })
        ]),
        el('p', { class: 'mode-card-desc', text: 'Ưu tiên Supabase PostgreSQL Cloud. Khi mạng yếu, rớt mạng hoặc phản hồi quá 10s, hệ thống tự động ngắt và chuyển sang đọc từ CSDL cục bộ SQLite ngay lập tức.' })
      ])
    ]),
    el('label', { class: `network-mode-card ${preferLocal ? 'is-selected' : ''}` }, [
      el('input', {
        type: 'radio',
        name: 'dm_net_mode',
        value: 'local',
        checked: preferLocal,
        onchange: () => updateSelection(true)
      }),
      el('div', { class: 'mode-card-body' }, [
        el('div', { class: 'mode-card-title' }, [
          icon('zap'),
          el('strong', { text: '⚡ Luôn ưu tiên CSDL Cục bộ (Mạng yếu / Tốc độ cao)' })
        ]),
        el('p', { class: 'mode-card-desc', text: 'Bỏ qua hoàn toàn độ trễ mạng internet. Đọc dữ liệu trực tiếp từ CSDL nội bộ SQLite với tốc độ 0.01ms, không bị ảnh hưởng bởi mạng chập chờn hay đứt cáp quốc tế.' })
      ])
    ])
  ]);

  async function runPingTest() {
    const pingEl = modalContainer.querySelector('#network-ping-info');
    if (!pingEl) return;
    pingEl.innerHTML = '<span class="spinner spinner-dark" style="display:inline-block; margin-right:6px;"></span> Đang đo tốc độ phản hồi...';
    const data = await checkDatabaseHealth();

    const isSqlite = data.engine === 'sqlite';
    const latency = isSqlite ? (data.latency_ms || 0.01) : (data.latency_ms || data.client_ping_ms);
    const badgeHtml = isSqlite
      ? `<span class="badge" style="background:#eef2ff; color:#4338ca; border:1px solid #c7d2fe; font-weight:600;">⚡ SQLite Cục bộ (0.01ms - Siêu tốc)</span>`
      : `<span class="badge" style="background:#ecfdf5; color:#047857; border:1px solid #a7f3d0; font-weight:600;">☁️ Supabase Cloud (${latency}ms)</span>`;

    pingEl.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="color:var(--muted)">Động cơ CSDL đang dùng:</span>
          ${badgeHtml}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="color:var(--muted)">Thời gian phản hồi CSDL:</span>
          <strong>${latency} ms</strong>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="color:var(--muted)">Cơ chế Circuit Breaker:</span>
          <span>${data.breaker_active ? '<b style="color:var(--danger)">Đang kích hoạt (Tự động chuyển SQLite do mạng yếu)</b>' : '<b style="color:var(--success)">Bình thường</b>'}</span>
        </div>
      </div>
    `;
  }

  const actions = el('div', { class: 'modal-actions', style: 'justify-content: space-between; margin-top: 20px;' }, [
    el('button', {
      type: 'button',
      class: 'btn btn-secondary btn-sm',
      onclick: () => {
        try {
          Object.keys(localStorage).forEach(k => {
            if (k.startsWith('dm_cache_')) localStorage.removeItem(k);
          });
          announce('Đã xóa bộ nhớ đệm cache.');
          runPingTest();
        } catch (e) {}
      }
    }, [icon('check'), 'Làm mới bộ nhớ đệm']),
    el('div', { style: 'display:flex; gap:8px;' }, [
      el('button', {
        type: 'button',
        class: 'btn btn-secondary',
        onclick: () => runPingTest()
      }, 'Kiểm tra lại'),
      el('button', {
        type: 'button',
        class: 'btn btn-primary',
        onclick: () => modal.close()
      }, 'Hoàn tất')
    ])
  ]);

  modalContainer.append(statusBox, modeGroup, actions);

  const modal = openModal({
    title: 'Tối ưu Mạng & Ưu tiên Đọc Cơ sở Dữ liệu',
    content: modalContainer
  });

  runPingTest();
}

function navLink(iconName, label, href, active) {
  return el('a', { class: `nav-link${active ? ' is-active' : ''}`, href, 'aria-current': active ? 'page' : null }, [
    icon(iconName),
    el('span', { class: 'nav-label', text: label })
  ]);
}

export function loadingBlock(label = 'Đang tải dữ liệu...') {
  return el('div', { class: 'loading-block', role: 'status' }, [
    el('span', { class: 'spinner spinner-dark', 'aria-hidden': 'true' }),
    el('span', { text: label })
  ]);
}

export function bindTabs(tablist, onChange) {
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => onChange(tab.dataset.tab));
    tab.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : (index - 1 + tabs.length) % tabs.length;
      tabs[next].focus();
      onChange(tabs[next].dataset.tab);
    });
  });
}

export { roleLabel };
