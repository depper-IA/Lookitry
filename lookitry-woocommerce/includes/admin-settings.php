<?php
/**
 * Lookitry for WooCommerce - Admin Settings
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Add Menu Item to WordPress Admin
 */
function lookitry_add_admin_menu() {
    add_submenu_page(
        'woocommerce', // Parent slug
        'Lookitry Web App Settings', // Page title
        'Lookitry Web App', // Menu title
        'manage_options', // Capability
        'lookitry-settings', // Menu slug
        'lookitry_settings_page' // Callback
    );
}
add_action( 'admin_menu', 'lookitry_add_admin_menu' );

/**
 * Render Settings Page
 */
function lookitry_settings_page() {
    // Save settings if submitted
    if ( isset( $_POST['lookitry_save_settings'] ) ) {
        check_admin_referer( 'lookitry_settings_nonce' );
        
        $api_key = sanitize_text_field( $_POST['lookitry_api_key'] ?? '' );
        update_option( 'lookitry_api_key', $api_key );
        
        echo '<div class="notice notice-success is-dismissible"><p>Ajustes guardados correctamente.</p></div>';
    }

    $api_key = get_option( 'lookitry_api_key', '' );
    ?>
    <div class="wrap" style="max-width: 800px; margin-top: 30px;">
        <h1 style="display: flex; align-items: center; gap: 10px;">
            <img src="<?php echo LOOKITRY_PLUGIN_URL; ?>assets/logo.svg" style="height: 32px;" onerror="this.style.display='none'">
            Lookitry <span>Configuración</span>
        </h1>
        
        <form method="post" action="">
            <?php wp_nonce_field( 'lookitry_settings_nonce' ); ?>
            
            <div class="card" style="margin-top: 20px; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <h2 style="margin-top: 0;">Conexión con Lookitry</h2>
                <p>Ingresa tu API Key para activar el probador virtual en tu tienda.</p>
                
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="lookitry_api_key">API Key</label>
                        </th>
                        <td>
                            <div style="display: flex; gap: 10px; align-items: start;">
                                <div style="flex-grow: 1;">
                                    <input name="lookitry_api_key" type="password" id="lookitry_api_key" value="<?php echo esc_attr( $api_key ); ?>" class="regular-text" style="width: 100%;">
                                    <p class="description">Puedes encontrar tu API Key en tu <a href="https://lookitry.com/dashboard/integrations" target="_blank">Dashboard de Lookitry</a>.</p>
                                </div>
                                <button type="button" id="lookitry-test-connection" class="button" style="height: 30px; background: #f6f7f7;">Probar Conexión</button>
                            </div>
                            <div id="lookitry-connection-status" style="margin-top: 10px; font-weight: 500; font-size: 13px; display: none;"></div>
                        </td>
                    </tr>
                </table>

                <script>
                jQuery(document).ready(function($) {
                    $('#lookitry-test-connection').on('click', function() {
                        var key = $('#lookitry_api_key').val();
                        var $status = $('#lookitry-connection-status');
                        var $button = $(this);

                        if (!key) {
                            $status.html('<span style="color: #d63638;">Debes ingresar una clave de API primero.</span>').show();
                            return;
                        }

                        $button.prop('disabled', true).text('Probando...');
                        $status.hide();

                        $.ajax({
                            url: 'https://api.lookitry.com/api/pruebalo/validate-api-key',
                            method: 'GET',
                            contentType: 'application/json',
                            data: { key: key },
                            success: function(response) {
                                if (response.valid) {
                                    $status.html('<span style="color: #008a20; padding: 6px 12px; background: #e7f6ed; border-radius: 6px; display: inline-block;">✔ Conexión exitosa: <strong>' + response.brandName + '</strong> (' + response.plan + ')</span>').show();
                                } else {
                                    $status.html('<span style="color: #d63638; padding: 6px 12px; background: #fcf0f1; border-radius: 6px; display: inline-block;">✘ Error: ' + response.message + '</span>').show();
                                }
                            },
                            error: function() {
                                $status.html('<span style="color: #d63638; padding: 6px 12px; background: #fcf0f1; border-radius: 6px; display: inline-block;">✘ Error de conexión con el servidor. Revisa tu internet o la URL de la API.</span>').show();
                            },
                            complete: function() {
                                $button.prop('disabled', false).text('Probar Conexión');
                            }
                        });
                    });
                });
                </script>

                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p><strong>Guía rápida:</strong></p>
                    <ol>
                        <li>Escribe tu <strong>API Key</strong> arriba.</li>
                        <li>En Lookitry, asegúrate de que cada producto tenga su <strong>ID Externo</strong> (ID de Producto de WooCommerce).</li>
                        <li>El botón de "Probar" aparecerá automáticamente en las páginas de producto.</li>
                    </ol>
                </div>

                <p class="submit">
                    <input type="submit" name="lookitry_save_settings" id="submit" class="button button-primary" value="Guardar Cambios" style="background: #FF5C3A; border-color: #FF5C3A; height: 40px; padding: 0 25px;">
                </p>
            </div>
        </form>

        <div style="margin-top: 40px; text-align: center; color: #777; font-size: 13px;">
            <p>Desarrollado con ❤️ por <a href="https://wilkiedevs.com" target="_blank" style="color: #FF5C3A; text-decoration: none;">Wilkie Devs</a></p>
        </div>
    </div>
    <?php
}
