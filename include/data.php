<?php
require_once __DIR__ . '/config.php';
require_once dirname(__DIR__) . '/services/ActivityService.php';
require_once dirname(__DIR__) . '/services/BookingReportService.php';

$defaultAttractions = [
    [
        'name' => 'Skybolt Hyper Coaster',
        'category' => 'Thrill',
        'zone' => 'Summit Zone',
        'wait' => 28,
        'capacity' => 96,
        'status' => 'Operational',
        'tagline' => 'High speed launches, skyline drops, and a full-loop finish.',
        'icon' => 'mdi-rocket',
        'color' => '#ff5a3d',
        'details' => ['3 min', 'Min 140cm'],
        'image_position' => '63% center',
    ],
    [
        'name' => 'Splash River Run',
        'category' => 'Water',
        'zone' => 'Lagoon Bay',
        'wait' => 14,
        'capacity' => 140,
        'status' => 'Operational',
        'tagline' => 'Raft through waterfalls, mist tunnels, and wave turns.',
        'icon' => 'mdi-water',
        'color' => '#0ea5b7',
        'details' => ['8 min', 'Get Wet'],
        'image_position' => '32% center',
    ],
    [
        'name' => 'Tiny Town Carousel',
        'category' => 'Kids',
        'zone' => 'Wonder Grove',
        'wait' => 7,
        'capacity' => 72,
        'status' => 'Operational',
        'tagline' => 'Gentle music, bright animals, and parent-friendly boarding.',
        'icon' => 'mdi-star-circle',
        'color' => '#f6b73c',
        'details' => ['5 min', 'Family'],
        'image_position' => '18% center',
    ],
    [
        'name' => 'Quest Lab Interactive',
        'category' => 'Interactive',
        'zone' => 'Discovery Hub',
        'wait' => 11,
        'capacity' => 110,
        'status' => 'Live Show',
        'tagline' => 'Motion games, light puzzles, team challenges, and badges.',
        'icon' => 'mdi-gamepad-variant',
        'color' => '#22a06b',
        'details' => ['All day', 'All Ages'],
        'image_position' => '84% center',
    ],
];

$activityService = new ActivityService();
$adminActivities = $activityService->all($defaultAttractions);
$attractions = array_map([$activityService, 'toPublicCard'], $activityService->visible($defaultAttractions));

$ticketTypes = [
    'adult' => ['label' => 'Adult Day Pass', 'price' => 48, 'note' => 'Full access to rides, shows, and water zones.'],
    'child' => ['label' => 'Child Day Pass', 'price' => 32, 'note' => 'Designed for kids attractions and family experiences.'],
    'family' => ['label' => 'Family Bundle', 'price' => 145, 'note' => 'Best value for two adults and two children.'],
];

$operations = [
    ['label' => 'Visitors In Park', 'value' => '12,480', 'trend' => '+18%', 'icon' => 'mdi-account-group', 'class' => 'metric-teal'],
    ['label' => 'Tickets Today', 'value' => '3,214', 'trend' => '+9%', 'icon' => 'mdi-ticket-confirmation', 'class' => 'metric-coral'],
    ['label' => 'Avg Wait Time', 'value' => '15m', 'trend' => '-6m', 'icon' => 'mdi-timer-sand', 'class' => 'metric-yellow'],
    ['label' => 'Ride Uptime', 'value' => '98.7%', 'trend' => '+1.2%', 'icon' => 'mdi-cloud-check', 'class' => 'metric-green'],
];

$behaviourMix = [
    ['label' => 'Thrill seekers', 'value' => 42, 'color' => '#ff5a3d'],
    ['label' => 'Family rides', 'value' => 27, 'color' => '#f6b73c'],
    ['label' => 'Water rides', 'value' => 19, 'color' => '#0ea5b7'],
    ['label' => 'Interactive fun', 'value' => 12, 'color' => '#22a06b'],
];

$experienceHighlights = [
    ['title' => 'Smart Discovery', 'copy' => 'Visitors can explore rides by age, mood, wait time, and zone.', 'icon' => 'mdi-compass-outline', 'class' => 'highlight-teal'],
    ['title' => 'Fast Online Tickets', 'copy' => 'A simple reservation flow captures visit dates, groups, and ticket type.', 'icon' => 'mdi-ticket-confirmation', 'class' => 'highlight-coral'],
    ['title' => 'Cloud Operations', 'copy' => 'Park teams can review crowd patterns, ride load, and daily demand.', 'icon' => 'mdi-cloud-check', 'class' => 'highlight-green'],
];

$showSchedule = [
    ['time' => '10:30', 'title' => 'Opening Parade', 'zone' => 'Main Boulevard'],
    ['time' => '13:15', 'title' => 'Lagoon Stunt Splash', 'zone' => 'Lagoon Bay'],
    ['time' => '16:45', 'title' => 'Quest Lab Finale', 'zone' => 'Discovery Hub'],
];

$parkStats = [
    ['label' => 'Park Status', 'value' => 'Open Today', 'icon' => 'mdi-check-circle', 'class' => 'green'],
    ['label' => 'Opening Hours', 'value' => '9:00 AM - 10:00 PM', 'icon' => 'mdi-clock-outline', 'class' => 'navy'],
    ['label' => 'Attractions', 'value' => '40+ Rides', 'icon' => 'mdi-rocket', 'class' => 'navy'],
    ['label' => 'Today Weather', 'value' => '28C', 'icon' => 'mdi-white-balance-sunny', 'class' => 'yellow'],
];

function h($value) {
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function booking_file_path() {
    return dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'bookings.json';
}

function read_bookings() {
    $bookingReportService = new BookingReportService();
    return $bookingReportService->recentBookings();
}
