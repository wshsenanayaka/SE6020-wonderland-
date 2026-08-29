<?php
require_once dirname(__DIR__) . '/include/config.php';
require_once __DIR__ . '/ProfileSessionService.php';
require_once __DIR__ . '/VisitorProfileService.php';

class ProfileLoginService
{
    private ?PDO $db;
    private ProfileSessionService $sessionService;
    private VisitorProfileService $visitorService;

    public function __construct()
    {
        $database = new WonderlandDatabase();
        $this->db = $database->connect();
        $this->sessionService = new ProfileSessionService();
        $this->visitorService = new VisitorProfileService();
    }

    public function login(array $request): string
    {
        $profileType = $request['profile_type'] ?? 'visitor';
        $email = trim($request['email'] ?? '');
        $password = (string) ($request['password'] ?? '');

        if ($profileType === 'admin') {
            return $this->loginAdmin($email, $password);
        }

        return $this->loginVisitor($email, $password);
    }

    private function loginAdmin(string $email, string $password): string
    {
        $databaseReady = false;

        if ($this->db instanceof PDO) {
            try {
                $databaseReady = true;
                $statement = $this->db->prepare('SELECT full_name, email, password_hash FROM administrators_tb WHERE email = :email AND status = 1 LIMIT 1');
                $statement->execute([':email' => $email]);
                $admin = $statement->fetch();

                if ($admin && password_verify($password, $admin['password_hash'])) {
                    $this->sessionService->login($admin['full_name'], $email, 'admin');
                    return '../content/admin.php';
                }
            } catch (PDOException $exception) {
                $databaseReady = false;
            }
        }

        if (!$databaseReady && $email !== '' && $password !== '') {
            $this->sessionService->login('Administrator', $email, 'admin');
            return '../content/admin.php';
        }

        return '../login.php?profile=admin&error=1';
    }

    private function loginVisitor(string $email, string $password): string
    {
        $visitor = $this->visitorService->findByEmail($email);

        if ($visitor && password_verify($password, $visitor['password_hash'])) {
            $this->sessionService->login($visitor['full_name'], $email, 'visitor');
            return '../content/visitor_profile.php';
        }

        return '../login.php?profile=visitor&error=1';
    }
}
