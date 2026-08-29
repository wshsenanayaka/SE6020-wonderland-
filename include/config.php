<?php
date_default_timezone_set('Asia/Colombo');

class WonderlandDatabase
{
    private string $host = 'localhost';
    private string $database = 'wonderland_db';
    private string $username = 'root';
    private string $password = '';
    private int $port = 3306;
    private ?PDO $connection = null;

    public function connect(): ?PDO
    {
        if ($this->connection instanceof PDO) {
            return $this->connection;
        }

        try {
            $this->connection = new PDO(
                "mysql:host={$this->host};dbname={$this->database};port={$this->port};charset=utf8mb4",
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]
            );
        } catch (PDOException $exception) {
            $this->connection = null;
        }

        return $this->connection;
    }
}
