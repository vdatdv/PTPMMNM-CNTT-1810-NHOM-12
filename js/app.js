/**
 * Khởi tạo chung cho các trang đã đăng nhập.
 */
import { requireAuth } from './auth.js';
import { announce, loadingBlock, mountChrome, setBreadcrumb, setPageTitle, toast } from './ui.js';

export async function boot({ active = 'overview', title = 'DesignMark', render }) {
  const session = requireAuth();
  if (!session) return null;
  mountChrome({ active });
  setPageTitle(title);
  setBreadcrumb([{ label: 'DesignMark', href: 'dashboard.php' }, { label: title }]);
  const page = document.getElementById('page');
  if (page && page.dataset.preserve !== 'true') page.replaceChildren(loadingBlock());
  try {
    const recovery = sessionStorage.getItem('designmark.recovery');
    if (recovery) {
      sessionStorage.removeItem('designmark.recovery');
      toast(recovery, 'error');
    }
    const welcome = sessionStorage.getItem('designmark.welcome');
    if (welcome) {
      sessionStorage.removeItem('designmark.welcome');
      toast(`Xin chào, ${welcome}.`, 'success');
    }
  } catch (err) {
    /* bỏ qua nếu storage bị khóa */
  }
  const ctx = { session, setPageTitle, setBreadcrumb, announce };
  try {
    await render(ctx);
    const recovery = sessionStorage.getItem('designmark.recovery');
    if (recovery) {
      sessionStorage.removeItem('designmark.recovery');
      toast(recovery, 'error');
    }
  } catch (err) {
    console.error(err);
    if (page) {
      page.replaceChildren(loadingBlock(err.message || 'Không tải được dữ liệu.'));
    }
    toast(err.message || 'Không tải được dữ liệu.', 'error');
  }
  return ctx;
}
