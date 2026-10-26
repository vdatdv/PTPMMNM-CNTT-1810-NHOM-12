import { boot } from './app.js';
import { api } from './api.js';
import { el, emptyState, statusBadge, toast } from './ui.js';

const params = new URLSearchParams(location.search);
let rows = [];
const filters = { status: params.get('status') || 'all', q: '', quickOpen: false };

export function sanitizeCsvCell(value) {
  let text = value == null ? '' : String(value);
  if (/^[\s\u0000-\u001F]*[=+\-@]/.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function buildCsv(tableRows) {
  const lines = tableRows.map((row) => row.map(sanitizeCsvCell).join(','));
  return `\uFEFF${lines.join('\r\n')}`;
}

function filtered() {
  return rows.filter((row) => {
    if (filters.status !== 'all' && row.status !== filters.status) return false;
    const q = filters.q.trim().toLowerCase();
    if (!q) return true;
    return [row.body, row.author.name, row.projectName, row.screenName, row.versionLabel, row.status]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });
}

function csvMatrix(list) {
  const header = ['Số thứ tự', 'Dự án', 'Màn hình', 'Phiên bản', 'Nội dung', 'Vị trí', 'Người viết', 'Trạng thái'];
  const body = list.map((row, index) => [
    index + 1,
    row.projectName,
    row.screenName,
    row.versionLabel,
    row.body,
    `x=${row.x}; y=${row.y}; w=${row.w}; h=${row.h}`,
    row.author.name,
    row.status === 'resolved' ? 'Đã xử lý' : 'Chưa xử lý'
  ]);
  return [header, ...body];
}

function download(list) {
  const csv = buildCsv(csvMatrix(list));
  const stamp = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const name = `designmark-gop-y-${stamp.getFullYear()}${pad(stamp.getMonth() + 1)}${pad(stamp.getDate())}-${pad(stamp.getHours())}${pad(stamp.getMinutes())}.csv`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = el('a', { href: url, download: name });
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function renderTable(host) {
  const list = filtered();
  if (!list.length) {
    host.replaceChildren(emptyState({
      title: 'Không có góp ý',
      text: rows.length ? 'Không có dòng nào khớp bộ lọc hiện tại.' : 'Chưa có góp ý để xuất.'
    }));
    return;
  }
  const table = el('table', { class: 'data-table' });
  table.append(el('thead', {}, [
    el('tr', {}, ['STT', 'Nội dung', 'Vị trí', 'Người viết', 'Trạng thái', 'Phiên bản ảnh'].map((label) => el('th', { scope: 'col', text: label })))
  ]));
  const body = el('tbody');
  list.forEach((row, index) => {
    const content = el('td');
    content.textContent = row.body;
    body.append(el('tr', {}, [
      el('td', { text: String(index + 1) }),
      content,
      el('td', { text: `${Math.round(row.x)}, ${Math.round(row.y)}, ${Math.round(row.w)}, ${Math.round(row.h)}` }),
      el('td', { text: row.author.name }),
      el('td', {}, [statusBadge(row.status)]),
      el('td', {}, [
        el('a', {
          href: `review.php?project=${encodeURIComponent(row.projectId)}&screen=${encodeURIComponent(row.screenId)}&version=${encodeURIComponent(row.imageVersionId)}`,
          text: `${row.projectName} / ${row.screenName} / ${row.versionLabel}`
        })
      ])
    ]));
  });
  table.append(body);
  host.replaceChildren(el('div', { class: 'table-wrap' }, [table]));
}

if (typeof document !== 'undefined' && document.body?.dataset.page === 'feedback') {
  boot({
    active: 'feedback',
    title: 'Danh sách góp ý',
    async render({ setBreadcrumb }) {
      const projectId = params.get('project') || '';
      rows = await api.listFeedback(projectId || undefined);
      if (projectId && rows[0]) {
        setBreadcrumb([
          { label: 'DesignMark', href: 'projects.php' },
          { label: rows[0].projectName, href: `project.php?id=${encodeURIComponent(projectId)}` },
          { label: 'Góp ý' }
        ]);
      }
      const page = document.getElementById('page');
      const host = el('div');
      const status = el('select', { class: 'field-input', id: 'feedback-status', 'aria-label': 'Lọc trạng thái' }, [
        el('option', { value: 'all', text: 'Tất cả trạng thái' }),
        el('option', { value: 'open', text: 'Chưa xử lý' }),
        el('option', { value: 'resolved', text: 'Đã xử lý' })
      ]);
      status.value = filters.status;
      const search = el('input', { class: 'field-input search-input', type: 'search', id: 'feedback-search', placeholder: 'Tìm nội dung, người viết, màn hình', 'aria-label': 'Tìm góp ý' });
      const quick = el('button', { type: 'button', class: 'btn btn-secondary', text: 'Chưa xử lý', 'aria-pressed': 'false' });
      const exportBtn = el('button', { type: 'button', class: 'btn btn-primary', 'data-testid': 'export-csv', text: 'Xuất CSV' });
      const refresh = () => {
        renderTable(host);
        exportBtn.disabled = filtered().length === 0;
      };
      status.addEventListener('change', () => {
        filters.status = status.value;
        filters.quickOpen = status.value === 'open';
        quick.classList.toggle('is-active', filters.quickOpen);
        quick.setAttribute('aria-pressed', filters.quickOpen ? 'true' : 'false');
        refresh();
      });
      search.addEventListener('input', () => {
        filters.q = search.value;
        refresh();
      });
      quick.addEventListener('click', () => {
        filters.quickOpen = !filters.quickOpen;
        filters.status = filters.quickOpen ? 'open' : 'all';
        status.value = filters.status;
        quick.classList.toggle('is-active', filters.quickOpen);
        quick.setAttribute('aria-pressed', filters.quickOpen ? 'true' : 'false');
        refresh();
      });
      exportBtn.addEventListener('click', () => {
        const list = filtered();
        if (!list.length) {
          toast('Không có dữ liệu phù hợp để xuất.', 'error');
          return;
        }
        download(list);
        toast(`Đã xuất ${list.length} góp ý.`, 'success');
      });
      page.replaceChildren(
        el('div', { class: 'page-head' }, [
          el('p', { class: 'lede', text: 'Bảng phản ánh đúng bộ lọc hiện tại. Tệp CSV dùng UTF-8 có BOM.' }),
          el('div', { class: 'inline-actions' }, [quick, exportBtn])
        ]),
        el('div', { class: 'filter-bar' }, [status, search]),
        host
      );
      refresh();
    }
  });
}
