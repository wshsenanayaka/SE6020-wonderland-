<?php
require_once dirname(__DIR__) . '/services/ActivityService.php';

class ActivityManageController
{
    private ActivityService $activityService;

    public function __construct(ActivityService $activityService)
    {
        $this->activityService = $activityService;
    }

    public function handle(array $request, array $files): void
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('../content/admin.php#manage-activities');
        }

        $action = $request['action'] ?? 'create';

        if ($action === 'toggle') {
            $this->activityService->setVisibility((int) ($request['activity_id'] ?? 0), (int) ($request['is_visible'] ?? 0) === 1);
            $this->redirect('../content/admin.php?activity=updated#manage-activities');
        }

        if (!$this->activityService->create($request, $files)) {
            $this->redirect('../content/admin.php?activity=error#manage-activities');
        }

        $this->redirect('../content/admin.php?activity=saved#manage-activities');
    }

    private function redirect(string $path): void
    {
        header('Location: ' . $path);
        exit;
    }
}

(new ActivityManageController(new ActivityService()))->handle($_POST, $_FILES);
