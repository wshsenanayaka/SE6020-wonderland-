<?php
require_once __DIR__ . '/include/data.php';

$basePath = '.';
$pageTitle = 'Wonderland Visitor Registration';
$activePage = 'register';
$hasError = isset($_GET['error']);
?>
<!DOCTYPE html>
<html lang="en">
<?php include __DIR__ . '/include/head.php'; ?>
<body class="login-page register-page" id="top">
<div class="container-scroller">
  <?php include __DIR__ . '/include/nav.php'; ?>

  <main class="login-main">
    <section class="login-hero">
      <div class="login-copy">
        <p class="kicker coral">Visitor Registration</p>
        <h1>Create Your Wonderland Visitor Profile</h1>
        <p>Register as a visitor to manage online ticket bookings, save attraction preferences, and prepare your park visit faster.</p>
        <div class="login-profile-switch">
          <a class="active" href="./register.php"><i class="mdi mdi-account-plus"></i>Visitor Registration</a>
          <a href="./login.php?profile=visitor"><i class="mdi mdi-login"></i>Already Registered</a>
        </div>
      </div>

      <form class="login-card" action="./controller/controller_visitor_register.php" method="post">
        <div class="login-card-head">
          <span><i class="mdi mdi-account-plus"></i></span>
          <div>
            <h2>Visitor Register</h2>
            <p>Create a visitor-only profile for bookings and personalised park planning.</p>
          </div>
        </div>

        <?php if ($hasError): ?>
          <div class="form-alert error"><i class="mdi mdi-alert-circle"></i>Please complete all fields and confirm matching passwords.</div>
        <?php endif; ?>

        <label>
          Full Name
          <input type="text" name="full_name" placeholder="Enter your full name" required>
        </label>
        <label>
          Email Address
          <input type="email" name="email" placeholder="visitor@example.com" required>
        </label>
        <label>
          Contact Number
          <input type="tel" name="contact_number" placeholder="Enter contact number">
        </label>
        <label>
          Password
          <input type="password" name="password" placeholder="Create password" required>
        </label>
        <label>
          Confirm Password
          <input type="password" name="confirm_password" placeholder="Confirm password" required>
        </label>

        <button class="btn btn-coral" type="submit">Create Visitor Profile</button>
      </form>
    </section>
  </main>

  <?php include __DIR__ . '/include/footer.php'; ?>
</div>
</body>
</html>
