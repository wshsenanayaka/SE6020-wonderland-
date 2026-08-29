<?php
$dashboardRole = $dashboardRole ?? 'visitor';
$dashboardActive = $dashboardActive ?? 'overview';
$profileName = $_COOKIE['wonderland_profile_name'] ?? ($dashboardRole === 'admin' ? 'Administrator' : 'Visitor');

$adminMenu = [
    ['key' => 'overview', 'label' => 'Dashboard', 'icon' => 'mdi-view-dashboard-outline', 'href' => '#overview'],
    ['key' => 'activities', 'label' => 'Manage Activities', 'icon' => 'mdi-playlist-plus', 'href' => '#manage-activities'],
    ['key' => 'operations', 'label' => 'Operations', 'icon' => 'mdi-map-search', 'href' => '#operations'],
    ['key' => 'reports', 'label' => 'Reports', 'icon' => 'mdi-chart-donut', 'href' => '#reports'],
    ['key' => 'bookings', 'label' => 'Bookings', 'icon' => 'mdi-ticket-confirmation', 'href' => '#bookings'],
];

$visitorMenu = [
    ['key' => 'overview', 'label' => 'My Visit', 'icon' => 'mdi-account-circle', 'href' => '#overview'],
    ['key' => 'tickets', 'label' => 'My Tickets', 'icon' => 'mdi-ticket-confirmation', 'href' => '#tickets'],
    ['key' => 'rides', 'label' => 'Recommended Rides', 'icon' => 'mdi-star-circle', 'href' => '#rides'],
    ['key' => 'status', 'label' => 'Park Status', 'icon' => 'mdi-check-circle', 'href' => '#status'],
];

$menuItems = $dashboardRole === 'admin' ? $adminMenu : $visitorMenu;
?>
<aside class="dashboard-sidebar">
  <div class="dashboard-user">
    <span><i class="mdi <?php echo $dashboardRole === 'admin' ? 'mdi-shield-account' : 'mdi-account-heart'; ?>"></i></span>
    <div>
      <strong><?php echo h($profileName); ?></strong>
      <small><?php echo $dashboardRole === 'admin' ? 'Administrator Profile' : 'Visitor Profile'; ?></small>
    </div>
  </div>

  <nav class="dashboard-menu" aria-label="<?php echo $dashboardRole === 'admin' ? 'Administrator' : 'Visitor'; ?> menu">
    <?php foreach ($menuItems as $item): ?>
      <a class="<?php echo $dashboardActive === $item['key'] ? 'active' : ''; ?>" href="<?php echo h($item['href']); ?>">
        <i class="mdi <?php echo h($item['icon']); ?>"></i>
        <span><?php echo h($item['label']); ?></span>
      </a>
    <?php endforeach; ?>
  </nav>

  <div class="dashboard-sidebar-actions">
    <a href="<?php echo h($basePath); ?>/index.php"><i class="mdi mdi-home"></i>Web Home</a>
    <a href="<?php echo h($basePath); ?>/controller/controller_logout.php"><i class="mdi mdi-logout"></i>Logout</a>
  </div>
</aside>
