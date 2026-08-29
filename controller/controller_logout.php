<?php
require_once dirname(__DIR__) . '/services/ProfileSessionService.php';

class LogoutController
{
    private ProfileSessionService $profileSessionService;

    public function __construct(ProfileSessionService $profileSessionService)
    {
        $this->profileSessionService = $profileSessionService;
    }

    public function handle(): void
    {
        $this->profileSessionService->logout();
        header('Location: ../index.php');
        exit;
    }
}

(new LogoutController(new ProfileSessionService()))->handle();
