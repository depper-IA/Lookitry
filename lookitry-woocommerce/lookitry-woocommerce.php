<?php
/**
 * Plugin Name: Lookitry for WooCommerce
 * Plugin URI: https://lookitry.com
 * Description: El probador virtual de Lookitry para tu tienda de WooCommerce.
 * Version: 1.3.0
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
define('LOOKITRY_PLUGIN_VERSION', '1.3.0');
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
