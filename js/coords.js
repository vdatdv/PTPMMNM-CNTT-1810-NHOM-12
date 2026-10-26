/**
 * Quy đổi tọa độ giữa vị trí con trỏ và pixel ảnh gốc.
 * Hàm thuần, không phụ thuộc trạng thái ứng dụng — thuận tiện cho unit test.
 */

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Chuyển vị trí con trỏ (clientX/clientY) sang tọa độ pixel của ảnh gốc.
 * Dùng getBoundingClientRect cùng kích thước gốc nên vẫn đúng khi zoom, cuộn,
 * ảnh nhỏ hơn khung chứa hoặc cửa sổ đổi kích thước.
 * @returns {{x: number, y: number}}
 */
export function toOriginal(event, img) {
  const rect = img.getBoundingClientRect();
  const naturalW = img.naturalWidth || Number(img.dataset.originalWidth) || 0;
  const naturalH = img.naturalHeight || Number(img.dataset.originalHeight) || 0;
  if (!naturalW || !naturalH || rect.width === 0 || rect.height === 0) {
    return { x: 0, y: 0 };
  }
  const x = ((event.clientX - rect.left) / rect.width) * naturalW;
  const y = ((event.clientY - rect.top) / rect.height) * naturalH;
  return {
    x: clamp(x, 0, naturalW),
    y: clamp(y, 0, naturalH)
  };
}

/**
 * Đổi annotation lưu theo pixel ảnh gốc thành chuỗi phần trăm để định vị trên ảnh.
 * Không dùng pixel màn hình. Tránh chia cho 0 khi thiếu kích thước gốc.
 * @returns {{left: string, top: string, width: string, height: string}}
 */
export function toStyle(annotation, naturalW, naturalH) {
  const w = Number(naturalW) || 0;
  const h = Number(naturalH) || 0;
  if (!w || !h || !annotation) {
    return { left: '0%', top: '0%', width: '0%', height: '0%' };
  }
  return {
    left: `${(Number(annotation.x) || 0) / w * 100}%`,
    top: `${(Number(annotation.y) || 0) / h * 100}%`,
    width: `${(Number(annotation.w) || 0) / w * 100}%`,
    height: `${(Number(annotation.h) || 0) / h * 100}%`
  };
}
