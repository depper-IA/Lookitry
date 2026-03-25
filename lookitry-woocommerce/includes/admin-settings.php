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
                    $('#lookitry-test-connection').on('click', function(e) {
                        e.preventDefault();
                        var key = $('#lookitry_api_key').val();
                        var $status = $('#lookitry-connection-status');
                        var $button = $(this);

                        if (!key) {
                            $status.html('<div style="color: #d63638; padding: 10px; background: #fef2f2; border-radius: 8px; border: 1px solid #fee2e2; margin-top: 10px;">✘ Por favor ingresa una API Key.</div>').show();
                            return;
                        }

                        $button.prop('disabled', true).text('Conectando...');
                        $status.hide();

                        $.ajax({
                            url: 'https://api.lookitry.com/api/pruebalo/validate-api-key',
                            method: 'GET',
                            data: { key: key },
                            success: function(response) {
                                if (response.valid) {
                                    var usage = response.usage || { current: 0, max: 0, remaining: 0 };
                                    var brandInfo = '<div style="background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; margin-top: 15px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); overflow: hidden;">';
                                    
                                    // Header con Logo y Nombre
                                    brandInfo += '<div style="display: flex; align-items: center; gap: 15px; padding: 15px; border-bottom: 1px solid #f1f5f9;">';
                                    if (response.logo) {
                                        brandInfo += '<img src="' + response.logo + '" style="height: 40px; width: 40px; object-fit: contain; border-radius: 6px; background: #f8fafc; padding: 4px; border: 1px solid #f1f5f9;">';
                                    }
                                    brandInfo += '<div style="flex-grow: 1;">';
                                    brandInfo += '<div style="color: #059669; font-weight: 600; display: flex; align-items: center; gap: 5px; font-size: 14px;"><span style="font-size: 1.2em;">✔</span> Conexión Establecida</div>';
                                    brandInfo += '<div style="font-size: 13px; color: #475569;">Marca: <strong>' + response.brandName + '</strong></div>';
                                    brandInfo += '</div>';
                                    brandInfo += '<div style="text-align: right;">';
                                    brandInfo += '<div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Plan ' + response.plan + '</div>';
                                    brandInfo += '<div style="font-size: 12px; color: #1e293b; font-weight: 500;">' + usage.current + ' / ' + usage.max + ' productos</div>';
                                    brandInfo += '</div>';
                                    brandInfo += '</div>';

                                    // Botón de Acción
                                    brandInfo += '<div style="padding: 15px; background: #f8fafc; display: flex; justify-content: space-between; align-items: center;">';
                                    brandInfo += '<div style="font-size: 12px; color: #64748b;">Selecciona qué productos habilitar en el probador.</div>';
                                    brandInfo += '<button type="button" id="lookitry-load-catalog" class="button button-primary" style="background: #FF5C3A; color: white; border: none; padding: 5px 20px; border-radius: 6px; cursor: pointer; font-weight: 500;">Cargar Catálogo de WP</button>';
                                    brandInfo += '</div>';

                                    // Área de Selección (Oculta inicialmente)
                                    brandInfo += '<div id="lookitry-sync-area" style="display: none; padding: 15px; border-top: 1px solid #f1f5f9; max-height: 400px; overflow-y: auto;">';
                                    brandInfo += '<table class="wp-list-table widefat fixed striped" style="border: none; box-shadow: none;">';
                                    brandInfo += '<thead><tr><td class="manage-column column-cb check-column" style="padding: 8px 10px;"><input type="checkbox" id="lookitry-select-all"></td><th>Producto</th><th>Categoría</th></tr></thead>';
                                    brandInfo += '<tbody id="lookitry-product-list"></tbody>';
                                    brandInfo += '</table>';
                                    brandInfo += '<div style="margin-top: 15px; text-align: right; position: sticky; bottom: 0; background: white; padding-top: 10px; border-top: 1px solid #eee;">';
                                    brandInfo += '<button type="button" id="lookitry-sync-selected" class="button" style="background: #0f172a; color: white; border: none; padding: 8px 20px; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">Sincronizar Seleccionados</button>';
                                    brandInfo += '</div>';
                                    brandInfo += '</div>';

                                    brandInfo += '</div>';
                                    $status.html(brandInfo).show();
                                } else {
                                    $status.html('<div style="color: #d63638; padding: 12px; background: #fef2f2; border-radius: 8px; border: 1px solid #fee2e2; margin-top: 15px;">✘ Error: ' + response.message + '</div>').show();
                                }
                            },
                            error: function() {
                                $status.html('<div style="color: #d63638; padding: 12px; background: #fef2f2; border-radius: 8px; border: 1px solid #fee2e2; margin-top: 15px;">✘ Error de conexión. Revisa que tu servidor permita peticiones a api.lookitry.com</div>').show();
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

/**
 * AJAX Handler: Get Product Catalog
 */
add_action( 'wp_ajax_lookitry_get_catalog', 'lookitry_ajax_get_catalog' );
function lookitry_ajax_get_catalog() {
    check_ajax_referer( 'lookitry_settings_nonce', 'nonce' );

    if ( ! current_user_can( 'manage_options' ) ) {
        wp_send_json_error( 'No tienes permisos suficientes.' );
    }

    if ( ! class_exists( 'WooCommerce' ) ) {
        wp_send_json_error( 'WooCommerce no está activo.' );
    }

    $products = wc_get_products( array(
        'status' => 'publish',
        'limit'  => 100, // Límite razonable por lote
    ) );

    $payload = array();
    foreach ( $products as $product ) {
        $image_id  = $product->get_image_id();
        $image_url = $image_id ? wp_get_attachment_url( $image_id ) : '';
        
        // Obtener categorías
        $categories = wp_get_post_terms( $product->get_id(), 'product_cat', array( 'fields' => 'names' ) );
        $category = ! empty( $categories ) ? $categories[0] : 'General';

        $payload[] = array(
            'external_id' => (string) $product->get_id(),
            'name'        => $product->get_name(),
            'description' => $product->get_short_description() ?: $product->get_description(),
            'image_url'   => $image_url,
            'price'       => $product->get_price(),
            'category'    => $category
        );
    }

    wp_send_json_success( $payload );
}

/**
 * Script for Sync
 */
add_action( 'admin_footer', function() {
    ?>
    <script>
    jQuery(document).ready(function($) {
        var catalogData = [];

        // 1. Cargar Catálogo de WP
        $(document).on('click', '#lookitry-load-catalog', function(e) {
            e.preventDefault();
            var $btn = $(this);
            var $area = $('#lookitry-sync-area');
            var $list = $('#lookitry-product-list');

            $btn.prop('disabled', true).text('Cargando...');

            $.ajax({
                url: ajaxurl,
                method: 'POST',
                data: {
                    action: 'lookitry_get_catalog',
                    nonce: '<?php echo wp_create_nonce( "lookitry_settings_nonce" ); ?>'
                },
                success: function(response) {
                    if (response.success) {
                        catalogData = response.data;
                        var html = '';
                        catalogData.forEach(function(p, i) {
                            html += '<tr>';
                            html += '<td class="check-column" style="padding: 8px 10px;"><input type="checkbox" class="lookitry-prod-check" value="' + i + '"></td>';
                            html += '<td style="display: flex; align-items: center; gap: 10px;">';
                            if (p.image_url) {
                                html += '<img src="' + p.image_url + '" style="height: 32px; width: 32px; object-fit: cover; border-radius: 4px;">';
                            }
                            html += '<strong>' + p.name + '</strong>';
                            html += '</td>';
                            html += '<td>' + p.category + '</td>';
                            html += '</tr>';
                        });
                        $list.html(html);
                        $area.slideDown();
                        $btn.hide();
                    } else {
                        alert('Error: ' + response.data);
                    }
                },
                complete: function() {
                    $btn.prop('disabled', false).text('Cargar Catálogo');
                }
            });
        });

        // 2. Seleccionar Todo
        $(document).on('change', '#lookitry-select-all', function() {
            $('.lookitry-prod-check').prop('checked', $(this).is(':checked'));
        });

        // 3. Sincronizar Seleccionados
        $(document).on('click', '#lookitry-sync-selected', function(e) {
            e.preventDefault();
            var $btn = $(this);
            var apiKey = $('#lookitry_api_key').val();
            var selectedIndices = [];
            
            $('.lookitry-prod-check:checked').each(function() {
                selectedIndices.push($(this).val());
            });

            if (selectedIndices.length === 0) {
                alert('Por favor selecciona al menos un producto.');
                return;
            }

            var productsToSync = selectedIndices.map(function(idx) {
                return catalogData[idx];
            });

            if (!confirm('¿Sincronizar ' + productsToSync.length + ' productos seleccionados?')) {
                return;
            }

            $btn.prop('disabled', true).text('Sincronizando...');

            $.ajax({
                url: 'https://api.lookitry.com/api/pruebalo/sync-woocommerce',
                method: 'POST',
                headers: { 'x-api-key': apiKey },
                contentType: 'application/json',
                data: JSON.stringify({ products: productsToSync }),
                success: function(res) {
                    if (res.success) {
                        alert('✓ Sincronización exitosa:\n- Creados: ' + res.result.created + '\n- Actualizados: ' + res.result.updated);
                        location.reload();
                    } else {
                        alert('Error: ' + res.message);
                    }
                },
                error: function(xhr) {
                    var msg = xhr.responseJSON ? xhr.responseJSON.message : 'Error de red';
                    alert('Error: ' + msg);
                },
                complete: function() {
                    $btn.prop('disabled', false).text('Sincronizar Seleccionados');
                }
            });
        });
    });
    </script>
    <?php
});
