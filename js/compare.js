import { boot } from './app.js';
import { api } from './api.js';
import { toStyle } from './coords.js';
import { el, emptyState, setBusy, statusBadge, toast } from './ui.js';

const params = new URLSearchParams(location.search);
const sides = { left: null, right: null };
let syncZoom = true;
let role = 'viewer';
let versions = [];
let screen = null;
let project = null;

function canEdit() {
  return role === 'reviewer' || role === 'manager';
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createPane(side) {
  const select = el('select', { class: 'field-input', 'aria-label': side === 'left' ? 'Phiên bản bên trái' : 'Phiên bản bên phải' });
  const zoomLabel = el('strong', { class: 'zoom-label', text: '100%' });
  const viewport = el('div', { class: 'canvas-viewport' });
  const stage = el('div', { class: 'image-stage', 'data-testid': 'image-stage' });
  const img = el('img', { alt: '' });
  const overlay = el('div', { class: 'overlay', 'data-testid': 'image-overlay' });
  stage.append(img, overlay);
  viewport.append(el('div', { class: 'canvas-pad' }, [stage]));
  const list = el('div', { class: 'panel' });
  const pane = el('section', { class: 'compare-pane' }, [
    el('div', { class: 'toolbar' }, [
      el('label', { class: 'field-label', text: side === 'left' ? 'Bên trái' : 'Bên phải' }),
      select,
      el('button', { type: 'button', class: 'btn btn-secondary btn-sm', text: '−', 'aria-label': 'Thu nhỏ', onclick: () => changeZoom(side, 1 / 1.2) }),
      zoomLabel,
      el('button', { type: 'button', class: 'btn btn-secondary btn-sm', text: '+', 'aria-label': 'Phóng to', onclick: () => changeZoom(side, 1.2) }),
      el('button', { type: 'button', class: 'btn btn-secondary btn-sm', text: 'Vừa khung', onclick: () => fit(side) })
    ]),
    viewport,
    list
  ]);
  return { side, select, zoomLabel, viewport, stage, img, overlay, list, pane, zoom: 1, fitMode: true, version: null, annotations: [] };
}

function applyZoom(pane) {
  if (!pane.version) return;
  pane.stage.style.width = `${Math.max(1, Math.round(pane.version.width * pane.zoom))}px`;
  pane.zoomLabel.textContent = `${Math.round(pane.zoom * 100)}%`;
}

function computeFit(pane) {
  const pad = 48;
  return clamp(Math.min(
    Math.max(120, pane.viewport.clientWidth - pad) / pane.version.width,
    Math.max(120, pane.viewport.clientHeight - pad) / pane.version.height
  ), 0.1, 4);
}

function changeZoom(side, factor, origin) {
  const pane = sides[side];
  pane.fitMode = false;
  pane.zoom = clamp(pane.zoom * factor, 0.1, 4);
  applyZoom(pane);
  if (syncZoom && origin !== 'sync') {
    const other = sides[side === 'left' ? 'right' : 'left'];
    other.fitMode = false;
    other.zoom = pane.zoom;
    applyZoom(other);
  }
}

function fit(side, origin) {
  const pane = sides[side];
  pane.fitMode = true;
  pane.zoom = computeFit(pane);
  applyZoom(pane);
  if (syncZoom && origin !== 'sync') {
    const other = sides[side === 'left' ? 'right' : 'left'];
    other.zoom = pane.zoom;
    other.fitMode = true;
    applyZoom(other);
  }
}

function renderMarkers(pane) {
  pane.overlay.replaceChildren();
  pane.annotations.forEach((ann) => {
    const style = toStyle(ann, ann.originalWidth || pane.version.width, ann.originalHeight || pane.version.height);
    const marker = el('div', {
      class: `marker marker-${ann.type === 'rect' ? 'rect' : 'point'} status-${ann.status}`,
      'data-testid': 'annotation-marker',
      'aria-hidden': 'true'
    });
    marker.style.left = style.left;
    marker.style.top = style.top;
    if (ann.type === 'rect') {
      marker.style.width = style.width;
      marker.style.height = style.height;
      marker.append(el('span', { class: `marker-label status-${ann.status}`, text: String(ann.number) }));
    } else {
      marker.textContent = String(ann.number);
      marker.style.transform = 'translate(-50%, -50%)';
    }
    pane.overlay.append(marker);
  });
}

async function loadPane(pane, versionId) {
  pane.version = versions.find((item) => item.id === versionId) || versions[versions.length - 1];
  pane.select.value = pane.version.id;
  pane.img.alt = `${screen.name} ${pane.version.label}`;
  pane.img.dataset.originalWidth = String(pane.version.width);
  pane.img.dataset.originalHeight = String(pane.version.height);
  const src = await api.resolveImageUrl(pane.version.imageKey);
  await new Promise((resolve, reject) => {
    const succeed = () => resolve();
    const fail = () => reject(new Error(`Không tải được ảnh ${pane.version.label}.`));
    pane.img.onload = succeed;
    pane.img.onerror = fail;
    if (pane.img.getAttribute('src') === src && pane.img.complete) {
      if (pane.img.naturalWidth) succeed();
      else fail();
      return;
    }
    pane.img.src = src;
    if (pane.img.complete && pane.img.naturalWidth) succeed();
  });
  pane.annotations = await api.listAnnotations(pane.version.id);
  renderMarkers(pane);
  renderList(pane);
  if (pane.fitMode) fit(pane.side, 'sync');
  else applyZoom(pane);
}

function renderList(pane) {
  const items = pane.annotations.length
    ? pane.annotations.map((ann) => commentCard(pane, ann))
    : [emptyState({ title: 'Không có góp ý', text: `Phiên bản ${pane.version.label} chưa có annotation.` })];
  pane.list.replaceChildren(
    el('div', { class: 'panel-head' }, [el('h2', { text: `${pane.version.label} · ${pane.annotations.length} góp ý` })]),
    el('div', { class: 'panel-pad' }, items)
  );
}

function commentCard(pane, ann) {
  const note = el('textarea', {
    class: 'field-input note-input',
    'aria-label': `Kiểm tra sau sửa cho góp ý ${ann.number}`,
    placeholder: 'Kiểm tra sau sửa'
  });
  note.value = ann.checkNote || '';
  note.disabled = !canEdit();
  let timer = 0;
  const saveNote = async () => {
    if (!canEdit() || note.value.trim() === (ann.checkNote || '')) return;
    try {
      const updated = await api.setCheckNote(ann.id, note.value);
      ann.checkNote = updated.checkNote;
      toast('Đã lưu ghi chú kiểm tra.', 'success');
    } catch (err) {
      toast(err.message || 'Không lưu được ghi chú.', 'error');
    }
  };
  note.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(saveNote, 500);
  });
  note.addEventListener('blur', saveNote);
  const body = el('p', { class: 'thread-body' });
  body.textContent = ann.body;
  const statusBtn = el('button', {
    type: 'button',
    class: 'btn btn-secondary btn-sm',
    text: ann.status === 'open' ? 'Đã xử lý' : 'Mở lại',
    disabled: !canEdit()
  });
  statusBtn.addEventListener('click', async () => {
    setBusy(statusBtn, true, 'Đang lưu...');
    try {
      await api.setAnnotationStatus(ann.id, ann.status === 'open' ? 'resolved' : 'open');
      await loadPane(pane, pane.version.id);
      toast('Đã cập nhật trạng thái.', 'success');
    } catch (err) {
      setBusy(statusBtn, false);
      toast(err.message || 'Không đổi được trạng thái.', 'error');
    }
  });
  return el('article', { class: 'thread', 'data-testid': 'comment-thread' }, [
    el('div', { class: 'thread-top' }, [
      el('strong', { text: `${ann.number}. ${ann.author.name}` }),
      statusBadge(ann.status)
    ]),
    body,
    el('p', { class: 'coord', text: `x ${Math.round(ann.x)}, y ${Math.round(ann.y)}, w ${Math.round(ann.w)}, h ${Math.round(ann.h)}` }),
    el('label', { class: 'field-label', text: 'Kiểm tra sau sửa' }),
    note,
    statusBtn
  ]);
}

boot({
  active: 'projects',
  title: 'So sánh phiên bản',
  async render({ setBreadcrumb, setPageTitle }) {
    const projectId = params.get('project');
    const screenId = params.get('screen');
    if (!projectId || !screenId) throw new Error('Thiếu màn hình cần so sánh.');
    project = await api.getProject(projectId);
    screen = await api.getScreen(screenId);
    role = project.myRole || 'viewer';
    versions = await api.listVersions(screenId);
    if (versions.length < 1) throw new Error('Chưa có phiên bản để so sánh.');
    setPageTitle(`So sánh ${screen.name}`);
    setBreadcrumb([
      { label: 'DesignMark', href: 'projects.php' },
      { label: project.name, href: `project.php?id=${encodeURIComponent(project.id)}` },
      { label: screen.name, href: `review.php?project=${encodeURIComponent(project.id)}&screen=${encodeURIComponent(screen.id)}` },
      { label: 'So sánh' }
    ]);
    sides.left = createPane('left');
    sides.right = createPane('right');
    versions.forEach((item) => {
      sides.left.select.append(el('option', { value: item.id, text: item.label }));
      sides.right.select.append(el('option', { value: item.id, text: item.label }));
    });
    const leftId = params.get('left') || versions[0].id;
    const rightId = params.get('right') || versions[versions.length - 1].id;
    const syncBox = el('input', { type: 'checkbox', id: 'sync-zoom', checked: 'true' });
    syncBox.checked = true;
    syncBox.addEventListener('change', () => {
      syncZoom = syncBox.checked;
      if (syncZoom) changeZoom('left', 1, 'user');
    });
    const page = document.getElementById('page');
    page.replaceChildren(
      el('div', { class: 'page-head' }, [
        el('div', {}, [
          el('p', { text: 'Mỗi bên chỉ hiện góp ý của phiên bản đang chọn. Không sao chép annotation.' }),
          canEdit() ? null : el('p', { class: 'permission-note', text: 'Bạn chỉ có quyền xem.' })
        ]),
        el('label', { class: 'checkline', for: 'sync-zoom' }, [syncBox, 'Thu phóng đồng bộ'])
      ]),
      el('div', { class: 'compare-view', 'data-testid': 'compare-view' }, [sides.left.pane, sides.right.pane])
    );
    sides.left.select.addEventListener('change', () => loadPane(sides.left, sides.left.select.value).catch((err) => toast(err.message, 'error')));
    sides.right.select.addEventListener('change', () => loadPane(sides.right, sides.right.select.value).catch((err) => toast(err.message, 'error')));
    await loadPane(sides.left, leftId);
    await loadPane(sides.right, rightId);
    const refit = () => {
      if (sides.left?.fitMode) fit('left', syncZoom ? undefined : 'sync');
      if (sides.right?.fitMode && !syncZoom) fit('right', 'sync');
    };
    window.addEventListener('resize', refit);
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(refit);
      observer.observe(sides.left.viewport);
      observer.observe(sides.right.viewport);
    }
  }
});
