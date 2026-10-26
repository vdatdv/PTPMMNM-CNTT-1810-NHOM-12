<?php
// includes/head.php - Common HTML head tags
if (!isset($pageTitle)) {
    $pageTitle = 'DesignMark';
}
if (!isset($pageDescription)) {
    $pageDescription = 'DesignMark — góp ý trực tiếp trên ảnh và bản thiết kế giao diện.';
}
$currentUserSession = isset($pdo) ? get_current_user_session($pdo) : null;
?>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="<?= htmlspecialchars($pageDescription, ENT_QUOTES, 'UTF-8') ?>">
  <title><?= htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8') ?></title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%234F46E5'/%3E%3Ccircle cx='16' cy='16' r='5' fill='white'/%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/app.css">
  <script>
    window.DESIGNMARK_SESSION = <?= json_encode($currentUserSession) ?>;
  </script>
