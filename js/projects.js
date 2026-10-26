import { boot } from './app.js';
import { api } from './api.js';
import {
  avatarEl,
  el,
  emptyState,
  fieldError,
  formatDay,
  icon,
  loadingBlock,
  openModal,
  setBusy,
  toast
} from './ui.js';

function roleBadge(role) {
  const map = {
    manager: { label: 'Quản lý', class: 'badge-primary' },
    reviewer: { label: 'Góp ý', class: 'badge-secondary' },
    viewer: { label: 'Chỉ xem', class: 'badge-neutral' }
  };
  const item = map[role] || { label: role || 'Thành viên', class: 'badge-neutral' };
  return el('span', { class: `badge ${item.class}` }, [el('span', { text: item.label })]);
}

function openCreate() {
  const name = el('input', { class: 'field-input', id: 'project-name', maxlength: '120', required: 'true', placeholder: 'Ví dụ: Ứng dụng Di động, Cửa hàng trực tuyến...' });
  const desc = el('textarea', { class: 'field-input', id: 'project-desc', maxlength: '500', rows: '3', placeholder: 'Mô tả ngắn gọn về mục tiêu và phạm vi thiết kế của dự án...' });
  const nameError = el('p', { class: 'field-error', id: 'project-name-error' });
  const submit = el('button', { type: 'submit', class: 'btn btn-primary', text: 'Tạo dự án' });
  const form = el('form', {}, [
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label', for: 'project-name', text: 'Tên dự án *' }),
      name,
      nameError
    ]),
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label', for: 'project-desc', text: 'Mô tả dự án' }),
      desc
    ]),
    el('div', { class: 'modal-actions' }, [
      el('button', { type: 'button', class: 'btn btn-secondary', text: 'Hủy', onclick: () => modal.close() }),
      submit
    ])
  ]);
  const modal = openModal({ title: 'Tạo dự án mới', content: form });
  name.focus();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    fieldError(name, '');
    if (!name.value.trim()) {
      fieldError(name, 'Tên dự án không được để trống.');
      name.focus();
      return;
    }
    setBusy(submit, true, 'Đang tạo...');
    try {
      const project = await api.createProject({ name: name.value, description: desc.value });
      modal.close();
      toast('Đã tạo dự án thành công.', 'success');
      location.href = `project.php?id=${encodeURIComponent(project.id)}`;
    } catch (err) {
      setBusy(submit, false);
      fieldError(name, err.message);
      toast(err.message || 'Không tạo được dự án.', 'error');
    }
  });
}

function renderGrid(projects, filterQuery, onClearSearch) {
  const grid = el('div', { class: 'project-grid', id: 'projects-grid', 'data-testid': 'project-grid' });

  if (!projects.length) {
    if (filterQuery) {
      grid.append(emptyState({
        title: 'Không tìm thấy dự án',
        text: `Không có dự án nào khớp với từ khóa "${filterQuery}". Hãy thử tìm kiếm với từ khóa khác.`
      }));
      const clearBtn = el('button', {
        type: 'button',
        class: 'btn btn-secondary btn-sm',
        style: 'margin-top: 12px;',
        onclick: onClearSearch
      }, [icon('close'), 'Xóa bộ lọc']);
      grid.querySelector('.empty-state')?.append(clearBtn);
      return grid;
    }

    grid.append(emptyState({
      title: 'Chưa có dự án nào',
      text: 'Tài khoản của bạn chưa tham gia dự án nào. Quản trị viên có thể tạo dự án mới hoặc cấp quyền cho bạn.'
    }));
    return grid;
  }

  projects.forEach((project) => {
    const stack = el('div', { class: 'avatar-stack', 'aria-label': `Thành viên: ${project.members.map((m) => m.name).join(', ')}` });
    project.members.slice(0, 5).forEach((member) => stack.append(avatarEl(member, 28)));

    grid.append(el('a', { class: 'card project-card', href: `project.php?id=${encodeURIComponent(project.id)}` }, [
      el('div', { class: 'card-body' }, [
        el('div', { class: 'project-card-header', style: 'display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;' }, [
          el('h2', { text: project.name, style: 'margin: 0; font-size: 1.15rem;' }),
          project.myRole ? roleBadge(project.myRole) : null
        ].filter(Boolean)),
        el('p', { text: project.description || 'Chưa có mô tả chi tiết.', class: 'project-desc-clamp' }),
        el('div', { class: 'meta-row' }, [
          el('span', { class: 'badge-meta', text: `${project.screenCount} màn hình` }),
          el('span', { class: 'badge-meta', text: `${project.commentCount} góp ý` }),
          el('span', { class: `badge-meta${project.openCount > 0 ? ' has-open' : ''}`, text: `${project.openCount} chưa xử lý` })
        ]),
        el('div', { class: 'meta-row project-card-footer', style: 'justify-content: space-between; margin-top: 14px; border-top: 1px solid var(--border); padding-top: 10px;' }, [
          el('span', { class: 'help-text', text: `Cập nhật ${formatDay(project.updatedAt)}` }),
          stack
        ])
      ])
    ]));
  });

  return grid;
}

boot({
  active: 'projects',
  title: 'Danh sách dự án',
  async render({ session, setBreadcrumb }) {
    setBreadcrumb([
      { label: 'DesignMark', href: 'dashboard.php' },
      { label: 'Danh sách dự án' }
    ]);
    const page = document.getElementById('page');
    page.replaceChildren(loadingBlock('Đang tải danh sách dự án...'));

    let allProjects = [];
    let searchQuery = '';
    let sortMode = 'updated-desc';

    function getFilteredAndSorted() {
      let filtered = allProjects.filter((p) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
      });

      filtered.sort((a, b) => {
        if (sortMode === 'updated-desc') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        if (sortMode === 'updated-asc') return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        if (sortMode === 'name-asc') return (a.name || '').localeCompare(b.name || '');
        if (sortMode === 'name-desc') return (b.name || '').localeCompare(a.name || '');
        if (sortMode === 'screens-desc') return (b.screenCount || 0) - (a.screenCount || 0);
        if (sortMode === 'comments-desc') return (b.commentCount || 0) - (a.commentCount || 0);
        return 0;
      });

      return filtered;
    }

    function renderView() {
      const items = getFilteredAndSorted();

      // Top header
      const header = el('div', { class: 'page-head' }, [
        el('div', {}, [
          el('h1', { text: 'Danh sách dự án', style: 'font-size: 1.5rem; margin-bottom: 4px;' }),
          el('p', { class: 'lede', text: 'Tìm kiếm, truy cập và quản lý các dự án thiết kế bạn được cấp quyền.' })
        ]),
        session.role === 'manager'
          ? el('button', {
              type: 'button',
              class: 'btn btn-primary',
              'data-testid': 'create-project',
              onclick: openCreate
            }, [icon('plus'), el('span', { text: 'Tạo dự án mới' })])
          : null
      ].filter(Boolean));

      // Filter Toolbar
      const searchInput = el('input', {
        type: 'search',
        class: 'field-input',
        placeholder: 'Tìm kiếm dự án theo tên hoặc mô tả...',
        value: searchQuery,
        oninput: (e) => {
          searchQuery = e.target.value.trim();
          renderGridContainer();
        }
      });

      const searchWrap = el('div', { class: 'search-box-wrap', style: 'flex: 1; min-width: 240px;' }, [
        icon('search'),
        searchInput
      ]);

      const sortSelect = el('select', {
        class: 'field-input field-select',
        style: 'min-width: 180px;',
        onchange: (e) => {
          sortMode = e.target.value;
          renderGridContainer();
        }
      }, [
        el('option', { value: 'updated-desc', text: 'Mới cập nhật nhất', selected: sortMode === 'updated-desc' }),
        el('option', { value: 'updated-asc', text: 'Cũ nhất', selected: sortMode === 'updated-asc' }),
        el('option', { value: 'name-asc', text: 'Tên dự án (A → Z)', selected: sortMode === 'name-asc' }),
        el('option', { value: 'name-desc', text: 'Tên dự án (Z → A)', selected: sortMode === 'name-desc' }),
        el('option', { value: 'screens-desc', text: 'Nhiều màn hình nhất', selected: sortMode === 'screens-desc' }),
        el('option', { value: 'comments-desc', text: 'Nhiều góp ý nhất', selected: sortMode === 'comments-desc' })
      ]);

      const countLabel = el('span', {
        id: 'projects-count-label',
        class: 'help-text',
        style: 'font-size: 13.5px; white-space: nowrap;'
      }, `${items.length} dự án`);

      const toolbar = el('div', {
        class: 'panel panel-pad',
        style: 'display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 20px;'
      }, [
        searchWrap,
        el('div', { style: 'display: flex; gap: 10px; align-items: center;' }, [
          sortSelect,
          countLabel
        ])
      ]);

      const gridContainer = el('div', { id: 'grid-container' });

      function renderGridContainer() {
        const filteredItems = getFilteredAndSorted();
        countLabel.textContent = `${filteredItems.length} dự án`;
        gridContainer.replaceChildren(renderGrid(filteredItems, searchQuery, () => {
          searchQuery = '';
          searchInput.value = '';
          renderGridContainer();
        }));
      }

      renderGridContainer();

      page.replaceChildren(header, toolbar, gridContainer);
    }

    try {
      allProjects = await api.listProjects();
      renderView();

      // If URL hash is #create and user is manager, open modal automatically
      if (location.hash === '#create' && session.role === 'manager') {
        openCreate();
        history.replaceState(null, '', 'projects.php');
      }
    } catch (err) {
      page.replaceChildren(emptyState({
        title: 'Lỗi tải dự án',
        text: err.message || 'Không thể lấy danh sách dự án. Vui lòng kiểm tra lại kết nối.'
      }));
    }
  }
});
