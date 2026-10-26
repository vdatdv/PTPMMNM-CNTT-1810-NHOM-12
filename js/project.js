import { boot } from './app.js';
import { api } from './api.js';
import {
  avatarEl,
  bindTabs,
  el,
  emptyState,
  fieldError,
  formatDate,
  openModal,
  roleBadge,
  roleLabel,
  setBusy,
  toast
} from './ui.js';

const params = new URLSearchParams(location.search);
const projectId = params.get('id');

function fileInput() {
  return el('input', { type: 'file', accept: 'image/png,image/jpeg,.png,.jpg,.jpeg', class: 'field-input' });
}

async function chooseAndValidate(file, errorNode) {
  errorNode.textContent = '';
  if (!file) {
    errorNode.textContent = 'Hãy chọn một tệp PNG hoặc JPEG.';
    return null;
  }
  try {
    return await api.validateImageFile(file);
  } catch (err) {
    errorNode.textContent = err.message;
    return null;
  }
}

boot({
  active: 'projects',
  title: 'Chi tiết dự án',
  async render({ setBreadcrumb, setPageTitle }) {
    if (!projectId) throw new Error('Thiếu mã dự án.');
    const project = await api.getProject(projectId);
    setPageTitle(project.name);
    setBreadcrumb([
      { label: 'DesignMark', href: 'dashboard.php' },
      { label: 'Dự án', href: 'projects.php' },
      { label: project.name }
    ]);
    const page = document.getElementById('page');
    const panels = {
      screens: el('div', { id: 'panel-screens', role: 'tabpanel' }),
      members: el('div', { id: 'panel-members', role: 'tabpanel', hidden: true }),
      activity: el('div', { id: 'panel-activity', role: 'tabpanel', hidden: true })
    };
    const tabs = el('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Mục dự án' }, [
      tabButton('screens', 'Màn hình thiết kế', true),
      tabButton('members', 'Thành viên', false),
      tabButton('activity', 'Lịch sử', false)
    ]);
    page.replaceChildren(
      el('div', { class: 'page-head' }, [
        el('div', {}, [
          el('p', { text: project.description || 'Chưa có mô tả.' }),
          el('p', { class: 'help', text: `Vai trò của bạn trong dự án: ${roleLabel(project.myRole)}` })
        ]),
        el('div', { class: 'inline-actions' }, [
          el('a', { class: 'btn btn-secondary', href: `feedback.php?project=${encodeURIComponent(project.id)}` }, 'Danh sách góp ý')
        ])
      ]),
      tabs,
      panels.screens,
      panels.members,
      panels.activity
    );
    bindTabs(tabs, (name) => {
      tabs.querySelectorAll('[role="tab"]').forEach((button) => {
        const on = button.dataset.tab === name;
        button.classList.toggle('is-active', on);
        button.setAttribute('aria-selected', on ? 'true' : 'false');
        button.tabIndex = on ? 0 : -1;
      });
      Object.entries(panels).forEach(([key, panel]) => {
        panel.hidden = key !== name;
      });
    });
    await renderScreens(panels.screens, project);
    await renderMembers(panels.members, project);
    await renderActivity(panels.activity, project);
  }
});

function tabButton(name, label, selected) {
  return el('button', {
    type: 'button',
    class: `tab${selected ? ' is-active' : ''}`,
    role: 'tab',
    id: `tab-${name}`,
    'aria-selected': selected ? 'true' : 'false',
    'aria-controls': `panel-${name}`,
    tabindex: selected ? '0' : '-1',
    dataset: { tab: name },
    text: label
  });
}

async function renderScreens(panel, project) {
  const screens = await api.listScreens(project.id);
  const canUpload = project.myRole === 'manager';
  const upload = canUpload
    ? el('button', { type: 'button', class: 'btn btn-primary', 'data-testid': 'upload-image', text: 'Tải ảnh', onclick: () => openUpload(project, panel) })
    : el('p', { class: 'help', text: 'Chỉ Quản lý được tải ảnh và tạo phiên bản.' });
  const grid = el('div', { class: 'screen-grid' });
  if (!screens.length) {
    grid.append(emptyState({ title: 'Chưa có màn hình', text: 'Tải ảnh PNG hoặc JPEG để tạo màn hình thiết kế đầu tiên.' }));
  }
  for (const screen of screens) {
    grid.append(await screenCard(screen, project, canUpload, panel));
  }
  panel.replaceChildren(
    el('div', { class: 'page-head' }, [el('h2', { text: 'Màn hình thiết kế' }), upload]),
    grid
  );
}

async function screenCard(screen, project, canUpload, panel) {
  const latest = screen.latestVersion;
  const card = el('article', { class: 'card screen-card' });
  const thumb = el('div', { class: 'screen-thumb' });
  if (latest) {
    const img = el('img', { alt: `Thumbnail ${screen.name}` });
    try {
      img.src = await api.resolveImageUrl(latest.imageKey);
    } catch (err) {
      img.alt = 'Không tải được thumbnail';
    }
    thumb.append(img);
  }
  const actions = el('div', { class: 'inline-actions' });
  if (latest) {
    actions.append(el('a', {
      class: 'btn btn-primary btn-sm',
      href: `review.php?project=${encodeURIComponent(project.id)}&screen=${encodeURIComponent(screen.id)}&version=${encodeURIComponent(latest.id)}`
    }, 'Mở góp ý'));
    actions.append(el('a', {
      class: 'btn btn-secondary btn-sm',
      href: `compare.php?project=${encodeURIComponent(project.id)}&screen=${encodeURIComponent(screen.id)}`
    }, 'So sánh'));
  }
  if (canUpload) {
    const input = fileInput();
    input.hidden = true;
    const button = el('button', { type: 'button', class: 'btn btn-secondary btn-sm', 'data-testid': 'upload-version', text: 'Tải phiên bản mới' });
    button.addEventListener('click', () => input.click());
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      input.value = '';
      if (!file) return;
      const error = el('p', { class: 'field-error' });
      const info = await chooseAndValidate(file, error);
      if (!info) {
        toast(error.textContent, 'error');
        return;
      }
      setBusy(button, true, 'Đang tải...');
      try {
        const version = await api.addVersionFromFile(screen.id, file);
        toast(`Đã tạo ${version.label}. Góp ý cũ không được chuyển sang bản mới.`, 'success');
        await renderScreens(panel, project);
      } catch (err) {
        setBusy(button, false);
        toast(err.message || 'Không lưu được phiên bản.', 'error');
      }
    });
    actions.append(button, input);
  }
  card.append(
    thumb,
    el('div', { class: 'card-body' }, [
      el('h3', { text: screen.name }),
      el('p', { class: 'help', text: screen.description || '' }),
      el('div', { class: 'meta-row' }, [
        el('span', { text: latest ? `Mới nhất ${latest.label}` : 'Chưa có phiên bản' }),
        el('span', { text: `${screen.versionCount} phiên bản` }),
        el('span', { text: `${screen.commentCount} góp ý` }),
        el('span', { text: `${screen.openCount} chưa xử lý` })
      ]),
      actions
    ])
  );
  return card;
}

function openUpload(project, panel) {
  const name = el('input', { class: 'field-input', id: 'screen-name', maxlength: '80' });
  const input = fileInput();
  input.id = 'screen-file';
  const error = el('p', { class: 'field-error', id: 'screen-file-error' });
  const submit = el('button', { type: 'submit', class: 'btn btn-primary', text: 'Tải lên' });
  const form = el('form', {}, [
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label', for: 'screen-name', text: 'Tên màn hình' }),
      name
    ]),
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label', for: 'screen-file', text: 'Ảnh PNG hoặc JPEG, tối đa 10 MB' }),
      input,
      error
    ]),
    el('p', { class: 'help', text: 'Ảnh được lưu trong IndexedDB. DesignMark không chỉnh sửa nội dung ảnh.' }),
    el('div', { class: 'modal-actions' }, [
      el('button', { type: 'button', class: 'btn btn-secondary', text: 'Hủy', onclick: () => modal.close() }),
      submit
    ])
  ]);
  const modal = openModal({ title: 'Tải ảnh thiết kế', content: form });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    fieldError(name, '');
    error.textContent = '';
    if (!name.value.trim()) {
      fieldError(name, 'Tên màn hình không được để trống.');
      return;
    }
    const file = input.files?.[0];
    const info = await chooseAndValidate(file, error);
    if (!info) return;
    setBusy(submit, true, 'Đang lưu...');
    try {
      await api.createScreenFromFile(project.id, { name: name.value, file });
      modal.close();
      toast('Đã tạo màn hình và phiên bản v1.', 'success');
      const fresh = await api.getProject(project.id);
      await renderScreens(panel, fresh);
    } catch (err) {
      setBusy(submit, false);
      error.textContent = err.message;
      toast(err.message || 'Không lưu được ảnh.', 'error');
    }
  });
}

async function renderMembers(panel, project) {
  const members = await api.listMembers(project.id);
  const canManage = project.myRole === 'manager';
  const table = el('table', { class: 'data-table' });
  table.append(el('thead', {}, [
    el('tr', {}, ['Thành viên', 'Tài khoản', 'Vai trò'].map((label) => el('th', { scope: 'col', text: label })))
  ]));
  const body = el('tbody');
  members.forEach((member) => {
    const roleCell = canManage ? roleSelect(project, member, panel) : roleBadge(member.role);
    body.append(el('tr', {}, [
      el('td', {}, [el('div', { class: 'member-cell' }, [avatarEl(member, 32), el('span', { text: member.name })])]),
      el('td', { text: member.username }),
      el('td', {}, [roleCell])
    ]));
  });
  table.append(body);
  const wrap = el('div', { class: 'table-wrap' }, [table]);

  let pendingBlock = null;
  if (canManage) {
    try {
      const pending = await api.getUnverifiedUsers();
      if (pending && pending.length > 0) {
        const pendingRows = pending.map((u) => {
          const roleChoice = el('select', { class: 'field-input field-input-sm', style: 'padding: 4px 8px; font-size: 0.85rem;' }, [
            el('option', { value: 'reviewer', text: 'Góp ý (Reviewer)', selected: 'true' }),
            el('option', { value: 'viewer', text: 'Chỉ xem (Viewer)' }),
            el('option', { value: 'manager', text: 'Quản lý (Admin)' })
          ]);

          const approveBtn = el('button', {
            type: 'button',
            class: 'btn btn-primary btn-sm',
            text: 'Phân cấp & Kích hoạt',
            onclick: async () => {
              approveBtn.disabled = true;
              try {
                const res = await api.approveUser(u.id, roleChoice.value);
                toast(res.message || `Đã phân cấp và kích hoạt cho ${u.name}.`, 'success');
                const fresh = await api.getProject(project.id);
                await renderMembers(panel, fresh);
              } catch (err) {
                approveBtn.disabled = false;
                toast(err.message || 'Lỗi phê duyệt tài khoản.', 'error');
              }
            }
          });

          const rejectBtn = el('button', {
            type: 'button',
            class: 'btn btn-ghost btn-sm',
            style: 'color: #ef4444; margin-left: 6px;',
            text: 'Từ chối',
            onclick: async () => {
              if (!confirm(`Bạn có chắc muốn từ chối yêu cầu đăng ký của ${u.name} (@${u.username})?`)) return;
              rejectBtn.disabled = true;
              try {
                await api.rejectUser(u.id);
                toast(`Đã từ chối tài khoản ${u.name}.`, 'info');
                const fresh = await api.getProject(project.id);
                await renderMembers(panel, fresh);
              } catch (err) {
                rejectBtn.disabled = false;
                toast(err.message || 'Lỗi từ chối tài khoản.', 'error');
              }
            }
          });

          return el('tr', {}, [
            el('td', {}, [
              el('div', { class: 'member-cell' }, [
                avatarEl(u, 28),
                el('div', {}, [
                  el('strong', { text: u.name }),
                  el('div', { class: 'help', text: `@${u.username}${u.title ? ' · ' + u.title : ''}` })
                ])
              ])
            ]),
            el('td', {}, [roleChoice]),
            el('td', {}, [approveBtn, rejectBtn])
          ]);
        });

        const pendingTable = el('table', { class: 'data-table' }, [
          el('thead', {}, [
            el('tr', {}, ['Tài khoản chờ duyệt', 'Phân cấp vai trò', 'Thao tác'].map((l) => el('th', { text: l })))
          ]),
          el('tbody', {}, pendingRows)
        ]);

        pendingBlock = el('div', { class: 'admin-badge-notice', style: 'margin-bottom: 24px; border-left: 4px solid var(--color-primary, #4F46E5);' }, [
          el('strong', { text: `Tài khoản chờ Admin phân cấp vai trò (${pending.length}):` }),
          el('p', { class: 'help', style: 'margin-top: 4px; margin-bottom: 12px;', text: 'Chọn vai trò phù hợp cho từng thành viên mới và bấm Phân cấp & Kích hoạt để cho phép họ sử dụng hệ thống:' }),
          el('div', { class: 'table-wrap' }, [pendingTable])
        ]);
      }
    } catch (ignore) {}
  }

  const invite = canManage ? await inviteForm(project, panel) : el('p', { class: 'permission-note', text: 'Bạn không có quyền quản lý thành viên.' });
  panel.replaceChildren(
    el('div', { class: 'page-head' }, [el('h2', { text: 'Thành viên' })]),
    ...(pendingBlock ? [pendingBlock] : []),
    wrap,
    invite
  );
}

function roleSelect(project, member, panel) {
  const select = el('select', { class: 'field-input', 'aria-label': `Vai trò của ${member.name}` }, [
    el('option', { value: 'viewer', text: 'Chỉ xem' }),
    el('option', { value: 'reviewer', text: 'Góp ý' }),
    el('option', { value: 'manager', text: 'Quản lý' })
  ]);
  select.value = member.role;
  select.addEventListener('change', async () => {
    const next = select.value;
    select.disabled = true;
    try {
      await api.updateMemberRole(project.id, member.id, next);
      toast('Đã cập nhật vai trò.', 'success');
      const fresh = await api.getProject(project.id);
      await renderMembers(panel, fresh);
      if (fresh.myRole !== 'manager') location.reload();
    } catch (err) {
      select.value = member.role;
      select.disabled = false;
      toast(err.message || 'Không đổi được vai trò.', 'error');
    }
  });
  return select;
}

async function inviteForm(project, panel) {
  const candidates = await api.listInviteCandidates(project.id);
  if (!candidates.length) {
    return el('p', { class: 'help', text: 'Tất cả thành viên đã có trong dự án.' });
  }
  const user = el('select', { class: 'field-input', id: 'invite-user' }, candidates.map((item) => el('option', { value: item.id, text: `${item.name} (${item.username})` })));
  const role = el('select', { class: 'field-input', id: 'invite-role' }, [
    el('option', { value: 'viewer', text: 'Chỉ xem' }),
    el('option', { value: 'reviewer', text: 'Góp ý', selected: 'true' }),
    el('option', { value: 'manager', text: 'Quản lý' })
  ]);
  const button = el('button', { type: 'submit', class: 'btn btn-primary', text: 'Thêm' });
  const form = el('form', { class: 'panel panel-pad' }, [
    el('h3', { text: 'Thêm thành viên vào dự án' }),
    el('p', { class: 'help', text: 'Chọn tài khoản đã được kích hoạt để tham gia vào dự án này.' }),
    el('div', { class: 'toolbar' }, [
      el('label', { class: 'field', text: '' }, [el('span', { class: 'field-label', text: 'Tài khoản' }), user]),
      el('label', { class: 'field', text: '' }, [el('span', { class: 'field-label', text: 'Vai trò' }), role]),
      button
    ])
  ]);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setBusy(button, true, 'Đang thêm...');
    try {
      await api.inviteMember(project.id, { userId: user.value, role: role.value });
      toast('Đã thêm thành viên vào dự án.', 'success');
      const fresh = await api.getProject(project.id);
      await renderMembers(panel, fresh);
    } catch (err) {
      setBusy(button, false);
      toast(err.message || 'Không thêm được thành viên.', 'error');
    }
  });
  return form;
}

async function renderActivity(panel, project) {
  const items = await api.listActivities(project.id);
  const list = el('div', { class: 'timeline panel panel-pad' });
  if (!items.length) {
    list.append(emptyState({ title: 'Chưa có hoạt động', text: 'Các thay đổi trong dự án sẽ xuất hiện tại đây.' }));
  }
  items.forEach((item) => {
    list.append(el('article', { class: 'timeline-item' }, [
      avatarEl(item.user, 32),
      el('div', {}, [
        el('p', {}, [
          el('strong', { text: item.user.name }),
          document.createTextNode(` ${item.message}`)
        ]),
        el('time', { datetime: item.createdAt, text: formatDate(item.createdAt) })
      ])
    ]));
  });
  panel.replaceChildren(el('div', { class: 'page-head' }, [el('h2', { text: 'Lịch sử hoạt động' })]), list);
}
