<?php
require_once __DIR__ . '/include/data.php';

$basePath = '.';
$pageTitle = 'Wonderland Theme Park';
$activePage = 'discover';
$bookingSuccess = isset($_GET['booking']) && $_GET['booking'] === 'success';
?>
<!DOCTYPE html>
<html lang="en">
<?php include __DIR__ . '/include/head.php'; ?>
<body id="top">
<div class="container-scroller">
  <?php include __DIR__ . '/include/nav.php'; ?>

  <main>
    <section class="hero">
      <img src="./assets/images/wonderland-hero.png" alt="Wonderland entrance with rides, water attractions, and digital operations screens">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <span class="hero-badge"><i class="mdi mdi-star-circle"></i>Adventure Starts Here</span>
        <h1>Create Memories. Experience Wonderland.</h1>
        <p>Discover thrilling rollercoasters, exciting water rides, family adventures and interactive attractions for visitors of all ages.</p>
        <div class="hero-actions">
          <a class="btn btn-yellow" href="#attractions">Explore Attractions</a>
          <a class="btn btn-outline" href="#booking">Buy Tickets</a>
        </div>
      </div>
    </section>

    <br>

    <section class="park-status-strip">
      <?php foreach ($parkStats as $stat): ?>
        <article class="park-status-item">
          <span><?php echo h($stat['label']); ?></span>
          <strong class="<?php echo h($stat['class']); ?>"><i class="mdi <?php echo h($stat['icon']); ?>"></i><?php echo h($stat['value']); ?></strong>
        </article>
      <?php endforeach; ?>
    </section>

    <section class="section-wrap" id="attractions">
      <div class="section-heading centered">
        <p class="kicker coral">Explore Wonderland</p>
        <h2>Find Your Next Adventure</h2>
        <p>From high-speed rollercoasters to gentle rides for younger visitors, there is something for everyone at Wonderland.</p>
      </div>

      <div class="filter-bar" role="tablist" aria-label="Attraction filters">
        <button type="button" class="filter-btn active" data-filter="all">All</button>
        <button type="button" class="filter-btn" data-filter="Thrill">Thrill</button>
        <button type="button" class="filter-btn" data-filter="Kids">Kids</button>
        <button type="button" class="filter-btn" data-filter="Water">Water</button>
        <button type="button" class="filter-btn" data-filter="Interactive">Interactive</button>
      </div>

      <div class="attraction-grid">
        <?php foreach ($attractions as $ride): ?>
          <article class="attraction-card" data-category="<?php echo h($ride['category']); ?>">
            <div class="ride-image" style="--ride-color: <?php echo h($ride['color']); ?>; background-image: linear-gradient(rgba(8, 38, 64, 0.06), rgba(8, 38, 64, 0.24)), url('<?php echo h($ride['background_image']); ?>'); background-position: <?php echo h($ride['image_position']); ?>">
              <i class="mdi <?php echo h($ride['icon']); ?>"></i>
            </div>
            <div class="ride-meta">
              <span><?php echo h($ride['ride_type']); ?></span>
            </div>
            <h3><?php echo h($ride['name']); ?></h3>
            <p><?php echo h($ride['tagline']); ?></p>
            <div class="ride-stats">
              <?php foreach ($ride['details'] as $detail): ?>
                <span><i class="mdi mdi-clock-outline"></i><?php echo h($detail); ?></span>
              <?php endforeach; ?>
            </div>
          </article>
        <?php endforeach; ?>
      </div>
    </section>

    <section class="tickets-band" id="tickets">
      <div class="section-heading centered dark">
        <p class="kicker yellow">Tickets</p>
        <h2>Choose Your Adventure</h2>
        <p>Book your Wonderland tickets online and get ready for an unforgettable day.</p>
      </div>
      <div class="ticket-grid">
        <?php foreach ($ticketTypes as $key => $ticket): ?>
          <article class="ticket-card <?php echo $key === 'adult' ? 'featured' : ''; ?>">
            <?php if ($key === 'adult'): ?><span class="popular">Most Popular</span><?php endif; ?>
            <h3><?php echo h($ticket['label']); ?></h3>
            <strong>$<?php echo h($ticket['price']); ?></strong>
            <p><?php echo h($ticket['note']); ?></p>
            <a class="ticket-select" href="#booking">Select Ticket</a>
          </article>
        <?php endforeach; ?>
      </div>
    </section>

    <section class="today-band" id="status">
      <div class="section-heading centered">
        <p class="kicker coral">Live Park Information</p>
        <h2>Wonderland Today</h2>
        <p>Real-time information helps visitors make the most of their day at the park.</p>
      </div>
      <div class="today-grid">
        <article><strong class="open">OPEN</strong><span>Park Status</span></article>
        <article><strong>2,845</strong><span>Visitors Today</span></article>
        <article><strong>38/40</strong><span>Attractions Operating</span></article>
        <article><strong>18 min</strong><span>Average Wait Time</span></article>
      </div>
    </section>

    <section class="booking-band" id="booking">
      <div class="section-heading centered">
        <p class="kicker coral">Online Booking</p>
        <h2>Book Your Wonderland Visit</h2>
        <p>Select your visit date and ticket type to start your Wonderland adventure.</p>
      </div>

      <?php if ($bookingSuccess): ?>
        <div class="success-alert"><i class="mdi mdi-check-circle-outline"></i>Your booking request has been captured successfully.</div>
      <?php endif; ?>

      <form class="booking-form" action="./controller/controller_book_ticket.php" method="post" data-booking-form>
        <div class="form-grid">
          <label>
            Full Name
            <input type="text" name="visitor_name" placeholder="Enter your name" required>
          </label>
          <label>
            Email Address
            <input type="email" name="email" placeholder="name@example.com" required>
          </label>
          <label>
            Visit Date
            <input type="date" name="visit_date" required>
          </label>
          <label>
            Ticket Type
            <select name="ticket_type" data-ticket-type>
              <?php foreach ($ticketTypes as $key => $ticket): ?>
                <option value="<?php echo h($key); ?>" data-price="<?php echo h($ticket['price']); ?>"><?php echo h($ticket['label']); ?> - $<?php echo h($ticket['price']); ?></option>
              <?php endforeach; ?>
            </select>
          </label>
          <label>
            Quantity
            <input type="number" name="quantity" min="1" max="20" value="1" data-quantity required>
          </label>
          <label>
            Contact Number
            <input type="tel" name="contact_number" placeholder="Enter contact number">
          </label>
        </div>
        <div class="booking-summary">
          <div>
            <span>Estimated Total</span>
            <strong data-total>$48</strong>
          </div>
          <button class="btn btn-coral" type="submit">Continue to Booking</button>
        </div>
      </form>
    </section>
  </main>

  <?php include __DIR__ . '/include/footer.php'; ?>
</div>
</body>
</html>
