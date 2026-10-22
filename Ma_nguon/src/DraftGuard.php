<?php
declare(strict_types=1);

function canComplete(array $session, int $requestedEventId, int $now, int $ttl): bool {
    // 1. TTL phải dương
    if ($ttl <= 0) {
        return false;
    }

    // 2. Lấy dữ liệu draft theo đúng cấu trúc đề bài test
    $draftData = $session['draft']['data'] ?? $session['draft'] ?? $session;

    if (!isset($draftData['event_id'], $draftData['created_at'])) {
        return false;
    }

    // 3. Đúng event_id yêu cầu
    if ((int)$draftData['event_id'] !== $requestedEventId) {
        return false;
    }

    $createdAt = (int)$draftData['created_at'];

    // 4. created_at không ở tương lai
    if ($createdAt > $now) {
        return false;
    }

    // 5. Kiểm tra thời hạn hết hạn: Tuổi bản nháp không được vượt quá TTL
    // (tương đương: $now - $createdAt < $ttl hoặc $now < $createdAt + $ttl)
    $age = $now - $createdAt;
    if ($age > $ttl) {
        return false;
    }

    return true;
}