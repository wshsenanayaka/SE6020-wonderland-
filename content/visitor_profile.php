<?php
require_once dirname(__DIR__) . '/include/data.php';

$basePath = '..';
$pageTitle = 'Wonderland Visitor Profile';
$activePage = 'login';
$dashboardRole = 'visitor';
$dashboardActive = 'overview';
$bookings = read_bookings();
$recentBookings = array_slice(array_reverse($bookings), 0, 4);
$profileName = $_COOKIE['wonderland_profile_name'] ?? 'Visitor';
?>
<!DOCTYPE html>
<html lang="en">
<?php include dirname(__DIR__) . '/include/head.php'; ?>
<body class="admin-page visitor-profile-page" id="top">
<div class="container-scroller">
  <?php include dirname(__DIR__) . '/include/nav.php'; ?>

  <div class="dashboard-shell">
    <?php include dirname(__DIR__) . '/include/dashboard_sidebar.php'; ?>
    <main class="admin-main dashboard-content">
    <section class="admin-hero visitor-profile-hero" id="overview">
      <div>
        <p class="kicker coral">Visitor Profile</p>
        <h1><?php echo h($profileName); ?> Wonderland Visit</h1>
        <p>Review ticket reservations, favourite attractions, and today's park status before arriving.</p>
      </div>
      <a class="btn btn-yellow" href="../index.php#booking">Book More Tickets</a>
    </section>

    <section class="today-grid visitor-profile-grid" id="status">
      <article><strong>4</strong><span>Favourite Rides</span></article>
      <article><strong>2</strong><span>Upcoming Tickets</span></article>
      <article><strong>18 min</strong><span>Average Wait</span></article>
      <article><strong class="open">OPEN</strong><span>Park Status</span></article>
    </section>

    <section class="dashboard-grid">
      <article class="dashboard-panel" id="rides">
        <div class="panel-heading">
          <div>
            <h2>Recommended Attractions</h2>
            <p>Suggested rides based on a balanced family visit.</p>
          </div>
          <i class="mdi mdi-star-circle"></i>
        </div>
        <div class="bar-list">
          <?php foreach ($attractions as $ride): ?>
            <div class="visitor-ride-row">
              <span style="background: <?php echo h($ride['color']); ?>"><i class="mdi <?php echo h($ride['icon']); ?>"></i></span>
              <div>
                <strong><?php echo h($ride['name']); ?></strong>
                <small><?php echo h($ride['zone']); ?> - <?php echo h($ride['wait']); ?> min wait</small>
              </div>
            </div>
          <?php endforeach; ?>
        </div>
      </article>

      <article class="dashboard-panel" id="tickets">
        <div class="panel-heading">
          <div>
            <h2>My Recent Bookings</h2>
            <p>Reservations submitted from the Wonderland booking form.</p>
          </div>
          <i class="mdi mdi-ticket-confirmation"></i>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Ticket</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <?php if (count($recentBookings) === 0): ?>
                <tr><td colspan="4" class="empty-state">No bookings yet.</td></tr>
              <?php endif; ?>
              <?php foreach ($recentBookings as $booking): ?>
                <tr>
                  <td><?php echo h($booking['visit_date'] ?? ''); ?></td>
                  <td><?php echo h($booking['ticket_label'] ?? ''); ?></td>
                  <td><?php echo h($booking['quantity'] ?? ''); ?></td>
                  <td>$<?php echo h($booking['total'] ?? '0'); ?></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      </article>
    </section>
    </main>
  </div>

  <?php include dirname(__DIR__) . '/include/footer.php'; ?>
</div>
</body>
</html>
