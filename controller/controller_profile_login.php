<?php
require_once dirname(__DIR__) . '/services/ProfileLoginService.php';

class ProfileLoginController
{
    private ProfileLoginService $profileLoginService;

    public function __construct(ProfileLoginService $profileLoginService)
    {
        $this->profileLoginService = $profileLoginService;
    }

    public function handle(array $request): void
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('../login.php');
        }

        $this->redirect($this->profileLoginService->login($request));
    }

    private function redirect(string $path): void
    {
        header('Location: ' . $path);
        exit;
    }
}

(new ProfileLoginController(new ProfileLoginService()))->handle($_POST);
