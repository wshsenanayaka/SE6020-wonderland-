<?php
require_once dirname(__DIR__) . '/include/config.php';
require_once __DIR__ . '/JsonStorageService.php';

class VisitorProfileService
{
    private ?PDO $db;
    private JsonStorageService $jsonStorage;

    public function __construct()
    {
        $database = new WonderlandDatabase();
        $this->db = $database->connect();
        $this->jsonStorage = new JsonStorageService('visitors.json');
    }

    public function register(array $request): bool
    {
        $password = (string) ($request['password'] ?? '');
        $confirmPassword = (string) ($request['confirm_password'] ?? '');
        $visitor = [
            'full_name' => trim($request['full_name'] ?? ''),
            'email' => trim($request['email'] ?? ''),
            'contact_number' => trim($request['contact_number'] ?? ''),
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'created_at' => date('c'),
        ];

        if ($visitor['full_name'] === '' || $visitor['email'] === '' || $password === '' || $password !== $confirmPassword) {
            return false;
        }

        if ($this->storeInDatabase($visitor)) {
            return true;
        }

        $this->storeInJson($visitor);
        return true;
    }

    public function findByEmail(string $email): ?array
    {
        if ($this->db instanceof PDO) {
            try {
                $statement = $this->db->prepare('SELECT full_name, email, password_hash FROM visitors_tb WHERE email = :email AND status = 1 LIMIT 1');
                $statement->execute([':email' => $email]);
                $visitor = $statement->fetch();

                if ($visitor) {
                    return $visitor;
                }
            } catch (PDOException $exception) {
                return $this->findInJson($email);
            }
        }

        return $this->findInJson($email);
    }

    private function storeInDatabase(array $visitor): bool
    {
        if (!$this->db instanceof PDO) {
            return false;
        }

        try {
            $statement = $this->db->prepare(
                'INSERT INTO visitors_tb (full_name, email, contact_number, password_hash, status, created_at)
                VALUES (:full_name, :email, :contact_number, :password_hash, 1, NOW())'
            );

            return $statement->execute([
                ':full_name' => $visitor['full_name'],
                ':email' => $visitor['email'],
                ':contact_number' => $visitor['contact_number'],
                ':password_hash' => $visitor['password_hash'],
            ]);
        } catch (PDOException $exception) {
            return false;
        }
    }

    private function storeInJson(array $visitor): void
    {
        $visitors = $this->jsonStorage->all();

        foreach ($visitors as $index => $existingVisitor) {
            if (($existingVisitor['email'] ?? '') === $visitor['email']) {
                $visitors[$index] = $visitor;
                $this->jsonStorage->saveAll($visitors);
                return;
            }
        }

        $visitors[] = $visitor;
        $this->jsonStorage->saveAll($visitors);
    }

    private function findInJson(string $email): ?array
    {
        foreach ($this->jsonStorage->all() as $visitor) {
            if (($visitor['email'] ?? '') === $email) {
                return $visitor;
            }
        }

        return null;
    }
}
