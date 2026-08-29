<?php
require_once dirname(__DIR__) . '/include/config.php';
require_once __DIR__ . '/JsonStorageService.php';

class ActivityService
{
    private ?PDO $db;
    private JsonStorageService $jsonStorage;

    public function __construct()
    {
        $database = new WonderlandDatabase();
        $this->db = $database->connect();
        $this->jsonStorage = new JsonStorageService('activities.json');
    }

    public function all(array $fallbackActivities = []): array
    {
        $activities = $this->allFromDatabase();

        if (count($activities) === 0) {
            $activities = $this->jsonStorage->all();
        }

        return count($activities) > 0 ? $activities : $this->normalizeFallback($fallbackActivities);
    }

    public function visible(array $fallbackActivities = []): array
    {
        return array_values(array_filter($this->all($fallbackActivities), function ($activity) {
            return (int) ($activity['is_visible'] ?? 1) === 1;
        }));
    }

    public function create(array $request, array $files): bool
    {
        $activity = [
            'category' => trim($request['category'] ?? ''),
            'ride_type' => trim($request['ride_type'] ?? ''),
            'name' => trim($request['name'] ?? ''),
            'tagline' => trim($request['tagline'] ?? ''),
            'duration_label' => trim($request['duration_label'] ?? ''),
            'requirement_label' => trim($request['requirement_label'] ?? ''),
            'background_image' => $this->resolveBackgroundImage($request, $files),
            'icon' => trim($request['icon'] ?? 'mdi-star-circle'),
            'color' => trim($request['color'] ?? '#ee3e50'),
            'zone' => trim($request['zone'] ?? 'Wonderland'),
            'wait' => (int) ($request['wait'] ?? 0),
            'capacity' => (int) ($request['capacity'] ?? 0),
            'status' => trim($request['status'] ?? 'Operational'),
            'is_visible' => isset($request['is_visible']) ? 1 : 0,
            'created_at' => date('c'),
        ];

        if ($activity['category'] === '' || $activity['ride_type'] === '' || $activity['name'] === '' || $activity['tagline'] === '') {
            return false;
        }

        if ($this->createInDatabase($activity)) {
            return true;
        }

        $activities = $this->jsonStorage->all();
        $activity['id'] = $this->nextJsonId($activities);
        $activities[] = $activity;
        $this->jsonStorage->saveAll($activities);

        return true;
    }

    public function setVisibility(int $id, bool $isVisible): void
    {
        if ($this->setVisibilityInDatabase($id, $isVisible)) {
            return;
        }

        $activities = $this->jsonStorage->all();

        foreach ($activities as $index => $activity) {
            if ((int) ($activity['id'] ?? 0) === $id) {
                $activities[$index]['is_visible'] = $isVisible ? 1 : 0;
                $this->jsonStorage->saveAll($activities);
                return;
            }
        }
    }

    public function toPublicCard(array $activity): array
    {
        return [
            'id' => $activity['id'] ?? null,
            'name' => $activity['name'] ?? '',
            'category' => $activity['category'] ?? '',
            'ride_type' => $activity['ride_type'] ?? (($activity['category'] ?? '') . ' Ride'),
            'zone' => $activity['zone'] ?? 'Wonderland',
            'wait' => (int) ($activity['wait'] ?? 0),
            'capacity' => (int) ($activity['capacity'] ?? 0),
            'status' => $activity['status'] ?? 'Operational',
            'tagline' => $activity['tagline'] ?? '',
            'icon' => $activity['icon'] ?? 'mdi-star-circle',
            'color' => $activity['color'] ?? '#ee3e50',
            'details' => [
                $activity['duration_label'] ?? 'All day',
                $activity['requirement_label'] ?? 'All Ages',
            ],
            'background_image' => $activity['background_image'] ?? 'assets/images/wonderland-hero.png',
            'image_position' => $activity['image_position'] ?? 'center',
            'is_visible' => (int) ($activity['is_visible'] ?? 1),
        ];
    }

    private function allFromDatabase(): array
    {
        if (!$this->db instanceof PDO) {
            return [];
        }

        try {
            $statement = $this->db->query(
                'SELECT id, category, ride_type, name, tagline, duration_label, requirement_label, background_image,
                    icon, color, zone, wait_minutes AS wait, hourly_capacity AS capacity, operating_status AS status,
                    is_visible, created_at
                FROM activities_tb
                ORDER BY id DESC'
            );

            return $statement->fetchAll();
        } catch (PDOException $exception) {
            return [];
        }
    }

    private function createInDatabase(array $activity): bool
    {
        if (!$this->db instanceof PDO) {
            return false;
        }

        try {
            $statement = $this->db->prepare(
                'INSERT INTO activities_tb
                (category, ride_type, name, tagline, duration_label, requirement_label, background_image,
                 icon, color, zone, wait_minutes, hourly_capacity, operating_status, is_visible, created_at)
                VALUES
                (:category, :ride_type, :name, :tagline, :duration_label, :requirement_label, :background_image,
                 :icon, :color, :zone, :wait_minutes, :hourly_capacity, :operating_status, :is_visible, NOW())'
            );

            return $statement->execute([
                ':category' => $activity['category'],
                ':ride_type' => $activity['ride_type'],
                ':name' => $activity['name'],
                ':tagline' => $activity['tagline'],
                ':duration_label' => $activity['duration_label'],
                ':requirement_label' => $activity['requirement_label'],
                ':background_image' => $activity['background_image'],
                ':icon' => $activity['icon'],
                ':color' => $activity['color'],
                ':zone' => $activity['zone'],
                ':wait_minutes' => $activity['wait'],
                ':hourly_capacity' => $activity['capacity'],
                ':operating_status' => $activity['status'],
                ':is_visible' => $activity['is_visible'],
            ]);
        } catch (PDOException $exception) {
            return false;
        }
    }

    private function setVisibilityInDatabase(int $id, bool $isVisible): bool
    {
        if (!$this->db instanceof PDO) {
            return false;
        }

        try {
            $statement = $this->db->prepare('UPDATE activities_tb SET is_visible = :is_visible WHERE id = :id');
            return $statement->execute([
                ':is_visible' => $isVisible ? 1 : 0,
                ':id' => $id,
            ]);
        } catch (PDOException $exception) {
            return false;
        }
    }

    private function resolveBackgroundImage(array $request, array $files): string
    {
        if (isset($files['background_image']) && ($files['background_image']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
            $extension = strtolower(pathinfo($files['background_image']['name'], PATHINFO_EXTENSION));
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

            if (in_array($extension, $allowedExtensions, true)) {
                $fileName = 'activity-' . date('YmdHis') . '-' . random_int(1000, 9999) . '.' . $extension;
                $relativePath = 'assets/images/activities/' . $fileName;
                $targetPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relativePath);

                if (move_uploaded_file($files['background_image']['tmp_name'], $targetPath)) {
                    return $relativePath;
                }
            }
        }

        return trim($request['background_image_path'] ?? '') ?: 'assets/images/wonderland-hero.png';
    }

    private function nextJsonId(array $activities): int
    {
        $maxId = 0;

        foreach ($activities as $activity) {
            $maxId = max($maxId, (int) ($activity['id'] ?? 0));
        }

        return $maxId + 1;
    }

    private function normalizeFallback(array $fallbackActivities): array
    {
        return array_map(function ($activity) {
            $activity['id'] = $activity['id'] ?? 0;
            $activity['ride_type'] = $activity['ride_type'] ?? (($activity['category'] ?? '') . ' Ride');
            $activity['duration_label'] = $activity['duration_label'] ?? ($activity['details'][0] ?? 'All day');
            $activity['requirement_label'] = $activity['requirement_label'] ?? ($activity['details'][1] ?? 'All Ages');
            $activity['background_image'] = $activity['background_image'] ?? 'assets/images/wonderland-hero.png';
            $activity['is_visible'] = $activity['is_visible'] ?? 1;

            return $activity;
        }, $fallbackActivities);
    }
}
