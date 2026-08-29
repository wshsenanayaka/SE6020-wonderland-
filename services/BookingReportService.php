<?php
require_once dirname(__DIR__) . '/include/config.php';
require_once __DIR__ . '/JsonStorageService.php';

class BookingReportService
{
    private ?PDO $db;
    private JsonStorageService $jsonStorage;

    public function __construct()
    {
        $database = new WonderlandDatabase();
        $this->db = $database->connect();
        $this->jsonStorage = new JsonStorageService('bookings.json');
    }

    public function recentBookings(int $limit = 25): array
    {
        if ($this->db instanceof PDO) {
            try {
                $statement = $this->db->prepare(
                    'SELECT visitor_name, email, visit_date, ticket_type, ticket_label, quantity, contact_number, total_amount AS total, created_at
                    FROM ticket_bookings_tb
                    ORDER BY id ASC
                    LIMIT :limit'
                );
                $statement->bindValue(':limit', $limit, PDO::PARAM_INT);
                $statement->execute();

                return $statement->fetchAll();
            } catch (PDOException $exception) {
                return $this->jsonStorage->all();
            }
        }

        return $this->jsonStorage->all();
    }
}
