<?php
$activePage = $activePage ?? 'discover';
$profileName = $_COOKIE['wonderland_profile_name'] ?? '';
$profileType = $_COOKIE['wonderland_profile_type'] ?? '';
$isLoggedIn = trim($profileName) !== '';
$profileLink = $profileType === 'admin' ? '/content/admin.php' : '/content/visitor_profile.php';
?>
<nav class="navbar default-layout wonder-nav">
  <a class="brand" href="<?php echo h($basePath); ?>/index.php" aria-label="Wonderland home">
    <i class="mdi mdi-chart-line"></i>
    <strong>Wonder<span>land</span></strong>
  </a>
  <button class="nav-toggle" type="button" aria-label="Toggle navigation" data-nav-toggle>
    <i class="mdi mdi-menu"></i>
  </button>
  <div class="nav-links" data-nav-links>
    <a class="<?php echo $activePage === 'discover' ? 'active' : ''; ?>" href="<?php echo h($basePath); ?>/index.php">Home</a>
    <a href="<?php echo h($basePath); ?>/index.php#attractions">Attractions</a>
    <a href="<?php echo h($basePath); ?>/index.php#tickets">Tickets</a>
    <a href="<?php echo h($basePath); ?>/index.php#status">Park Status</a>
    <a href="<?php echo h($basePath); ?>/content/admin.php">Plan Visit</a>
    <?php if ($isLoggedIn): ?>
      <a class="profile-name" href="<?php echo h($basePath . $profileLink); ?>"><i class="mdi mdi-account-circle"></i><?php echo h($profileName); ?></a>
      <a class="logout-link" href="<?php echo h($basePath); ?>/controller/controller_logout.php">Logout</a>
    <?php else: ?>
      <a class="<?php echo $activePage === 'login' ? 'active' : ''; ?>" href="<?php echo h($basePath); ?>/login.php">Login</a>
      <a class="<?php echo $activePage === 'register' ? 'active' : ''; ?>" href="<?php echo h($basePath); ?>/register.php">Register</a>
    <?php endif; ?>
    <a class="book-link" href="<?php echo h($basePath); ?>/index.php#booking">Book Tickets</a>
  </div>
</nav>
