<?php
/**
 * Plugin Name: Lookitry for WooCommerce
 * Plugin URI: https://lookitry.com
 * Description: El probador virtual de Lookitry para tu tienda de WooCommerce.
 * Version: 1.3.1
 * Author: Wilkie Devs
 * Author URI: https://wilkiedevs.com
 * License: GPL2
 * Text Domain: lookitry-woo
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

// Defines
define('LOOKITRY_PLUGIN_FILE', __FILE__);
define('LOOKITRY_PLUGIN_VERSION', '1.3.1');
define('LOOKITRY_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('LOOKITRY_PLUGIN_URL', plugin_dir_url(__FILE__));
define('LOOKITRY_API_BASE_URL', 'https://api.lookitry.com/api');

// Includes
require_once LOOKITRY_PLUGIN_DIR . 'includes/admin-settings.php';
require_once LOOKITRY_PLUGIN_DIR . 'includes/frontend-hooks.php';

/**
 * Check if WooCommerce is active
 */
if (class_exists('WooCommerce')) {
    // Initialize plugin logic
    add_action('plugins_loaded', 'lookitry_init');
    // Show admin notice about plan requirement
    add_action('admin_notices', 'lookitry_plan_notice');
}

/**
 * Admin notice about plan requirement
 */
function lookitry_plan_notice() {
    $api_key = get_option('lookitry_api_key', '');
    if (empty($api_key)) return;
    
    $screen = get_current_screen();
    if ($screen && $screen->base !== 'woocommerce_page_lookitry-settings') return;
    
    echo '<div class="lookitry-plan-notice notice notice-info" style="margin: 20px 0; padding: 16px 20px; border-left: 4px solid #FF5C3A; background: linear-gradient(135deg, #fff7ed, #ffedd5); border-radius: 8px;">';
    echo '<div style="display: flex; align-items: center; gap: 16px;">';
    echo '<div style="font-size: 24px;">🎯</div>';
    echo '<div>';
    echo '<h3 style="margin: 0 0 8px 0; color: #9a3412; font-size: 16px;">Plugin exclusivo PRO / ENTERPRISE</h3>';
    echo '<p style="margin: 0; color: #c2410c; font-size: 14px;">El probador virtual requiere un plan activo <strong>PRO</strong> o <strong>ENTERPRISE</strong>. Si tu plan es BASIC o Trial, el plugin no funcionará hasta que hagas upgrade.</p>';
    echo '<p style="margin: 8px 0 0 0;"><a href="https://lookitry.com/dashboard/subscription" target="_blank" style="color: #ea580c; font-weight: 600;">→ Ver planes disponibles</a></p>';
    echo '</div>';
    echo '</div>';
    echo '</div>';
}

/**
 * Cleanup on uninstall
 */
register_uninstall_hook(__FILE__, 'lookitry_uninstall_cleanup');

function lookitry_uninstall_cleanup() {
    delete_option('lookitry_api_key');
    delete_option('lookitry_button_text');
    delete_option('lookitry_button_bg_color');
    delete_option('lookitry_button_text_color');
    delete_transient('lookitry_session_token');
}

function lookitry_init()
{
// Hooks and filters
}
