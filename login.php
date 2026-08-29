<?php
require_once __DIR__ . '/include/data.php';

$basePath = '.';
$pageTitle = 'Wonderland Login';
$activePage = 'login';
$profile = $_GET['profile'] ?? 'visitor';
$isAdmin = $profile === 'admin';
$hasError = isset($_GET['error']);
$registered = isset($_GET['registered']);
?>
<!DOCTYPE html>
<html lang="en">
<?php include __DIR__ . '/include/head.php'; ?>
<body class="login-page" id="top">
<div class="container-scroller">
  <?php include __DIR__ . '/include/nav.php'; ?>

  <main class="login-main">
    <section class="login-hero">
      <div class="login-copy">
        <p class="kicker coral">Profile Login</p>
        <h1>Welcome Back To Wonderland</h1>
        <p>Sign in as a visitor to manage tickets and favourites, or enter the administrator profile for park operations visibility.</p>
        <div class="login-profile-switch">
          <a class="<?php echo !$isAdmin ? 'active' : ''; ?>" href="./login.php?profile=visitor"><i class="mdi mdi-account-heart"></i>Visitor Profile</a>
          <a class="<?php echo $isAdmin ? 'active' : ''; ?>" href="./login.php?profile=admin"><i class="mdi mdi-shield-account"></i>Administrator Profile</a>
        </div>
      </div>

      <form class="login-card" action="./controller/controller_profile_login.php" method="post">
        <input type="hidden" name="profile_type" value="<?php echo $isAdmin ? 'admin' : 'visitor'; ?>">
        <div class="login-card-head">
          <span><i class="mdi <?php echo $isAdmin ? 'mdi-shield-account' : 'mdi-account-heart'; ?>"></i></span>
          <div>
            <h2><?php echo $isAdmin ? 'Administrator Login' : 'Visitor Login'; ?></h2>
            <p><?php echo $isAdmin ? 'Access live dashboards and park operation tools.' : 'View your bookings, visit plan, and ride preferences.'; ?></p>
          </div>
        </div>

        <?php if ($registered): ?>
          <div class="form-alert success"><i class="mdi mdi-check-circle"></i>Registration completed. Please login.</div>
        <?php endif; ?>
        <?php if ($hasError): ?>
          <div class="form-alert error"><i class="mdi mdi-alert-circle"></i>Invalid login details.</div>
        <?php endif; ?>

        <label>
          Email Address
          <input type="email" name="email" placeholder="<?php echo $isAdmin ? 'admin@wonderland.com' : 'visitor@example.com'; ?>" required>
        </label>
        <label>
          Password
          <input type="password" name="password" placeholder="Enter password" required>
        </label>

        <button class="btn btn-coral" type="submit"><?php echo $isAdmin ? 'Login as Administrator' : 'Login as Visitor'; ?></button>
        <?php if (!$isAdmin): ?>
          <p class="login-note">New visitor? <a href="./register.php">Create a visitor account</a></p>
        <?php else: ?>
          <p class="login-note">Administrator login checks the database when configured.</p>
        <?php endif; ?>
      </form>
    </section>
  </main>

  <?php include __DIR__ . '/include/footer.php'; ?>
</div>
</body>
</html>
