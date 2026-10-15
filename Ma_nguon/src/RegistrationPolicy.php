<?php
declare(strict_types=1);

final class RegistrationPolicy {
    public function decide(int $capacity, int $registered, 
        bool $open, bool $waitingEnabled): string {
        
        // 1. Kiểm tra dữ liệu không hợp lệ -> rejected
        if ($capacity <= 0 || $registered < 0 || $registered > $capacity) {
            return 'rejected';
        }

        // 2. Nếu sự kiện đóng (dù còn hay hết chỗ) -> rejected
        if (!$open) {
            return 'rejected';
        }

        // 3. Sự kiện mở và còn chỗ ($registered < $capacity) -> confirmed
        if ($registered < $capacity) {
            return 'confirmed';
        }

        // 4. Sự kiện mở, đã hết chỗ, có bật danh sách chờ -> waiting
        if ($waitingEnabled) {
            return 'waiting';
        }

        // 5. Sự kiện mở, đã hết chỗ, không có danh sách chờ -> rejected
        return 'rejected';
    }
}