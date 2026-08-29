<?php
$pageTitle = $pageTitle ?? 'Wonderland';
$basePath = $basePath ?? '.';
?>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <title><?php echo h($pageTitle); ?></title>
  <link rel="stylesheet" href="<?php echo h($basePath); ?>/assets/vendors/iconfonts/mdi/css/materialdesignicons.min.css">
  <link rel="stylesheet" href="<?php echo h($basePath); ?>/assets/css/style.css">
</head>
