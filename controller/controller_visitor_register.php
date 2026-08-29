<?php
require_once dirname(__DIR__) . '/services/VisitorProfileService.php';

class VisitorRegistrationController
{
    private VisitorProfileService $visitorProfileService;

    public function __construct(VisitorProfileService $visitorProfileService)
    {
        $this->visitorProfileService = $visitorProfileService;
    }

    public function handle(array $request): void
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('../register.php');
        }

        if (!$this->visitorProfileService->register($request)) {
            $this->redirect('../register.php?error=1');
        }

        $this->redirect('../login.php?profile=visitor&registered=1');
    }

    private function redirect(string $path): void
    {
        header('Location: ' . $path);
        exit;
    }
}

(new VisitorRegistrationController(new VisitorProfileService()))->handle($_POST);
