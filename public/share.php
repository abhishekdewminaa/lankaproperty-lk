<?php
/**
 * LankaProperty.lk — Dynamic OpenGraph Link Previewer for WhatsApp, Facebook & Social Bots
 * 
 * Intercepts social media crawler requests (WhatsApp, Facebook, Twitter, Telegram, LinkedIn)
 * and dynamically injects high-resolution OpenGraph meta tags with the property's primary image,
 * title, formatted price, and architectural specifications for large preview card rendering.
 * Humans opening this link are instantly redirected to the full interactive React SPA.
 */

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: public, max-age=300, s-maxage=600'); // 5-minute microcache for bots

$rawSlug = isset($_GET['slug']) ? trim($_GET['slug']) : '';
$decodedSlug = rawurldecode($rawSlug);
// Normalize spaces, underscores, and special characters into hyphens
$normalizedSlug = strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '-', $decodedSlug), '-'));
$slug = !empty($normalizedSlug) ? $normalizedSlug : preg_replace('/[^a-zA-Z0-9\-_]/', '', $rawSlug);

$baseUrl = 'https://lankaproperty.lk';
$fullPropertyUrl = $baseUrl . '/properties/' . $slug;

// Default Fallbacks
$title = 'LankaProperty.lk — Sri Lanka Premier Real Estate Marketplace';
$description = 'Explore verified houses, luxury coastal villas, apartments, and land plots across all 25 districts of Sri Lanka.';
$imageUrl = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85';
$imageWidth = '1200';
$imageHeight = '630';

if (!empty($slug)) {
    // Supabase REST endpoint
    $supabaseUrl = 'https://rnedttrpovxswnraezas.supabase.co';
    $supabaseAnonKey = 'sb_publishable_vBaZKq7pyNXrYxRymTNdkQ_hGPZV6ca';
    
    // Match exact slug, prefix, or listing reference
    $cleanRaw = rawurldecode($rawSlug);
    $apiUrl = $supabaseUrl . '/rest/v1/properties?or=(slug.eq.' . urlencode($slug) . ',slug.ilike.' . urlencode($slug . '%') . ',listing_ref.ilike.*' . urlencode($cleanRaw) . '*)&select=*&limit=1';
    
    $response = null;
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 4);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'LankaProperty-Bot/1.0');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $supabaseAnonKey,
            'Authorization: Bearer ' . $supabaseAnonKey,
            'Accept: application/json'
        ]);
        $response = curl_exec($ch);
        curl_close($ch);
    }
    
    if (!$response) {
        $opts = [
            'http' => [
                'method' => 'GET',
                'header' => [
                    'apikey: ' . $supabaseAnonKey,
                    'Authorization: Bearer ' . $supabaseAnonKey,
                    'Accept: application/json'
                ],
                'timeout' => 3
            ]
        ];
        $context = stream_context_create($opts);
        $response = @file_get_contents($apiUrl, false, $context);
    }
    
    if ($response !== false) {
        $data = json_decode($response, true);
        if (is_array($data) && count($data) > 0) {
            $prop = $data[0];
            
            // Format Property Title
            if (!empty($prop['title'])) {
                $title = $prop['title'] . ' | LankaProperty.lk';
            }
            
            // Format Property Image
            $foundImage = null;
            if (!empty($prop['hero_image'])) {
                $foundImage = $prop['hero_image'];
            } elseif (!empty($prop['images'])) {
                $images = is_string($prop['images']) ? json_decode($prop['images'], true) : $prop['images'];
                if (is_array($images) && count($images) > 0) {
                    $foundImage = $images[0];
                }
            }
            
            if ($foundImage) {
                // Ensure absolute URL
                if (strpos($foundImage, 'http') === 0) {
                    $imageUrl = $foundImage;
                } else {
                    $imageUrl = $baseUrl . (strpos($foundImage, '/') === 0 ? '' : '/') . $foundImage;
                }
            }
            
            // Format Price
            $priceText = 'Price on Application (POA)';
            if (empty($prop['price_on_request']) && !empty($prop['price_lkr']) && $prop['price_lkr'] > 0) {
                $p = $prop['price_lkr'];
                if ($p >= 10000000) {
                    $priceText = 'LKR ' . rtrim(rtrim(number_format($p / 10000000, 2), '0'), '.') . ' Crore';
                } elseif ($p >= 100000) {
                    $priceText = 'LKR ' . rtrim(rtrim(number_format($p / 100000, 2), '0'), '.') . ' Lakhs';
                } else {
                    $priceText = 'LKR ' . number_format($p);
                }
            }
            
            // Format Specs & Description
            $specs = [];
            if (!empty($prop['city'])) $specs[] = $prop['city'];
            if (!empty($prop['district']) && $prop['district'] !== ($prop['city'] ?? '')) $specs[] = $prop['district'];
            if (!empty($prop['bedrooms'])) $specs[] = $prop['bedrooms'] . ' Beds';
            if (!empty($prop['bathrooms'])) $specs[] = $prop['bathrooms'] . ' Baths';
            if (!empty($prop['sqft'])) $specs[] = number_format($prop['sqft']) . ' sq ft';
            if (!empty($prop['land_perches'])) $specs[] = $prop['land_perches'] . ' Perches';
            
            $specStr = implode(' · ', $specs);
            $description = ($specStr ? $specStr . ' | ' : '') . $priceText . ' — Verified Freehold Title on LankaProperty.lk';
            if (!empty($prop['description'])) {
                $cleanDesc = trim(strip_tags($prop['description']));
                if (strlen($cleanDesc) > 20) {
                    $description = substr($cleanDesc, 0, 180) . '... | ' . $priceText;
                }
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?></title>
    <meta name="description" content="<?= htmlspecialchars($description, ENT_QUOTES, 'UTF-8') ?>">
    <link rel="canonical" href="<?= htmlspecialchars($fullPropertyUrl, ENT_QUOTES, 'UTF-8') ?>">

    <!-- OpenGraph (Facebook, WhatsApp, LinkedIn) -->
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="LankaProperty.lk">
    <meta property="og:url" content="<?= htmlspecialchars($fullPropertyUrl, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:title" content="<?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:description" content="<?= htmlspecialchars($description, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:image" content="<?= htmlspecialchars($imageUrl, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:image:secure_url" content="<?= htmlspecialchars($imageUrl, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:image:width" content="<?= $imageWidth ?>">
    <meta property="og:image:height" content="<?= $imageHeight ?>">
    <meta property="og:locale" content="en_LK">

    <!-- Twitter Card (Triggers Large Image Banner on WhatsApp / Twitter / Telegram) -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@LankaPropertyLK">
    <meta name="twitter:title" content="<?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?>">
    <meta name="twitter:description" content="<?= htmlspecialchars($description, ENT_QUOTES, 'UTF-8') ?>">
    <meta name="twitter:image" content="<?= htmlspecialchars($imageUrl, ENT_QUOTES, 'UTF-8') ?>">

    <!-- Immediate Human Client-Side Redirect -->
    <script>
        window.location.replace(<?= json_encode($fullPropertyUrl) ?>);
    </script>
    <meta http-equiv="refresh" content="0;url=<?= htmlspecialchars($fullPropertyUrl, ENT_QUOTES, 'UTF-8') ?>">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FAFBF9; color: #103D2C; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
    <div style="text-align: center; max-width: 480px; padding: 24px;">
        <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">Opening LankaProperty.lk...</h2>
        <p style="font-size: 14px; color: #5F6B63; margin-bottom: 16px;"><?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?></p>
        <a href="<?= htmlspecialchars($fullPropertyUrl, ENT_QUOTES, 'UTF-8') ?>" style="display: inline-block; background: #176B45; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: 600;">Click here if not redirected automatically →</a>
    </div>
</body>
</html>
