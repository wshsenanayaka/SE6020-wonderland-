<?php
require_once dirname(__DIR__) . '/include/config.php';
require_once __DIR__ . '/JsonStorageService.php';

class TicketBookingService
{
    private ?PDO $db;
    private JsonStorageService $jsonStorage;
    private array $ticketTypes;

    public function __construct(array $ticketTypes)
    {
        $database = new WonderlandDatabase();
        $this->db = $database->connect();
        $this->jsonStorage = new JsonStorageService('bookings.json');
        $this->ticketTypes = $ticketTypes;
    }

    public function book(array $request): void
    {
        $ticketKey = $request['ticket_type'] ?? 'adult';
        $ticket = $this->ticketTypes[$ticketKey] ?? $this->ticketTypes['adult'];
        $quantity = max(1, min(20, (int) ($request['quantity'] ?? 1)));

        $booking = [
            'visitor_name' => trim($request['visitor_name'] ?? ''),
            'email' => trim($request['email'] ?? ''),
            'visit_date' => trim($request['visit_date'] ?? ''),
            'ticket_type' => $ticketKey,
            'ticket_label' => $ticket['label'],
            'quantity' => $quantity,
            'contact_number' => trim($request['contact_number'] ?? ''),
            'total' => $quantity * (int) $ticket['price'],
            'created_at' => date('c'),
        ];

        if (!$this->storeInDatabase($booking)) {
            $this->storeInJson($booking);
        }
    }

    private function storeInDatabase(array $booking): bool
    {
        if (!$this->db instanceof PDO) {
            return false;
        }

        try {
            $statement = $this->db->prepare(
                'INSERT INTO ticket_bookings_tb
                (visitor_name, email, visit_date, ticket_type, ticket_label, quantity, contact_number, total_amount, created_at)
                VALUES
                (:visitor_name, :email, :visit_date, :ticket_type, :ticket_label, :quantity, :contact_number, :total_amount, NOW())'
            );

            return $statement->execute([
                ':visitor_name' => $booking['visitor_name'],
                ':email' => $booking['email'],
                ':visit_date' => $booking['visit_date'],
                ':ticket_type' => $booking['ticket_type'],
                ':ticket_label' => $booking['ticket_label'],
                ':quantity' => $booking['quantity'],
                ':contact_number' => $booking['contact_number'],
                ':total_amount' => $booking['total'],
            ]);
        } catch (PDOException $exception) {
            return false;
        }
    }

    private function storeInJson(array $booking): void
    {
        $bookings = $this->jsonStorage->all();
        $bookings[] = $booking;
        $this->jsonStorage->saveAll($bookings);
    }
}
