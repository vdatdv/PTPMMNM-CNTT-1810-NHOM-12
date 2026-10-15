<?php
declare(strict_types=1);

function filterEvents(array $events, string $query, string $category = '',
    bool $availableOnly = false): array
{
    $result = [];
    foreach ($events as $event) {
        $matches = $query === ''
            || stripos($event['title'], $query) !== false;
        $matchesCategory = $category === '' || $event['category'] === $category;
        $hasCapacity = !$availableOnly || $event['registered'] < $event['capacity'];
        if ($matches && $matchesCategory && $hasCapacity) {
            $result[] = $event;
        }
    }
    return $result;
}
