import { boot } from './app.js';
import { api } from './api.js';
import {
  avatarEl,
  el,
  emptyState,
  formatDate,
  formatDay,
  icon,
  loadingBlock,
  openModal,
  setBusy,
  toast
} from './ui.js';

function statCard(label, value, iconName, href = null, highlight = '') {
  const card = el(href ? 'a' : 'article', {
    class: `stat-card${highlight ? ' is-' + highlight : ''}${href ? ' is-clickable' : ''}`,
    ...(href ? { href } : {})
  }, [
    el('div', { class: 'stat-header' }, [
      el('span', { class: 'stat-label', text: label }),
      iconName ? icon(iconName) : null
    ].filter(Boolean)),
    el('strong', { class: 'stat-value', text: String(value) })
  ]);
  return card;
}

function renderPendingApprovalCard(pendingUsers, refreshFn) {
  const rows = pendingUsers.map((u) => {
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
          refreshFn();
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
          refreshFn();
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

  const table = el('table', { class: 'data-table' }, [
    el('thead', {}, [
      el('tr', {}, ['Tài khoản chờ duyệt', 'Phân cấp vai trò', 'Thao tác'].map((l) => el('th', { text: l })))
    ]),
    el('tbody', {}, rows)
  ]);

  return el('section', { class: 'panel panel-pad', style: 'margin-bottom: 24px; border-left: 4px solid var(--primary);' }, [
    el('div', { class: 'page-head', style: 'margin-bottom: 12px;' }, [
      el('div', {}, [
        el('h3', { text: `Tài khoản chờ Admin phân cấp vai trò (${pendingUsers.length})`, style: 'margin: 0 0 4px 0;' }),
        el('p', { class: 'help', text: 'Thành viên mới đã đăng ký và đang chờ phân cấp vai trò (Quản lý, Góp ý, Chỉ xem) để kích hoạt sử dụng.' })
      ]),
      el('a', { href: 'users.php', class: 'btn btn-secondary btn-sm', style: 'text-decoration: none;' }, [el('span', { text: 'Quản lý tài khoản &rarr;' })])
    ]),
    el('div', { class: 'table-wrap' }, [table])
  ]);
}

function renderPendingFeedbackSection(pendingFeedback) {
  const container = el('section', { class: 'dashboard-card' }, [
    el('div', { class: 'dashboard-card-head' }, [
      el('div', {}, [
        el('div', { class: 'dashboard-title-row' }, [
          icon('message'),
          el('h2', { text: 'Góp ý cần xử lý' }),
          el('span', { class: 'badge badge-warning', text: `${pendingFeedback.length} chưa xong` })
        ]),
        el('p', { class: 'dashboard-subtitle', text: 'Các góp ý mới hoặc đang mở cần phản hồi và đối chiếu trên bản thiết kế.' })
      ]),
      el('a', { href: 'feedback.php', class: 'btn btn-ghost btn-sm' }, [
        el('span', { text: 'Xem tất cả' }),
        icon('chevron')
      ])
    ])
  ]);

  if (!pendingFeedback.length) {
    container.append(emptyState({
      title: 'Không có góp ý tồn đọng',
      text: 'Mọi nhận xét và góp ý trong các dự án của bạn đều đã được giải quyết.'
    }));
    return container;
  }

  const rows = pendingFeedback.map((item) => {
    return el('tr', { class: 'feedback-row' }, [
      el('td', { class: 'feedback-project-col' }, [
        el('div', { class: 'feedback-project-info' }, [
          el('strong', { class: 'project-name', text: item.projectName }),
          el('span', { class: 'screen-name', text: `${item.screenName} (v${item.versionNumber})` })
        ])
      ]),
      el('td', { class: 'feedback-body-col' }, [
        el('p', { class: 'feedback-snippet', text: item.body, title: item.body })
      ]),
      el('td', { class: 'feedback-author-col' }, [
        el('div', { class: 'member-cell' }, [
          avatarEl(item.author, 24),
          el('span', { text: item.author.name })
        ])
      ]),
      el('td', { class: 'feedback-time-col' }, [
        el('time', { datetime: item.createdAt, text: formatDay(item.createdAt) })
      ]),
      el('td', { class: 'feedback-status-col' }, [
        el('span', { class: `badge badge-status status-${item.status}`, text: item.status === 'open' ? 'Chưa xử lý' : 'Đang xử lý' })
      ]),
      el('td', { class: 'feedback-action-col' }, [
        el('a', {
          href: item.reviewUrl,
          class: 'btn btn-secondary btn-sm',
          title: 'Mở vị trí góp ý trên ảnh thiết kế'
        }, [
          icon('pin'),
          el('span', { text: 'Mở trên ảnh' })
        ])
      ])
    ]);
  });

  const table = el('table', { class: 'data-table feedback-table' }, [
    el('thead', {}, [
      el('tr', {}, [
        el('th', { text: 'Dự án & Màn hình' }),
        el('th', { text: 'Nội dung góp ý' }),
        el('th', { text: 'Người gửi' }),
        el('th', { text: 'Ngày tạo' }),
        el('th', { text: 'Trạng thái' }),
        el('th', { text: 'Thao tác' })
      ])
    ]),
    el('tbody', {}, rows)
  ]);

  container.append(el('div', { class: 'table-wrap' }, [table]));
  return container;
}

function renderRecentActivitiesSection(activities) {
  const container = el('section', { class: 'dashboard-card' }, [
    el('div', { class: 'dashboard-card-head' }, [
      el('div', {}, [
        el('div', { class: 'dashboard-title-row' }, [
          icon('clock'),
          el('h2', { text: 'Hoạt động gần đây' })
        ]),
        el('p', { class: 'dashboard-subtitle', text: 'Nhật ký các thao tác tạo mới, nhận xét và cập nhật trạng thái trong các dự án.' })
      ])
    ])
  ]);

  if (!activities.length) {
    container.append(emptyState({
      title: 'Chưa có hoạt động',
      text: 'Các hoạt động đóng góp, cập nhật ảnh và nhận xét sẽ hiển thị tại đây.'
    }));
    return container;
  }

  const list = el('div', { class: 'timeline' });
  activities.forEach((act) => {
    list.append(el('article', { class: 'timeline-item' }, [
      avatarEl(act.user, 32),
      el('div', { class: 'timeline-content' }, [
        el('p', {}, [
          el('strong', { text: act.user.name }),
          document.createTextNode(` ${act.message} `),
          el('a', { class: 'timeline-project-link', href: act.link }, [
            el('span', { text: `[${act.projectName}]` })
          ])
        ]),
        el('time', { datetime: act.createdAt, text: formatDate(act.createdAt) })
      ])
    ]));
  });

  container.append(list);
  return container;
}

function renderRecentProjectsSection(projects, session) {
  const container = el('section', { class: 'dashboard-card' }, [
    el('div', { class: 'dashboard-card-head' }, [
      el('div', {}, [
        el('div', { class: 'dashboard-title-row' }, [
          icon('folder'),
          el('h2', { text: 'Dự án gần đây' })
        ]),
        el('p', { class: 'dashboard-subtitle', text: 'Truy cập nhanh các dự án có tương tác mới nhất.' })
      ]),
      el('a', { href: 'projects.php', class: 'btn btn-secondary btn-sm' }, [
        el('span', { text: 'Xem tất cả dự án' }),
        icon('chevron')
      ])
    ])
  ]);

  if (!projects.length) {
    container.append(emptyState({
      title: 'Chưa tham gia dự án nào',
      text: 'Bạn chưa thuộc dự án nào. Quản trị viên có thể tạo hoặc mời bạn vào dự án.'
    }));
    return container;
  }

  const grid = el('div', { class: 'recent-projects-grid' });
  projects.forEach((proj) => {
    const stack = el('div', { class: 'avatar-stack', 'aria-label': `Thành viên: ${proj.members.map((m) => m.name).join(', ')}` });
    proj.members.slice(0, 4).forEach((m) => stack.append(avatarEl(m, 26)));

    grid.append(el('a', { class: 'card recent-project-card', href: `project.php?id=${encodeURIComponent(proj.id)}` }, [
      el('div', { class: 'recent-project-top' }, [
        el('h3', { text: proj.name }),
        proj.myRole ? el('span', { class: 'badge badge-primary-subtle', text: proj.myRole === 'manager' ? 'Quản lý' : (proj.myRole === 'reviewer' ? 'Góp ý' : 'Chỉ xem') }) : null
      ].filter(Boolean)),
      el('p', { class: 'recent-project-desc', text: proj.description || 'Chưa có mô tả chi tiết.' }),
      el('div', { class: 'recent-project-meta' }, [
        el('span', { text: `${proj.screenCount} màn hình` }),
        el('span', { class: proj.openCount > 0 ? 'text-amber' : '', text: `${proj.openCount} chưa xử lý` }),
        el('span', { text: `${proj.resolvedCount} đã duyệt` })
      ]),
      el('div', { class: 'recent-project-footer' }, [
        stack,
        el('span', { class: 'recent-project-date', text: `Cập nhật ${formatDay(proj.updatedAt)}` })
      ])
    ]));
  });

  container.append(grid);
  return container;
}

boot({
  active: 'overview',
  title: 'Tổng quan dự án',
  async render({ session, setBreadcrumb }) {
    setBreadcrumb([
      { label: 'DesignMark', href: 'dashboard.php' },
      { label: 'Tổng quan dự án' }
    ]);
    const page = document.getElementById('page');
    page.replaceChildren(loadingBlock('Đang tải dữ liệu tổng quan...'));

    async function loadDashboard() {
      try {
        const data = await api.getDashboard();
        const { stats, recentActivities, pendingFeedback, recentProjects, pendingUsers } = data;

        const statGrid = el('div', { class: 'stat-grid' }, [
          statCard('Dự án được cấp quyền', stats.totalProjects, 'folder', 'projects.php'),
          statCard('Màn hình thiết kế', stats.totalScreens, 'grid', 'projects.php'),
          statCard('Góp ý chưa xử lý', stats.openFeedback, 'message', 'feedback.php', stats.openFeedback > 0 ? 'warning' : ''),
          statCard('Góp ý đã hoàn thành', stats.resolvedFeedback, 'check', null, 'success')
        ]);

        const headerActions = el('div', { class: 'page-head' }, [
          el('div', {}, [
            el('p', { class: 'lede', text: 'Theo dõi tình hình hoạt động chung, tiến độ góp ý và các bản thiết kế mới nhất.' })
          ]),
          el('div', { class: 'inline-actions' }, [
            el('a', { href: 'projects.php', class: 'btn btn-secondary' }, [
              icon('folder'),
              el('span', { text: 'Danh sách dự án' })
            ]),
            session.role === 'manager'
              ? el('a', { href: 'projects.php#create', class: 'btn btn-primary' }, [
                  icon('plus'),
                  el('span', { text: 'Tạo dự án mới' })
                ])
              : null
          ].filter(Boolean))
        ]);

        const pendingApprovalBox = (pendingUsers && pendingUsers.length > 0)
          ? renderPendingApprovalCard(pendingUsers, loadDashboard)
          : null;

        const recentProjectsSection = renderRecentProjectsSection(recentProjects || [], session);
        const feedbackSection = renderPendingFeedbackSection(pendingFeedback || []);
        const activitiesSection = renderRecentActivitiesSection(recentActivities || []);

        page.replaceChildren(
          ...(pendingApprovalBox ? [pendingApprovalBox] : []),
          headerActions,
          statGrid,
          recentProjectsSection,
          feedbackSection,
          activitiesSection
        );
      } catch (err) {
        page.replaceChildren(emptyState({
          title: 'Lỗi tải tổng quan',
          text: err.message || 'Không thể lấy dữ liệu tổng quan từ máy chủ. Vui lòng thử lại sau.'
        }));
      }
    }

    await loadDashboard();
  }
});
