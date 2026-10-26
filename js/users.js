/**
 * Quản lý & Xét duyệt tài khoản cho Quản trị viên (Manager).
 */
import { boot } from './app.js';
import { api } from './api.js';
import {
  avatarEl,
  bindTabs,
  confirmDialog,
  el,
  emptyState,
  fieldError,
  formatDay,
  icon,
  openModal,
  roleLabel,
  setBusy,
  toast
} from './ui.js';

function statCard(label, value, isAlert = false) {
  return el('article', {
    class: 'stat-card',
    style: isAlert ? 'border-color: #f59e0b; background: rgba(245, 158, 11, 0.05);' : ''
  }, [
    el('span', {
      text: label,
      style: isAlert ? 'color: #b45309; font-weight: 600;' : ''
    }),
    el('strong', {
      text: String(value),
      style: isAlert ? 'color: #d97706;' : ''
    })
  ]);
}

function openCreateUserModal(onSuccess) {
  const username = el('input', { class: 'field-input', id: 'create-username', placeholder: 'Ví dụ: tranvan_ui', required: 'true' });
  const name = el('input', { class: 'field-input', id: 'create-name', placeholder: 'Ví dụ: Trần Văn', required: 'true' });
  const title = el('input', { class: 'field-input', id: 'create-title', placeholder: 'Ví dụ: Thiết kế giao diện' });
  const password = el('input', { class: 'field-input', id: 'create-password', type: 'password', placeholder: 'Tối thiểu 4 ký tự', required: 'true' });
  const role = el('select', { class: 'field-input', id: 'create-role' }, [
    el('option', { value: 'reviewer', text: 'Góp ý (Reviewer)', selected: 'true' }),
    el('option', { value: 'viewer', text: 'Chỉ xem (Viewer)' }),
    el('option', { value: 'manager', text: 'Quản lý (Admin)' })
  ]);
  const errBox = el('p', { class: 'field-error', id: 'create-error' });
  const submitBtn = el('button', { type: 'submit', class: 'btn btn-primary', text: 'Tạo tài khoản' });

  const form = el('form', {}, [
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label', for: 'create-username', text: 'Tên đăng nhập *' }),
      username
    ]),
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label', for: 'create-name', text: 'Họ và tên *' }),
      name
    ]),
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label', for: 'create-title', text: 'Chức danh / Vị trí' }),
      title
    ]),
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label', for: 'create-password', text: 'Mật khẩu khởi tạo *' }),
      password
    ]),
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label', for: 'create-role', text: 'Vai trò phân cấp' }),
      role
    ]),
    errBox,
    el('div', { class: 'modal-actions' }, [
      el('button', { type: 'button', class: 'btn btn-secondary', text: 'Hủy', onclick: () => modal.close() }),
      submitBtn
    ])
  ]);

  const modal = openModal({ title: 'Thêm tài khoản thành viên', content: form });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errBox.textContent = '';
    const uname = username.value.trim();
    const unameErr = !uname ? 'Tên đăng nhập không được để trống.' : (!/^[a-zA-Z0-9_\-\.]{3,30}$/.test(uname) ? 'Tên đăng nhập 3-30 ký tự, không dấu cách.' : '');
    if (unameErr) {
      errBox.textContent = unameErr;
      username.focus();
      return;
    }
    if (!name.value.trim()) {
      errBox.textContent = 'Họ và tên không được để trống.';
      name.focus();
      return;
    }
    if (!password.value || password.value.length < 4) {
      errBox.textContent = 'Mật khẩu phải từ 4 ký tự trở lên.';
      password.focus();
      return;
    }

    setBusy(submitBtn, true, 'Đang tạo...');
    try {
      const res = await api.adminCreateUser({
        username: uname,
        name: name.value.trim(),
        title: title.value.trim(),
        password: password.value,
        role: role.value
      });
      modal.close();
      toast(res.message || 'Đã tạo tài khoản thành công.', 'success');
      onSuccess();
    } catch (err) {
      setBusy(submitBtn, false);
      errBox.textContent = err.message || 'Không tạo được tài khoản.';
    }
  });
}

function openResetPasswordModal(user) {
  const newPass = el('input', { class: 'field-input', id: 'reset-new-pass', type: 'password', placeholder: 'Tối thiểu 4 ký tự', required: 'true' });
  const errBox = el('p', { class: 'field-error' });
  const submitBtn = el('button', { type: 'submit', class: 'btn btn-primary', text: 'Lưu mật khẩu mới' });

  const form = el('form', {}, [
    el('p', { class: 'help', text: `Đặt lại mật khẩu cho tài khoản ${user.name} (@${user.username}):` }),
    el('div', { class: 'field', style: 'margin-top: 12px;' }, [
      el('label', { class: 'field-label', for: 'reset-new-pass', text: 'Mật khẩu mới *' }),
      newPass
    ]),
    errBox,
    el('div', { class: 'modal-actions' }, [
      el('button', { type: 'button', class: 'btn btn-secondary', text: 'Hủy', onclick: () => modal.close() }),
      submitBtn
    ])
  ]);

  const modal = openModal({ title: 'Đổi mật khẩu người dùng', content: form });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errBox.textContent = '';
    if (!newPass.value || newPass.value.length < 4) {
      errBox.textContent = 'Mật khẩu mới phải từ 4 ký tự trở lên.';
      newPass.focus();
      return;
    }
    setBusy(submitBtn, true, 'Đang lưu...');
    try {
      const res = await api.resetUserPassword(user.id, newPass.value);
      modal.close();
      toast(res.message || 'Đã đặt lại mật khẩu.', 'success');
    } catch (err) {
      setBusy(submitBtn, false);
      errBox.textContent = err.message || 'Không đổi được mật khẩu.';
    }
  });
}

boot({
  active: 'users',
  title: 'Quản lý tài khoản',
  async render({ session, setBreadcrumb }) {
    setBreadcrumb([
      { label: 'DesignMark', href: 'projects.php' },
      { label: 'Quản lý tài khoản' }
    ]);

    const page = document.getElementById('page');
    let currentTab = 'pending';
    let searchQuery = '';
    let roleFilter = 'all';

    async function loadData() {
      const allUsers = await api.listAllUsers();
      const pendingUsers = allUsers.filter((u) => u.role === 'pending' || Number(u.isVerified) === 0);
      const activeUsers = allUsers.filter((u) => u.role !== 'pending' && Number(u.isVerified) === 1);

      const managers = activeUsers.filter((u) => u.role === 'manager');
      const reviewers = activeUsers.filter((u) => u.role === 'reviewer');
      const viewers = activeUsers.filter((u) => u.role === 'viewer');

      // Header Actions
      const createBtn = el('button', {
        type: 'button',
        class: 'btn btn-primary',
        onclick: () => openCreateUserModal(loadData)
      }, [el('span', { text: '+ Thêm thành viên' })]);

      const header = el('div', { class: 'page-head' }, [
        el('div', {}, [
          el('p', { class: 'lede', text: 'Xét duyệt yêu cầu đăng ký mới và phân cấp vai trò người dùng trong hệ thống.' })
        ]),
        createBtn
      ]);

      const stats = el('div', { class: 'stat-grid-5' }, [
        statCard('Tổng tài khoản', allUsers.length),
        statCard('Chờ xét duyệt', pendingUsers.length, pendingUsers.length > 0),
        statCard('Quản trị viên (Admin)', managers.length),
        statCard('Góp ý (Reviewer)', reviewers.length),
        statCard('Chỉ xem (Viewer)', viewers.length)
      ]);

      // Segmented Tab Switcher
      const tabPending = el('button', {
        type: 'button',
        role: 'tab',
        class: `segmented-tab ${currentTab === 'pending' ? 'is-active' : ''}`,
        'data-tab': 'pending',
        'aria-selected': currentTab === 'pending' ? 'true' : 'false'
      }, [
        icon('clock'),
        el('span', { text: 'Chờ xét duyệt' }),
        pendingUsers.length > 0 ? el('span', {
          class: 'tab-badge tab-badge-amber',
          text: String(pendingUsers.length)
        }) : ''
      ]);

      const tabAll = el('button', {
        type: 'button',
        role: 'tab',
        class: `segmented-tab ${currentTab === 'all' ? 'is-active' : ''}`,
        'data-tab': 'all',
        'aria-selected': currentTab === 'all' ? 'true' : 'false'
      }, [
        icon('users'),
        el('span', { text: 'Tất cả thành viên' }),
        el('span', {
          class: 'tab-badge tab-badge-neutral',
          text: String(allUsers.length)
        })
      ]);

      const tabNav = el('div', { class: 'segmented-nav', role: 'tablist' }, [tabPending, tabAll]);

      bindTabs(tabNav, (nextTab) => {
        currentTab = nextTab;
        tabPending.classList.toggle('is-active', currentTab === 'pending');
        tabPending.setAttribute('aria-selected', currentTab === 'pending' ? 'true' : 'false');
        tabAll.classList.toggle('is-active', currentTab === 'all');
        tabAll.setAttribute('aria-selected', currentTab === 'all' ? 'true' : 'false');
        renderContentArea();
      });

      const contentArea = el('div', { id: 'users-content-area', style: 'margin-top: 20px;' });

      function renderContentArea() {
        if (currentTab === 'pending') {
          if (!pendingUsers.length) {
            contentArea.replaceChildren(
              emptyState({
                title: 'Không có tài khoản nào chờ duyệt',
                text: 'Tất cả tài khoản đăng ký mới đều đã được phân cấp vai trò và kích hoạt sử dụng.'
              })
            );
            return;
          }

          const banner = el('div', { class: 'pending-notice-card' }, [
            el('div', { class: 'pending-notice-icon' }, [icon('alert')]),
            el('div', { class: 'pending-notice-body' }, [
              el('div', { class: 'pending-notice-title', text: `Có ${pendingUsers.length} tài khoản mới đang chờ xét duyệt` }),
              el('div', { class: 'pending-notice-desc', text: 'Vui lòng chọn vai trò thích hợp cho từng người dùng bên dưới và bấm "Phân cấp & Kích hoạt" để cấp quyền sử dụng hệ thống.' })
            ])
          ]);

          const rows = pendingUsers.map((u) => {
            const roleChoice = el('select', {
              class: 'field-input field-input-sm',
              style: 'min-width: 175px;'
            }, [
              el('option', { value: 'reviewer', text: 'Góp ý (Reviewer)', selected: 'true' }),
              el('option', { value: 'viewer', text: 'Chỉ xem (Viewer)' }),
              el('option', { value: 'manager', text: 'Quản lý (Admin)' })
            ]);

            const approveBtn = el('button', {
              type: 'button',
              class: 'btn btn-primary btn-sm',
              onclick: async () => {
                approveBtn.disabled = true;
                try {
                  const res = await api.approveUser(u.id, roleChoice.value);
                  toast(res.message || `Đã phân cấp và kích hoạt cho ${u.name}.`, 'success');
                  loadData();
                } catch (err) {
                  approveBtn.disabled = false;
                  toast(err.message || 'Lỗi phê duyệt tài khoản.', 'error');
                }
              }
            }, [
              icon('check'),
              el('span', { text: 'Phân cấp & Kích hoạt' })
            ]);

            const rejectBtn = el('button', {
              type: 'button',
              class: 'btn btn-danger-soft btn-sm',
              style: 'margin-left: 8px;',
              text: 'Từ chối',
              onclick: async () => {
                const ok = await confirmDialog({
                  title: 'Từ chối yêu cầu đăng ký?',
                  message: `Bạn có chắc chắn muốn từ chối và xóa yêu cầu đăng ký của ${u.name} (@${u.username})?`,
                  confirmText: 'Từ chối',
                  danger: true
                });
                if (!ok) return;
                try {
                  await api.rejectUser(u.id);
                  toast(`Đã từ chối tài khoản ${u.name}.`, 'info');
                  loadData();
                } catch (err) {
                  toast(err.message || 'Lỗi từ chối tài khoản.', 'error');
                }
              }
            });

            return el('tr', {}, [
              el('td', {}, [
                el('div', { class: 'member-cell' }, [
                  avatarEl(u, 36),
                  el('div', {}, [
                    el('strong', { text: u.name }),
                    el('div', { class: 'help', text: `@${u.username}` })
                  ])
                ])
              ]),
              el('td', {}, [
                u.title ? el('span', { text: u.title }) : el('span', { class: 'help', text: 'Chưa cập nhật' })
              ]),
              el('td', {}, [
                el('span', { class: 'help', text: formatDay(u.createdAt) })
              ]),
              el('td', {}, [roleChoice]),
              el('td', {}, [
                el('div', { class: 'inline-actions' }, [approveBtn, rejectBtn])
              ])
            ]);
          });

          const table = el('table', { class: 'data-table is-aligned' }, [
            el('thead', {}, [
              el('tr', {}, ['Thành viên', 'Chức danh', 'Ngày đăng ký', 'Phân cấp vai trò', 'Thao tác'].map((l) => el('th', { text: l })))
            ]),
            el('tbody', {}, rows)
          ]);

          contentArea.replaceChildren(
            banner,
            el('div', { class: 'table-wrap' }, [table])
          );
        } else {
          // Tab All Users
          let filtered = allUsers;
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            filtered = filtered.filter((u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || (u.title || '').toLowerCase().includes(q));
          }
          if (roleFilter !== 'all') {
            filtered = filtered.filter((u) => u.role === roleFilter);
          }

          const searchInput = el('input', {
            class: 'field-input field-input-sm',
            style: 'min-width: 250px;',
            placeholder: 'Tìm theo họ tên, username...',
            value: searchQuery
          });
          searchInput.addEventListener('input', () => {
            searchQuery = searchInput.value;
            renderContentArea();
          });

          const roleFilterSelect = el('select', {
            class: 'field-input field-input-sm',
            style: 'min-width: 175px;'
          }, [
            el('option', { value: 'all', text: 'Tất cả vai trò', selected: roleFilter === 'all' }),
            el('option', { value: 'manager', text: 'Quản lý (Admin)', selected: roleFilter === 'manager' }),
            el('option', { value: 'reviewer', text: 'Góp ý (Reviewer)', selected: roleFilter === 'reviewer' }),
            el('option', { value: 'viewer', text: 'Chỉ xem (Viewer)', selected: roleFilter === 'viewer' }),
            el('option', { value: 'pending', text: 'Chờ duyệt (Pending)', selected: roleFilter === 'pending' })
          ]);
          roleFilterSelect.addEventListener('change', () => {
            roleFilter = roleFilterSelect.value;
            renderContentArea();
          });

          const isFiltered = searchQuery.trim() !== '' || roleFilter !== 'all';
          const clearFilterBtn = isFiltered ? el('button', {
            type: 'button',
            class: 'btn btn-ghost btn-sm',
            style: 'color: var(--muted); font-size: 13px;',
            text: 'Xóa bộ lọc',
            onclick: () => {
              searchQuery = '';
              roleFilter = 'all';
              renderContentArea();
            }
          }) : null;

          const toolbar = el('div', { class: 'users-toolbar' }, [
            el('div', { class: 'users-toolbar-left' }, [
              el('div', { class: 'search-box-wrap' }, [icon('search'), searchInput]),
              roleFilterSelect,
              ...(clearFilterBtn ? [clearFilterBtn] : [])
            ]),
            el('div', { class: 'users-toolbar-right' }, [
              el('span', { text: 'Hiển thị ' }),
              el('strong', { text: String(filtered.length) }),
              el('span', { text: ` / ${allUsers.length} người dùng` })
            ])
          ]);

          if (!filtered.length) {
            contentArea.replaceChildren(
              toolbar,
              emptyState({ title: 'Không tìm thấy người dùng', text: 'Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc vai trò khác.' })
            );
            return;
          }

          const rows = filtered.map((u) => {
            const isMe = u.id === session.userId;
            const isPending = u.role === 'pending' || Number(u.isVerified) === 0;

            const roleSelect = el('select', {
              class: 'field-input field-input-sm',
              style: 'min-width: 160px;',
              disabled: isMe,
              title: isMe ? 'Không thể đổi vai trò của chính mình' : 'Chọn vai trò mới'
            }, [
              el('option', { value: 'manager', text: 'Quản lý (Admin)', selected: u.role === 'manager' }),
              el('option', { value: 'reviewer', text: 'Góp ý (Reviewer)', selected: u.role === 'reviewer' }),
              el('option', { value: 'viewer', text: 'Chỉ xem (Viewer)', selected: u.role === 'viewer' }),
              ...(isPending ? [el('option', { value: 'pending', text: 'Chờ duyệt', selected: true })] : [])
            ]);

            roleSelect.addEventListener('change', async () => {
              const nextRole = roleSelect.value;
              roleSelect.disabled = true;
              try {
                if (isPending) {
                  await api.approveUser(u.id, nextRole);
                } else {
                  await api.updateSystemUserRole(u.id, nextRole);
                }
                toast(`Đã cập nhật vai trò cho ${u.name}.`, 'success');
                loadData();
              } catch (err) {
                roleSelect.value = u.role;
                roleSelect.disabled = isMe;
                toast(err.message || 'Lỗi cập nhật vai trò.', 'error');
              }
            });

            const roleDisplay = isMe
              ? el('div', { class: 'inline-actions' }, [
                  el('span', { class: 'badge badge-role role-manager', text: 'Quản lý (Admin)' }),
                  el('span', { class: 'help', text: '(Bạn)' })
                ])
              : roleSelect;

            const statusPill = isPending
              ? el('span', { class: 'status-pill is-pending' }, [
                  el('span', { class: 'status-pill-dot' }),
                  el('span', { text: 'Chờ duyệt' })
                ])
              : el('span', { class: 'status-pill is-active' }, [
                  el('span', { class: 'status-pill-dot' }),
                  el('span', { text: 'Hoạt động' })
                ]);

            const resetPassBtn = el('button', {
              type: 'button',
              class: 'btn btn-secondary btn-sm',
              text: 'Đổi mật khẩu',
              onclick: () => openResetPasswordModal(u)
            });

            const deleteBtn = !isMe ? el('button', {
              type: 'button',
              class: 'btn btn-ghost btn-sm',
              style: 'color: #dc2626; margin-left: 6px;',
              text: 'Xóa',
              onclick: async () => {
                const ok = await confirmDialog({
                  title: 'Xóa tài khoản người dùng?',
                  message: `Thao tác này sẽ xóa vĩnh viễn tài khoản của ${u.name} (@${u.username}) khỏi hệ thống.`,
                  confirmText: 'Xóa vĩnh viễn',
                  danger: true
                });
                if (!ok) return;
                try {
                  await api.deleteSystemUser(u.id);
                  toast(`Đã xóa tài khoản ${u.name}.`, 'info');
                  loadData();
                } catch (err) {
                  toast(err.message || 'Lỗi xóa tài khoản.', 'error');
                }
              }
            }) : el('span', { class: 'help', text: '(Tài khoản của bạn)' });

            return el('tr', {}, [
              el('td', {}, [
                el('div', { class: 'member-cell' }, [
                  avatarEl(u, 36),
                  el('div', {}, [
                    el('strong', { text: u.name }),
                    el('div', { class: 'help', text: `@${u.username}` })
                  ])
                ])
              ]),
              el('td', {}, [
                u.title ? el('span', { text: u.title }) : el('span', { class: 'help', text: 'Chưa cập nhật' })
              ]),
              el('td', {}, [roleDisplay]),
              el('td', {}, [statusPill]),
              el('td', {}, [
                el('span', { class: 'help', text: formatDay(u.createdAt) })
              ]),
              el('td', {}, [
                el('div', { class: 'inline-actions' }, [resetPassBtn, deleteBtn])
              ])
            ]);
          });

          const table = el('table', { class: 'data-table is-aligned' }, [
            el('thead', {}, [
              el('tr', {}, ['Thành viên', 'Chức danh', 'Vai trò hệ thống', 'Trạng thái', 'Ngày tham gia', 'Thao tác'].map((l) => el('th', { text: l })))
            ]),
            el('tbody', {}, rows)
          ]);

          contentArea.replaceChildren(
            toolbar,
            el('div', { class: 'table-wrap' }, [table])
          );
        }
      }

      renderContentArea();

      page.replaceChildren(
        el('section', { id: 'users-overview' }, [
          header,
          stats
        ]),
        el('section', { style: 'margin-top: 24px;' }, [
          tabNav,
          contentArea
        ])
      );
    }

    await loadData();
  }
});
