<?php
require_once dirname(__DIR__) . '/include/data.php';

$basePath = '..';
$pageTitle = 'Wonderland Admin Dashboard';
$activePage = 'admin';
$dashboardRole = 'admin';
$dashboardActive = 'overview';
$bookings = read_bookings();
$recentBookings = array_slice(array_reverse($bookings), 0, 5);
$activityMessage = $_GET['activity'] ?? '';
?>
<!DOCTYPE html>
<html lang="en">
<?php include dirname(__DIR__) . '/include/head.php'; ?>
<body class="admin-page" id="top">
<div class="container-scroller">
  <?php include dirname(__DIR__) . '/include/nav.php'; ?>

  <div class="dashboard-shell">
    <?php include dirname(__DIR__) . '/include/dashboard_sidebar.php'; ?>
    <main class="admin-main dashboard-content">
    <section class="admin-hero" id="overview">
      <div>
        <p class="kicker">Administrator</p>
        <h1>Real-Time Park Operations</h1>
        <p>Monitor visitor behaviour, attraction load, ticket activity, and ride health from a single command workspace.</p>
      </div>
      <a class="btn btn-primary" href="../index.php#booking"><i class="mdi mdi-ticket-account"></i>Open booking</a>
    </section>

    <section class="dashboard-panel activity-manager" id="manage-activities">
      <div class="panel-heading">
        <div>
          <h2>Manage Activities</h2>
          <p>Create attraction cards for the public web page and control whether each activity is visible.</p>
        </div>
        <i class="mdi mdi-playlist-plus"></i>
      </div>

      <?php if ($activityMessage === 'saved'): ?>
        <div class="form-alert success"><i class="mdi mdi-check-circle"></i>Activity inserted successfully.</div>
      <?php elseif ($activityMessage === 'updated'): ?>
        <div class="form-alert success"><i class="mdi mdi-check-circle"></i>Activity visibility updated.</div>
      <?php elseif ($activityMessage === 'error'): ?>
        <div class="form-alert error"><i class="mdi mdi-alert-circle"></i>Please fill all required activity fields.</div>
      <?php endif; ?>

      <form class="activity-form" action="../controller/controller_activity_manage.php" method="post" enctype="multipart/form-data">
        <input type="hidden" name="action" value="create">
        <div class="form-grid">
          <label>
            Category
            <select name="category" required>
              <option value="Thrill">Thrill</option>
              <option value="Kids">Kids</option>
              <option value="Water">Water</option>
              <option value="Interactive">Interactive</option>
            </select>
          </label>
          <label>
            Ride Type
            <input type="text" name="ride_type" value="Thrill Ride" placeholder="Thrill Ride" required>
          </label>
          <label>
            Activity Name
            <input type="text" name="name" value="Skybolt Hyper Coaster" placeholder="Skybolt Hyper Coaster" required>
          </label>
          <label>
            Duration
            <input type="text" name="duration_label" value="3 min" placeholder="3 min">
          </label>
          <label>
            Requirement
            <input type="text" name="requirement_label" value="Min 140cm" placeholder="Min 140cm">
          </label>
          <label>
            Background Image
            <input type="file" name="background_image" accept=".jpg,.jpeg,.png,.webp">
          </label>
          <label>
            Icon
            <select name="icon">
              <option value="mdi-rocket">Rocket</option>
              <option value="mdi-water">Water</option>
              <option value="mdi-star-circle">Star</option>
              <option value="mdi-gamepad-variant">Gamepad</option>
            </select>
          </label>
          <label>
            Color
            <input type="color" name="color" value="#ee3e50">
          </label>
          <label>
            Zone
            <input type="text" name="zone" value="Summit Zone" placeholder="Summit Zone">
          </label>
          <label>
            Wait Minutes
            <input type="number" name="wait" value="3" min="0">
          </label>
          <label>
            Hourly Capacity
            <input type="number" name="capacity" value="96" min="0">
          </label>
          <label>
            Operating Status
            <input type="text" name="status" value="Operational" placeholder="Operational">
          </label>
        </div>
        <label class="activity-toggle">
          <input type="checkbox" name="is_visible" value="1" checked>
          Visible on public web page
        </label>
        <label>
          Description
          <textarea name="tagline" rows="3" required>High speed launches, skyline drops, and a full-loop finish.</textarea>
        </label>
        <input type="hidden" name="background_image_path" value="assets/images/wonderland-hero.png">
        <button class="btn btn-coral activity-submit" type="submit">Insert Activity</button>
      </form>

      <div class="table-wrap activity-table">
        <table>
          <thead>
            <tr>
              <th>Activity</th>
              <th>Category</th>
              <th>Details</th>
              <th>Visible</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($adminActivities as $activity): ?>
              <?php $publicActivity = $activityService->toPublicCard($activity); ?>
              <tr>
                <td>
                  <div class="activity-row-title">
                    <span style="background: <?php echo h($publicActivity['color']); ?>"><i class="mdi <?php echo h($publicActivity['icon']); ?>"></i></span>
                    <div>
                      <strong><?php echo h($publicActivity['name']); ?></strong>
                      <small><?php echo h($publicActivity['tagline']); ?></small>
                    </div>
                  </div>
                </td>
                <td><?php echo h($publicActivity['category']); ?></td>
                <td><?php echo h($publicActivity['details'][0]); ?> / <?php echo h($publicActivity['details'][1]); ?></td>
                <td><span class="status-pill"><?php echo (int) $publicActivity['is_visible'] === 1 ? 'Enabled' : 'Disabled'; ?></span></td>
                <td>
                  <?php if ((int) ($activity['id'] ?? 0) > 0): ?>
                    <form action="../controller/controller_activity_manage.php" method="post" class="inline-form">
                      <input type="hidden" name="action" value="toggle">
                      <input type="hidden" name="activity_id" value="<?php echo h($activity['id']); ?>">
                      <input type="hidden" name="is_visible" value="<?php echo (int) $publicActivity['is_visible'] === 1 ? 0 : 1; ?>">
                      <button type="submit" class="table-action"><?php echo (int) $publicActivity['is_visible'] === 1 ? 'Disable' : 'Enable'; ?></button>
                    </form>
                  <?php else: ?>
                    <span class="muted-text">Seed Data</span>
                  <?php endif; ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </section>

    <section class="operations-strip admin-metrics" id="operations">
      <?php foreach ($operations as $item): ?>
        <article class="metric-card <?php echo h($item['class']); ?>">
          <div class="metric-icon"><i class="mdi <?php echo h($item['icon']); ?>"></i></div>
          <div>
            <span><?php echo h($item['label']); ?></span>
            <strong><?php echo h($item['value']); ?></strong>
          </div>
          <small><?php echo h($item['trend']); ?></small>
        </article>
      <?php endforeach; ?>
    </section>

    <section class="dashboard-grid" id="reports">
      <article class="dashboard-panel">
        <div class="panel-heading">
          <div>
            <h2>Visitor Behaviour Mix</h2>
            <p>Current discovery and queue interest by attraction category.</p>
          </div>
          <i class="mdi mdi-chart-donut"></i>
        </div>
        <div class="bar-list">
          <?php foreach ($behaviourMix as $mix): ?>
            <div class="bar-row">
              <span><?php echo h($mix['label']); ?></span>
              <div class="bar-track"><span style="width: <?php echo h($mix['value']); ?>%; background: <?php echo h($mix['color']); ?>"></span></div>
              <strong><?php echo h($mix['value']); ?>%</strong>
            </div>
          <?php endforeach; ?>
        </div>
      </article>

      <article class="dashboard-panel">
        <div class="panel-heading">
          <div>
            <h2>Attraction Operations</h2>
            <p>Queue, hourly capacity, and operating status.</p>
          </div>
          <i class="mdi mdi-map-search"></i>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Attraction</th>
                <th>Zone</th>
                <th>Wait</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($attractions as $ride): ?>
                <tr>
                  <td><?php echo h($ride['name']); ?></td>
                  <td><?php echo h($ride['zone']); ?></td>
                  <td><?php echo h($ride['wait']); ?> min</td>
                  <td><span class="status-pill"><?php echo h($ride['status']); ?></span></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      </article>
    </section>

    <section class="ops-map">
      <div class="panel-heading">
        <div>
          <h2>Park Heat Map</h2>
          <p>Zone demand and service focus for the current operating window.</p>
        </div>
        <i class="mdi mdi-map-marker-radius"></i>
      </div>
      <div class="zone-grid">
        <article class="zone-card zone-hot"><span>Summit Zone</span><strong>High</strong><small>Coaster demand rising</small></article>
        <article class="zone-card zone-cool"><span>Lagoon Bay</span><strong>Medium</strong><small>Water rides flowing well</small></article>
        <article class="zone-card zone-warm"><span>Wonder Grove</span><strong>Steady</strong><small>Family traffic balanced</small></article>
        <article class="zone-card zone-live"><span>Discovery Hub</span><strong>Live</strong><small>Show activity active</small></article>
      </div>
    </section>

    <section class="dashboard-panel recent-panel" id="bookings">
      <div class="panel-heading">
        <div>
          <h2>Recent Ticket Reservations</h2>
          <p>Bookings submitted through the visitor form are stored in <code>data/bookings.json</code>.</p>
        </div>
        <i class="mdi mdi-history"></i>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Visitor</th>
              <th>Email</th>
              <th>Date</th>
              <th>Ticket</th>
              <th>Qty</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <?php if (count($recentBookings) === 0): ?>
              <tr><td colspan="6" class="empty-state">No reservations yet.</td></tr>
            <?php endif; ?>
            <?php foreach ($recentBookings as $booking): ?>
              <tr>
                <td><?php echo h($booking['visitor_name'] ?? ''); ?></td>
                <td><?php echo h($booking['email'] ?? ''); ?></td>
                <td><?php echo h($booking['visit_date'] ?? ''); ?></td>
                <td><?php echo h($booking['ticket_label'] ?? ''); ?></td>
                <td><?php echo h($booking['quantity'] ?? ''); ?></td>
                <td>$<?php echo h($booking['total'] ?? '0'); ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </section>
    </main>
  </div>

  <?php include dirname(__DIR__) . '/include/footer.php'; ?>
</div>
</body>
</html>
