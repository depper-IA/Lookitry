<?php
/**
 * Lookitry for WooCommerce - Frontend Hooks
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Enqueue scripts and styles
 */
function lookitry_enqueue_scripts() {
    if ( is_product() ) {
        wp_enqueue_style( 'lookitry-public', LOOKITRY_PLUGIN_URL . 'assets/css/lookitry-public.css', array(), '1.0.0' );
        wp_enqueue_script( 'lookitry-public', LOOKITRY_PLUGIN_URL . 'assets/js/lookitry-public.js', array( 'jquery' ), '1.0.0', true );

        // Pass variables to JS
        wp_localize_script( 'lookitry-public', 'lookitry_vars', array(
            'api_url' => LOOKITRY_API_BASE_URL,
            'api_key' => get_option( 'lookitry_api_key', '' )
        ));
    }
}
add_action( 'wp_enqueue_scripts', 'lookitry_enqueue_scripts' );

/**
 * Inject Try-On Button
 */
function lookitry_inject_button() {
    global $product;
    
    if ( ! $product ) return;

    // Get WooCommerce product ID
    $product_id = $product->get_id();
    $api_key = get_option( 'lookitry_api_key', '' );

    if ( empty( $api_key ) ) {
        return; // Don't show if not configured
    }

    echo '<div class="lookitry-tryon-container">';
    echo '<button type="button" class="lookitry-tryon-button" data-product-id="' . esc_attr( $product_id ) . '">';
    echo '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"></path></svg>';
    echo '<span>Probar Virtualmente</span>';
    echo '</button>';
    echo '</div>';
}
add_action( 'woocommerce_after_add_to_cart_button', 'lookitry_inject_button' );

/**
 * Render Modal HTML in Footer
 */
function lookitry_render_modal() {
    if ( ! is_product() ) return;
    ?>
    <div id="lookitry-modal-overlay" class="lookitry-modal-overlay">
        <div class="lookitry-modal-container">
            <button type="button" id="lookitry-modal-close" class="lookitry-modal-close">&times;</button>
            <iframe id="lookitry-iframe" class="lookitry-iframe" src="" allow="camera"></iframe>
        </div>
    </div>
    <?php
}
add_action( 'wp_footer', 'lookitry_render_modal' );
