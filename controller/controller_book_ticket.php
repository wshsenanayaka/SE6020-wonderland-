<?php
require_once dirname(__DIR__) . '/include/data.php';
require_once dirname(__DIR__) . '/services/TicketBookingService.php';

class TicketBookingController
{
    private TicketBookingService $bookingService;

    public function __construct(TicketBookingService $bookingService)
    {
        $this->bookingService = $bookingService;
    }

    public function handle(array $request): void
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('../index.php#booking');
        }

        $this->bookingService->book($request);
        $this->redirect('../index.php?booking=success#booking');
    }

    private function redirect(string $path): void
    {
        header('Location: ' . $path);
        exit;
    }
}

$service = new TicketBookingService($ticketTypes);
(new TicketBookingController($service))->handle($_POST);
