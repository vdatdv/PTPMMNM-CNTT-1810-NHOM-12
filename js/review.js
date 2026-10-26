import { boot } from './app.js';
import { api } from './api.js';
import { toOriginal, toStyle } from './coords.js';
import {
  avatarEl,
  el,
  emptyState,
  formatDate,
  openModal,
  pushEscape,
  setBusy,
  statusBadge,
  toast
} from './ui.js';

const params = new URLSearchParams(location.search);
const projectId = params.get('project');
const screenId = params.get('screen');

const ui = {};
const filters = { status: 'all', author: 'all', q: '' };
let project = null;
let screen = null;
let versions = [];
let version = null;
let annotations = [];
let role = 'viewer';
let tool = 'select';
let zoom = 1;
let fitMode = true;
let selectedId = null;
let composer = null;
let drag = null;
let editing = null;
let simulateConflict = false;
let removeComposerEscape = null;
let keyboard = { x: 500, y: 250, anchor: null };
let imageReady = false;

function canDraw() {
  return role === 'reviewer' || role === 'manager';
}

function coordTarget() {
  const img = ui.img;
  return {
    getBoundingClientRect: () => img.getBoundingClientRect(),
    naturalWidth: version?.width || img.naturalWidth,
    naturalHeight: version?.height || img.naturalHeight,
    dataset: img.dataset
  };
}

function waitForImage(img, url) {
  return new Promise((resolve, reject) => {
    const fail = () => reject(new Error('Không tải được ảnh của phiên bản này.'));
    const succeed = () => resolve();
    img.onload = succeed;
    img.onerror = fail;
    if (img.getAttribute('src') === url && img.complete) {
      if (img.naturalWidth) succeed();
      else fail();
      return;
    }
    img.src = url;
    if (img.complete && img.naturalWidth) succeed();
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function fmt(value) {
  return String(Math.round(Number(value) * 10) / 10);
}

function matches(ann) {
  if (filters.status !== 'all' && ann.status !== filters.status) return false;
  if (filters.author !== 'all' && ann.authorId !== filters.author) return false;
  const q = filters.q.trim().toLowerCase();
  if (!q) return true;
  return `${ann.body} ${ann.author.name}`.toLowerCase().includes(q);
}

function cacheUi() {
  [
    'version-select', 'version-banner', 'permission-note', 'zoom-label', 'screen-name',
    'compare-link', 'back-link', 'canvas-viewport', 'image-stage', 'review-image', 'image-overlay',
    'comment-panel', 'tool-select', 'tool-point', 'tool-rectangle', 'zoom-in', 'zoom-out', 'zoom-fit',
    'coord-btn', 'tool-hint'
  ].forEach((id) => {
    ui[id] = document.getElementById(id);
  });
  ui.viewport = ui['canvas-viewport'];
  ui.stage = ui['image-stage'];
  ui.img = ui['review-image'];
  ui.overlay = ui['image-overlay'];
  ui.panel = ui['comment-panel'];
}

async function normalizeImage(url) {
  imageReady = false;
  ui.overlay.style.pointerEvents = 'none';
  ui.img.dataset.originalWidth = String(version.width);
  ui.img.dataset.originalHeight = String(version.height);
  ui.img.alt = `Ảnh thiết kế ${screen.name}, phiên bản v${version.number}`;
  await waitForImage(ui.img, url);
  if (ui.img.naturalWidth && ui.img.naturalHeight && (ui.img.naturalWidth !== version.width || ui.img.naturalHeight !== version.height)) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = version.width;
      canvas.height = version.height;
      canvas.getContext('2d').drawImage(ui.img, 0, 0, version.width, version.height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        const normalized = URL.createObjectURL(blob);
        await new Promise((resolve) => {
          ui.img.onload = () => resolve();
          ui.img.onerror = () => resolve();
          ui.img.src = normalized;
        });
      }
    } catch (err) {
      toast('Không chuẩn hóa được kích thước ảnh. Tọa độ dùng kích thước đã lưu.', 'error');
    }
  }
  if (!ui.img.naturalWidth) {
    toast('Trình duyệt không trả về kích thước gốc. Tọa độ sẽ dùng kích thước đã lưu của phiên bản.', 'error');
  }
  imageReady = true;
  ui.overlay.style.pointerEvents = '';
}

function applyZoom() {
  if (!version) return;
  ui.stage.style.width = `${Math.max(1, Math.round(version.width * zoom))}px`;
  ui['zoom-label'].textContent = `${Math.round(zoom * 100)}%`;
  positionComposer();
}

function computeFit() {
  const pad = 48;
  const cw = Math.max(160, ui.viewport.clientWidth - pad);
  const ch = Math.max(160, ui.viewport.clientHeight - pad);
  return clamp(Math.min(cw / version.width, ch / version.height), 0.1, 4);
}

function applyFit() {
  fitMode = true;
  zoom = computeFit();
  applyZoom();
}

function zoomBy(factor) {
  fitMode = false;
  zoom = clamp(zoom * factor, 0.1, 4);
  applyZoom();
}

function updateBanner() {
  const latest = versions[versions.length - 1];
  const old = version.id !== latest?.id;
  ui['version-banner'].hidden = !old;
  ui['version-banner'].textContent = old
    ? `Bạn đang xem v${version.number}. Góp ý ở đây chỉ thuộc v${version.number}.`
    : '';
  ui['compare-link'].href = `compare.php?project=${encodeURIComponent(project.id)}&screen=${encodeURIComponent(screen.id)}&left=${encodeURIComponent(versions[0]?.id || '')}&right=${encodeURIComponent(latest?.id || '')}`;
}

function setTool(next) {
  if ((next === 'point' || next === 'rect') && !canDraw()) return;
  tool = next;
  keyboard.anchor = null;
  ui.overlay.classList.toggle('is-point', tool === 'point');
  ui.overlay.classList.toggle('is-rect', tool === 'rect');
  ['select', 'point', 'rectangle'].forEach((name) => {
    const button = document.getElementById(name === 'rectangle' ? 'tool-rectangle' : `tool-${name}`);
    const active = (name === 'rectangle' ? 'rect' : name) === tool;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  const hints = {
    select: 'Công cụ chọn. Nhấp marker hoặc thread để xem góp ý.',
    point: 'Công cụ đặt điểm. Nhấp lên ảnh, hoặc dùng mũi tên và Enter khi vùng ảnh được chọn.',
    rect: 'Công cụ khoanh vùng. Kéo trên ảnh. Kéo ngắn hơn 4 pixel sẽ được tính là điểm.'
  };
  ui['tool-hint'].textContent = hints[tool];
  showCrosshair(document.activeElement === ui.stage);
}

function clearTemp() {
  ui.overlay.querySelectorAll('.temp-rect, .temp-point').forEach((node) => node.remove());
}

function showTemp(draft) {
  clearTemp();
  const style = toStyle(draft, version.width, version.height);
  if (draft.type === 'rect') {
    const node = el('div', { class: 'temp-rect' });
    node.style.left = style.left;
    node.style.top = style.top;
    node.style.width = style.width;
    node.style.height = style.height;
    ui.overlay.append(node);
    return;
  }
  const node = el('div', { class: 'marker marker-point status-open temp-point', 'aria-hidden': 'true', text: '+' });
  node.style.left = style.left;
  node.style.top = style.top;
  ui.overlay.append(node);
}

function showCrosshair(visible) {
  let node = ui.overlay.querySelector('.crosshair');
  if (!visible || !canDraw() || tool === 'select') {
    node?.remove();
    return;
  }
  if (!node) {
    node = el('div', { class: 'crosshair', 'aria-hidden': 'true' });
    ui.overlay.append(node);
  }
  const style = toStyle({ x: keyboard.x, y: keyboard.y, w: 0, h: 0 }, version.width, version.height);
  node.style.left = style.left;
  node.style.top = style.top;
}

function clientFromOriginal(x, y) {
  const rect = ui.img.getBoundingClientRect();
  const nw = ui.img.naturalWidth || version.width;
  const nh = ui.img.naturalHeight || version.height;
  return {
    clientX: rect.left + (x / nw) * rect.width,
    clientY: rect.top + (y / nh) * rect.height
  };
}

function positionComposer() {
  if (!composer?.pop) return;
  const point = clientFromOriginal(composer.x, composer.y);
  const pop = composer.pop;
  const margin = 8;
  const width = pop.offsetWidth || 320;
  const height = pop.offsetHeight || 200;
  let left = point.clientX + 12;
  let top = point.clientY + 12;
  if (left + width > window.innerWidth - margin) left = window.innerWidth - width - margin;
  if (top + height > window.innerHeight - margin) top = Math.max(margin, point.clientY - height - 12);
  pop.style.left = `${Math.max(margin, left)}px`;
  pop.style.top = `${Math.max(margin, top)}px`;
}

function closeComposer() {
  composer?.pop?.remove();
  composer = null;
  clearTemp();
  if (removeComposerEscape) {
    removeComposerEscape();
    removeComposerEscape = null;
  }
}

function openComposer(draft) {
  if (!canDraw()) {
    toast('Bạn chỉ có quyền xem.', 'error');
    return;
  }
  if (!imageReady) return;
  closeComposer();
  composer = { ...draft };
  showTemp(draft);
  const textarea = el('textarea', { class: 'field-input', id: 'comment-body', maxlength: '2000' });
  const error = el('p', { class: 'field-error', id: 'comment-error' });
  const send = el('button', { type: 'button', class: 'btn btn-primary btn-sm', 'data-testid': 'send-comment', text: 'Gửi' });
  const cancel = el('button', { type: 'button', class: 'btn btn-secondary btn-sm', 'data-testid': 'cancel-comment', text: 'Hủy' });
  const pop = el('div', { class: 'popover', role: 'dialog', 'aria-label': 'Nhập nhận xét', 'data-testid': 'comment-popover' }, [
    el('label', { class: 'field-label', for: 'comment-body', text: draft.type === 'rect' ? 'Nhận xét cho vùng khoanh' : 'Nhận xét cho điểm' }),
    el('p', { class: 'coord', text: `x ${fmt(draft.x)}, y ${fmt(draft.y)}, w ${fmt(draft.w)}, h ${fmt(draft.h)}` }),
    textarea,
    error,
    el('div', { class: 'inline-actions' }, [send, cancel])
  ]);
  document.body.append(pop);
  composer.pop = pop;
  positionComposer();
  textarea.focus();
  cancel.addEventListener('click', closeComposer);
  send.addEventListener('click', () => submitComposer(textarea, error, send));
  textarea.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) submitComposer(textarea, error, send);
  });
  removeComposerEscape = pushEscape(closeComposer);
}

async function submitComposer(textarea, error, send) {
  error.textContent = '';
  if (!textarea.value.trim()) {
    error.textContent = 'Nhận xét không được để trống.';
    textarea.focus();
    return;
  }
  setBusy(send, true, 'Đang gửi...');
  try {
    const created = await api.createAnnotation({
      imageVersionId: version.id,
      type: composer.type,
      x: composer.x,
      y: composer.y,
      w: composer.w,
      h: composer.h,
      body: textarea.value
    });
    closeComposer();
    filters.status = 'all';
    filters.q = '';
    syncFilterControls();
    await reloadAnnotations();
    selectAnnotation(created.id, 'create');
    toast('Đã lưu góp ý.', 'success');
  } catch (err) {
    setBusy(send, false);
    error.textContent = err.message || 'Không lưu được góp ý.';
    toast(err.message || 'Không lưu được góp ý.', 'error');
  }
}

function renderMarkers() {
  const extras = [...ui.overlay.querySelectorAll('.temp-rect, .temp-point, .crosshair')];
  ui.overlay.replaceChildren();
  annotations.forEach((ann) => {
    const style = toStyle(ann, ann.originalWidth || version.width, ann.originalHeight || version.height);
    const marker = el('button', {
      type: 'button',
      class: `marker marker-${ann.type === 'rect' ? 'rect' : 'point'} status-${ann.status}${ann.id === selectedId ? ' is-active' : ''}`,
      'data-testid': 'annotation-marker',
      'data-id': ann.id,
      'aria-label': `Góp ý ${ann.number}: ${ann.body}`
    });
    marker.dataset.id = ann.id;
    marker.style.left = style.left;
    marker.style.top = style.top;
    if (ann.type === 'rect') {
      marker.style.width = style.width;
      marker.style.height = style.height;
      marker.append(el('span', { class: `marker-label status-${ann.status}`, text: String(ann.number) }));
    } else {
      marker.textContent = String(ann.number);
    }
    marker.addEventListener('pointerdown', (event) => event.stopPropagation());
    marker.addEventListener('click', (event) => {
      event.stopPropagation();
      selectAnnotation(ann.id, 'marker');
    });
    ui.overlay.append(marker);
  });
  extras.forEach((node) => ui.overlay.append(node));
}

function selectAnnotation(id, source) {
  const ann = annotations.find((item) => item.id === id);
  if (ann && !matches(ann)) {
    filters.status = 'all';
    filters.author = 'all';
    filters.q = '';
    syncFilterControls();
    renderThreads();
  }
  selectedId = id;
  ui.overlay.querySelectorAll('.marker').forEach((node) => node.classList.toggle('is-active', node.dataset.id === id));
  ui.panel.querySelectorAll('[data-testid="comment-thread"]').forEach((node) => {
    const on = node.dataset.id === id;
    node.classList.toggle('is-active', on);
    if (on) node.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  if (source !== 'marker') {
    ui.overlay.querySelector(`.marker[data-id="${id}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}

function syncFilterControls() {
  const status = ui.panel.querySelector('#filter-status');
  const author = ui.panel.querySelector('#filter-author');
  const search = ui.panel.querySelector('#filter-search');
  if (status) status.value = filters.status;
  if (author) author.value = filters.author;
  if (search && document.activeElement !== search) search.value = filters.q;
}

function renderThreads() {
  const list = ui.panel.querySelector('#thread-list');
  if (!list) return;
  const visible = annotations.filter(matches);
  list.replaceChildren();
  if (!visible.length) {
    list.append(emptyState({
      title: annotations.length ? 'Không có góp ý phù hợp' : 'Chưa có góp ý',
      text: annotations.length ? 'Thử đổi bộ lọc hoặc từ khóa.' : 'Đặt điểm hoặc khoanh vùng trên ảnh để bắt đầu.'
    }));
    return;
  }
  visible.forEach((ann) => list.append(renderThread(ann)));
}

function renderThread(ann) {
  const thread = el('article', {
    class: `thread${ann.id === selectedId ? ' is-active' : ''}`,
    'data-testid': 'comment-thread',
    tabindex: '0'
  });
  thread.dataset.id = ann.id;
  thread.addEventListener('click', () => selectAnnotation(ann.id, 'thread'));
  thread.addEventListener('keydown', (event) => {
    if (event.target !== thread) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectAnnotation(ann.id, 'thread');
    }
  });
  const head = el('div', { class: 'thread-top' }, [
    avatarEl(ann.author, 32),
    el('div', {}, [
      el('strong', { text: `${ann.number}. ${ann.author.name}` }),
      el('div', {}, [el('time', { datetime: ann.createdAt, text: formatDate(ann.createdAt) })])
    ]),
    statusBadge(ann.status)
  ]);
  const body = el('p', { class: 'thread-body' });
  body.textContent = ann.body;
  const coord = el('p', { class: 'coord', text: `Ảnh gốc: x ${fmt(ann.x)}, y ${fmt(ann.y)}, w ${fmt(ann.w)}, h ${fmt(ann.h)} · ${ann.type === 'rect' ? 'Vùng' : 'Điểm'} · v${ann.versionNumber}` });
  thread.append(head, body, coord);
  if (editing?.id === ann.id) thread.append(editBox(ann));
  (ann.replies || []).forEach((reply) => {
    const copy = el('div', { class: 'reply-copy' });
    const replyBody = el('p', { class: 'reply-body' });
    replyBody.textContent = reply.body;
    copy.append(el('strong', { text: reply.author.name }), el('time', { datetime: reply.createdAt, text: ` · ${formatDate(reply.createdAt)}` }), replyBody);
    thread.append(el('div', { class: 'reply' }, [avatarEl(reply.author, 24), copy]));
  });
  if (canDraw()) thread.append(actionRow(ann), replyBox(ann));
  if (ann.statusHistory?.length) {
    const history = el('div', { class: 'help' });
    ann.statusHistory.forEach((item) => {
      const line = el('div', { text: `${formatDate(item.at)} · ${item.user?.name || ''} · ${item.note || (item.status === 'resolved' ? 'Đã xử lý' : 'Mở lại')}` });
      history.append(line);
    });
    thread.append(el('details', {}, [el('summary', { text: 'Lịch sử trạng thái' }), history]));
  }
  return thread;
}

function actionRow(ann) {
  const row = el('div', { class: 'thread-actions' });
  if (ann.author.username === document.body.dataset.user) {
    row.append(el('button', { type: 'button', class: 'btn btn-secondary btn-sm', text: 'Sửa', onclick: (event) => { event.stopPropagation(); startEdit(ann); } }));
  }
  if (ann.status === 'open') {
    row.append(el('button', { type: 'button', class: 'btn btn-secondary btn-sm', text: 'Đánh dấu đã xử lý', onclick: (event) => { event.stopPropagation(); changeStatus(ann, 'resolved'); } }));
  } else {
    row.append(el('button', { type: 'button', class: 'btn btn-secondary btn-sm', text: 'Mở lại', onclick: (event) => { event.stopPropagation(); changeStatus(ann, 'open'); } }));
  }
  return row;
}

function startEdit(ann) {
  editing = { id: ann.id, body: ann.body, revision: ann.revision };
  renderThreads();
  ui.panel.querySelector(`#edit-${ann.id}`)?.focus();
}

function editBox(ann) {
  const textarea = el('textarea', { class: 'field-input', id: `edit-${ann.id}` });
  textarea.value = editing.body;
  const error = el('p', { class: 'field-error' });
  const save = el('button', { type: 'button', class: 'btn btn-primary btn-sm', text: 'Lưu' });
  const cancel = el('button', { type: 'button', class: 'btn btn-secondary btn-sm', text: 'Hủy', onclick: (event) => { event.stopPropagation(); editing = null; renderThreads(); } });
  save.addEventListener('click', async (event) => {
    event.stopPropagation();
    if (!textarea.value.trim()) {
      error.textContent = 'Nhận xét không được để trống.';
      return;
    }
    setBusy(save, true, 'Đang lưu...');
    try {
      await api.updateAnnotationBody(ann.id, {
        body: textarea.value,
        revision: editing.revision,
        simulateConflict
      });
      simulateConflict = false;
      syncConflictButton();
      editing = null;
      await reloadAnnotations();
      toast('Đã cập nhật nhận xét.', 'success');
    } catch (err) {
      setBusy(save, false);
      if (err.code === 'CONFLICT') {
        simulateConflict = false;
        syncConflictButton();
        openConflict(ann.id, err);
        return;
      }
      error.textContent = err.message || 'Không lưu được.';
      toast(err.message || 'Không lưu được nhận xét.', 'error');
    }
  });
  return el('div', { onclick: (event) => event.stopPropagation() }, [
    el('label', { class: 'field-label', for: `edit-${ann.id}`, text: 'Sửa nhận xét' }),
    textarea,
    error,
    el('div', { class: 'inline-actions' }, [save, cancel])
  ]);
}

function openConflict(id, err) {
  const mine = el('div', { class: 'conflict-box' });
  mine.textContent = err.mine || '';
  const latest = el('div', { class: 'conflict-box' });
  latest.textContent = err.latest?.body || '';
  const content = el('div', {}, [
    el('p', { class: 'modal-copy', text: 'Nhận xét đã thay đổi trước khi bạn lưu. Không tự ghi đè.' }),
    el('div', { class: 'conflict-grid' }, [
      el('div', {}, [el('h3', { text: 'Nội dung của tôi' }), mine]),
      el('div', {}, [el('h3', { text: 'Nội dung mới nhất' }), latest])
    ]),
    el('div', { class: 'modal-actions' }, [
      el('button', { type: 'button', class: 'btn btn-secondary', text: 'Tải bản mới nhất', onclick: async () => { modal.close(); editing = null; await reloadAnnotations(); } }),
      el('button', { type: 'button', class: 'btn btn-primary', text: 'Giữ nội dung của tôi để sửa lại', onclick: async () => {
        modal.close();
        editing = { id, body: err.mine, revision: err.latest.revision };
        await reloadAnnotations();
        toast('Bản trên máy chủ đã đổi. Hãy lưu lại nếu bạn muốn dùng nội dung của mình.', 'info');
      } })
    ])
  ]);
  const modal = openModal({ title: 'Xung đột nội dung', content, size: 'wide' });
}

function replyBox(ann) {
  const input = el('textarea', { class: 'field-input', id: `reply-${ann.id}`, placeholder: 'Viết trả lời' });
  const button = el('button', { type: 'button', class: 'btn btn-secondary btn-sm', text: 'Gửi trả lời' });
  button.addEventListener('click', async (event) => {
    event.stopPropagation();
    if (!input.value.trim()) {
      toast('Trả lời không được để trống.', 'error');
      return;
    }
    setBusy(button, true, 'Đang gửi...');
    try {
      await api.addReply(ann.id, input.value);
      await reloadAnnotations();
      toast('Đã gửi trả lời.', 'success');
    } catch (err) {
      setBusy(button, false);
      toast(err.message || 'Không gửi được trả lời.', 'error');
    }
  });
  return el('div', { onclick: (event) => event.stopPropagation() }, [input, el('div', { class: 'inline-actions' }, [button])]);
}

async function changeStatus(ann, status) {
  try {
    await api.setAnnotationStatus(ann.id, status);
    await reloadAnnotations();
    toast(status === 'resolved' ? 'Đã đánh dấu đã xử lý.' : 'Đã mở lại góp ý.', 'success');
  } catch (err) {
    toast(err.message || 'Không đổi được trạng thái.', 'error');
  }
}

function ensurePanel() {
  const authors = new Map();
  annotations.forEach((ann) => authors.set(ann.authorId, ann.author.name));
  const status = el('select', { class: 'field-input', id: 'filter-status', 'aria-label': 'Lọc trạng thái' }, [
    el('option', { value: 'all', text: 'Tất cả' }),
    el('option', { value: 'open', text: 'Chưa xử lý' }),
    el('option', { value: 'resolved', text: 'Đã xử lý' })
  ]);
  const author = el('select', { class: 'field-input', id: 'filter-author', 'aria-label': 'Lọc tác giả' }, [
    el('option', { value: 'all', text: 'Mọi người' }),
    ...[...authors.entries()].map(([id, name]) => el('option', { value: id, text: name }))
  ]);
  const search = el('input', { class: 'field-input search-input', id: 'filter-search', type: 'search', placeholder: 'Tìm nhận xét', 'aria-label': 'Tìm nhận xét' });
  status.value = filters.status;
  author.value = filters.author;
  search.value = filters.q;
  status.addEventListener('change', () => { filters.status = status.value; renderThreads(); });
  author.addEventListener('change', () => { filters.author = author.value; renderThreads(); });
  search.addEventListener('input', () => { filters.q = search.value; renderThreads(); });
  const conflict = el('button', {
    type: 'button',
    class: 'btn btn-secondary btn-sm',
    id: 'conflict-toggle',
    text: 'Giả lập xung đột',
    hidden: !canDraw()
  });
  conflict.addEventListener('click', () => {
    simulateConflict = !simulateConflict;
    syncConflictButton();
    toast(simulateConflict ? 'Lần sửa nhận xét tiếp theo sẽ mô phỏng xung đột.' : 'Đã tắt giả lập xung đột.', 'info');
  });
  ui.panel.replaceChildren(
    el('div', { class: 'panel-head' }, [
      el('div', {}, [
        el('h2', { text: 'Góp ý' }),
        el('p', { class: 'help', id: 'comment-count' })
      ]),
      conflict
    ]),
    el('div', { class: 'panel-pad' }, [
      canDraw() ? null : el('p', { class: 'permission-note', text: 'Bạn chỉ có quyền xem.' }),
      el('div', { class: 'filter-bar' }, [status, author]),
      search
    ]),
    el('div', { id: 'thread-list' })
  );
  syncConflictButton();
}

function syncConflictButton() {
  const button = document.getElementById('conflict-toggle');
  if (!button) return;
  button.classList.toggle('is-active', simulateConflict);
  button.setAttribute('aria-pressed', simulateConflict ? 'true' : 'false');
  button.textContent = simulateConflict ? 'Giả lập xung đột: bật' : 'Giả lập xung đột';
}

function updateCount() {
  const node = document.getElementById('comment-count');
  if (node) node.textContent = `${annotations.length} góp ý trên phiên bản này`;
}

async function reloadAnnotations() {
  annotations = await api.listAnnotations(version.id);
  ensurePanel();
  updateCount();
  renderMarkers();
  renderThreads();
}

function finishDrag(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const dx = event.clientX - drag.startClientX;
  const dy = event.clientY - drag.startClientY;
  const dist = Math.hypot(dx, dy);
  const end = toOriginal(event, coordTarget());
  const start = drag.start;
  const used = drag.tool;
  drag = null;
  if (used === 'point' || dist < 4) {
    openComposer({ type: 'point', x: start.x, y: start.y, w: 0, h: 0 });
    return;
  }
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const w = Math.abs(end.x - start.x);
  const h = Math.abs(end.y - start.y);
  if (w <= 0 || h <= 0) {
    clearTemp();
    return;
  }
  openComposer({ type: 'rect', x, y, w, h });
}

function bindPointer() {
  ui.overlay.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || composer || !imageReady) return;
    if (event.target.closest('.marker')) return;
    if (tool === 'select') {
      selectedId = null;
      renderMarkers();
      renderThreads();
      return;
    }
    if (!canDraw()) return;
    event.preventDefault();
    try { ui.overlay.setPointerCapture(event.pointerId); } catch (err) { /* một số trình duyệt từ chối capture */ }
    drag = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      start: toOriginal(event, coordTarget()),
      tool
    };
    if (tool === 'rect') showTemp({ type: 'rect', ...rectFrom(drag.start, drag.start) });
  });
  ui.overlay.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.pointerId || drag.tool !== 'rect') return;
    showTemp({ type: 'rect', ...rectFrom(drag.start, toOriginal(event, coordTarget())) });
  });
  ui.overlay.addEventListener('pointerup', finishDrag);
  ui.overlay.addEventListener('pointercancel', () => {
    drag = null;
    clearTemp();
  });
  window.addEventListener('pointerup', finishDrag);
  window.addEventListener('pointercancel', () => {
    if (!drag) return;
    drag = null;
    clearTemp();
  });
}

function rectFrom(start, end) {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    w: Math.abs(end.x - start.x),
    h: Math.abs(end.y - start.y)
  };
}

function bindKeyboard() {
  ui.stage.addEventListener('keydown', (event) => {
    if (!canDraw() || tool === 'select') return;
    const step = event.shiftKey ? 40 : 10;
    if (event.key === 'ArrowLeft') keyboard.x -= step;
    else if (event.key === 'ArrowRight') keyboard.x += step;
    else if (event.key === 'ArrowUp') keyboard.y -= step;
    else if (event.key === 'ArrowDown') keyboard.y += step;
    else if (event.key === 'Escape' && keyboard.anchor) {
      keyboard.anchor = null;
      toast('Đã hủy vùng đang tạo bằng bàn phím.', 'info');
      return;
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      placeFromKeyboard();
      return;
    } else return;
    event.preventDefault();
    keyboard.x = clamp(keyboard.x, 0, version.width);
    keyboard.y = clamp(keyboard.y, 0, version.height);
    showCrosshair(true);
    ui['tool-hint'].textContent = `Tọa độ bàn phím: x ${fmt(keyboard.x)}, y ${fmt(keyboard.y)}`;
  });
  ui.stage.addEventListener('focus', () => showCrosshair(true));
  ui.stage.addEventListener('blur', () => showCrosshair(false));
}

function placeFromKeyboard() {
  if (tool === 'rect') {
    if (!keyboard.anchor) {
      keyboard.anchor = { x: keyboard.x, y: keyboard.y };
      toast('Đã chọn điểm bắt đầu. Di chuyển rồi nhấn Enter để hoàn tất.', 'info');
      return;
    }
    const draft = { type: 'rect', ...rectFrom(keyboard.anchor, keyboard) };
    keyboard.anchor = null;
    if (draft.w < 1 && draft.h < 1) {
      openComposer({ type: 'point', x: keyboard.x, y: keyboard.y, w: 0, h: 0 });
      return;
    }
    openComposer(draft);
    return;
  }
  openComposer({ type: 'point', x: keyboard.x, y: keyboard.y, w: 0, h: 0 });
}

function openCoordDialog() {
  if (!canDraw()) return;
  const x = el('input', { class: 'field-input', id: 'coord-x', type: 'number', min: '0', step: '1', value: '100' });
  const y = el('input', { class: 'field-input', id: 'coord-y', type: 'number', min: '0', step: '1', value: '100' });
  const w = el('input', { class: 'field-input', id: 'coord-w', type: 'number', min: '0', step: '1', value: '0' });
  const h = el('input', { class: 'field-input', id: 'coord-h', type: 'number', min: '0', step: '1', value: '0' });
  const body = el('textarea', { class: 'field-input', id: 'coord-body' });
  const error = el('p', { class: 'field-error' });
  const form = el('form', {}, [
    el('p', { class: 'help', text: 'Nhập tọa độ pixel của ảnh gốc. Để w và h bằng 0 nếu muốn đặt điểm.' }),
    el('div', { class: 'filter-bar' }, [
      labeled('coord-x', 'X', x), labeled('coord-y', 'Y', y), labeled('coord-w', 'W', w), labeled('coord-h', 'H', h)
    ]),
    el('label', { class: 'field-label', for: 'coord-body', text: 'Nhận xét' }),
    body,
    error,
    el('div', { class: 'modal-actions' }, [
      el('button', { type: 'button', class: 'btn btn-secondary', text: 'Hủy', onclick: () => modal.close() }),
      el('button', { type: 'submit', class: 'btn btn-primary', text: 'Lưu góp ý' })
    ])
  ]);
  const modal = openModal({ title: 'Nhập tọa độ', content: form });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const draft = {
      type: Number(w.value) > 0 && Number(h.value) > 0 ? 'rect' : 'point',
      x: Number(x.value),
      y: Number(y.value),
      w: Number(w.value) > 0 && Number(h.value) > 0 ? Number(w.value) : 0,
      h: Number(w.value) > 0 && Number(h.value) > 0 ? Number(h.value) : 0,
      body: body.value
    };
    try {
      const created = await api.createAnnotation({ ...draft, imageVersionId: version.id });
      modal.close();
      await reloadAnnotations();
      selectAnnotation(created.id, 'create');
      toast('Đã lưu góp ý theo tọa độ.', 'success');
    } catch (err) {
      error.textContent = err.message;
      toast(err.message || 'Không lưu được góp ý.', 'error');
    }
  });
}

function labeled(id, text, control) {
  return el('label', { class: 'field', for: id }, [el('span', { class: 'field-label', text }), control]);
}

async function showVersion(nextId, pushUrl = true) {
  closeComposer();
  selectedId = null;
  editing = null;
  filters.author = 'all';
  filters.status = 'all';
  filters.q = '';
  version = versions.find((item) => item.id === nextId) || versions[versions.length - 1];
  keyboard = { x: version.width / 2, y: version.height / 2, anchor: null };
  ui['version-select'].value = version.id;
  ui['screen-name'].textContent = screen.name;
  updateBanner();
  if (pushUrl) {
    const url = `review.php?project=${encodeURIComponent(project.id)}&screen=${encodeURIComponent(screen.id)}&version=${encodeURIComponent(version.id)}`;
    history.replaceState(null, '', url);
  }
  const src = await api.resolveImageUrl(version.imageKey);
  await normalizeImage(src);
  if (fitMode) applyFit();
  else applyZoom();
  await reloadAnnotations();
}

function bindChrome() {
  ui['back-link'].href = `project.php?id=${encodeURIComponent(project.id)}`;
  ui['version-select'].replaceChildren(...versions.map((item) => el('option', { value: item.id, text: item.label })));
  ui['version-select'].addEventListener('change', () => {
    showVersion(ui['version-select'].value).catch((err) => toast(err.message, 'error'));
  });
  ui['zoom-in'].addEventListener('click', () => zoomBy(1.2));
  ui['zoom-out'].addEventListener('click', () => zoomBy(1 / 1.2));
  ui['zoom-fit'].addEventListener('click', applyFit);
  ui['tool-select'].addEventListener('click', () => setTool('select'));
  ui['tool-point'].addEventListener('click', () => setTool('point'));
  ui['tool-rectangle'].addEventListener('click', () => setTool('rect'));
  ui['coord-btn'].addEventListener('click', openCoordDialog);
  ui['tool-point'].hidden = !canDraw();
  ui['tool-rectangle'].hidden = !canDraw();
  ui['coord-btn'].hidden = !canDraw();
  ui['permission-note'].hidden = canDraw();
  setTool('select');
  bindPointer();
  bindKeyboard();
  ui.viewport.addEventListener('scroll', positionComposer);
  window.addEventListener('resize', () => {
    if (fitMode) applyFit();
    else positionComposer();
  });
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(() => { if (fitMode && version) applyFit(); });
    observer.observe(ui.viewport);
  }
}

boot({
  active: 'projects',
  title: 'Góp ý trên ảnh',
  async render({ session, setBreadcrumb, setPageTitle }) {
    cacheUi();
    if (!projectId || !screenId) throw new Error('Thiếu màn hình thiết kế cần góp ý.');
    document.body.dataset.user = session.username;
    project = await api.getProject(projectId);
    screen = await api.getScreen(screenId);
    role = project.myRole || 'viewer';
    versions = await api.listVersions(screenId);
    if (!versions.length) throw new Error('Màn hình này chưa có phiên bản ảnh.');
    setPageTitle(screen.name);
    setBreadcrumb([
      { label: 'DesignMark', href: 'projects.php' },
      { label: project.name, href: `project.php?id=${encodeURIComponent(project.id)}` },
      { label: screen.name }
    ]);
    bindChrome();
    const requested = params.get('version');
    await showVersion(requested || versions[versions.length - 1].id, false);
    const targetAnnId = params.get('annotation') || (location.hash ? location.hash.replace('#', '') : null);
    if (targetAnnId) {
      setTimeout(() => {
        selectAnnotation(targetAnnId, 'url');
      }, 200);
    }
  }
});
