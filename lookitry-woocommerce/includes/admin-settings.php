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
    <style>
        .lookitry-wrap { max-width: 900px; margin: 30px auto 0 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif; }
        .lookitry-header { display: flex; align-items: center; gap: 12px; margin-bottom: 25px; }
        .lookitry-header img { height: 32px; }
        .lookitry-header h1 { margin: 0; font-size: 24px; font-weight: 700; color: #1e293b; }
        .lookitry-header span { color: #FF5C3A; }
        
        .lookitry-card { background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); padding: 30px; margin-bottom: 25px; border: 1px solid #e2e8f0; }
        .lookitry-card h2 { margin-top: 0; font-size: 18px; color: #334155; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 20px; }
        
        .lookitry-field-group { margin-bottom: 20px; }
        .lookitry-field-group label { display: block; font-weight: 600; margin-bottom: 8px; color: #475569; }
        .lookitry-input-with-btn { display: flex; gap: 10px; }
        .lookitry-input-with-btn input { flex-grow: 1; height: 40px; border-radius: 6px; border: 1px solid #cbd5e1; padding: 0 12px; font-size: 14px; }
        
        #lookitry-dashboard { display: none; }
        .lookitry-brand-card { background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; padding: 20px; display: flex; align-items: center; gap: 20px; margin-bottom: 25px; position: relative; overflow: hidden; }
        .lookitry-brand-logo-container { width: 70px; height: 70px; background: #0f172a; border-radius: 12px; display: flex; align-items: center; justify-content: center; padding: 10px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .lookitry-brand-logo-container img { max-width: 100%; max-height: 100%; object-fit: contain; }
        
        .lookitry-brand-info h3 { margin: 0 0 5px 0; font-size: 18px; color: #1e293b; }
        .lookitry-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-left: 10px; }
        .lookitry-badge-basic { background: #e0f2fe; color: #0369a1; }
        .lookitry-badge-pro { background: #fef3c7; color: #92400e; }
        
        .lookitry-usage-container { flex-grow: 1; text-align: right; }
        .lookitry-usage-bar { width: 200px; height: 8px; background: #e2e8f0; border-radius: 4px; display: inline-block; overflow: hidden; margin-top: 8px; }
        .lookitry-usage-fill { height: 100%; background: #FF5C3A; border-radius: 4px; transition: width 0.5s ease-out; }
        
        .lookitry-btn-primary { background: #FF5C3A !important; border: none !important; color: white !important; font-weight: 600 !important; cursor: pointer; border-radius: 6px !important; transition: transform 0.1s; }
        .lookitry-btn-primary:active { transform: scale(0.98); }
        .lookitry-btn-dark { background: #0f172a !important; color: white !important; border: none !important; }
        
        .lookitry-sync-area { border-top: 1px solid #f1f5f9; padding-top: 25px; }
        .lookitry-table-container { max-height: 450px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px; }
        .lookitry-table { width: 100%; border-collapse: collapse; text-align: left; }
        .lookitry-table th { background: #f8fafc; padding: 12px 15px; border-bottom: 2px solid #e2e8f0; font-weight: 600; color: #64748b; font-size: 13px; position: sticky; top: 0; z-index: 10; }
        .lookitry-table td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; vertical-align: middle; }
        
        /* Notifications */
        #lookitry-notice { position: fixed; top: 50px; right: 20px; z-index: 10000; display: none; padding: 15px 25px; border-radius: 8px; color: white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-left: 5px solid rgba(0,0,0,0.1); transition: all 0.3s; }
        .lookitry-notice-success { background: #10b981; }
        .lookitry-notice-error { background: #ef4444; }
        .lookitry-notice-info { background: #3b82f6; }
    </style>

    <div class="lookitry-wrap">
        <div class="lookitry-header">
            <img src="<?php echo LOOKITRY_PLUGIN_URL; ?>assets/logo.svg" onerror="this.src='https://pruebalo.wilkiedevs.com/logo.svg'">
            <h1>Lookitry <span>Configuración</span></h1>
        </div>

        <div id="lookitry-notice"></div>

        <form method="post" action="" id="lookitry-settings-form">
            <?php wp_nonce_field( 'lookitry_settings_nonce' ); ?>
            
            <div class="lookitry-card">
                <h2>Conexión y Autenticación</h2>
                <div class="lookitry-field-group">
                    <label for="lookitry_api_key">API Key del Proyecto</label>
                    <div class="lookitry-input-with-btn">
                        <input name="lookitry_api_key" type="password" id="lookitry_api_key" value="<?php echo esc_attr( $api_key ); ?>" placeholder="sk_live_...">
                        <button type="button" id="lookitry-test-connection" class="button lookitry-btn-dark" style="height: 40px; padding: 0 20px;">Re-validar</button>
                    </div>
                    <p class="description">Obtén tu clave en el <a href="https://lookitry.com/dashboard/integrations" target="_blank">Panel de Integraciones</a>.</p>
                </div>
                
                <input type="submit" name="lookitry_save_settings" class="button lookitry-btn-primary" value="Guardar Cambios" style="height: 40px; padding: 0 25px;">
            </div>
        </form>

        <!-- Dashboard Area -->
        <div id="lookitry-dashboard">
            <div class="lookitry-card">
                <h2>Estado de tu Probador</h2>
                
                <div id="lookitry-brand-box" class="lookitry-brand-card">
                    <div class="lookitry-brand-logo-container">
                        <img id="lookitry-logo-img" src="" alt="Brand Logo">
                    </div>
                    <div class="lookitry-brand-info">
                        <h3><span id="lookitry-brand-name">Cargando...</span> <span id="lookitry-plan-badge" class="lookitry-badge">PLAN</span></h3>
                        <div id="lookitry-connection-text" style="color: #059669; font-size: 13px; font-weight: 500;">Conectado a Lookitry Cloud</div>
                    </div>
                    <div class="lookitry-usage-container">
                        <div style="font-size: 13px; color: #64748b;">Cupo de Productos: <strong id="lookitry-usage-text">0/0</strong></div>
                        <div class="lookitry-usage-bar">
                            <div id="lookitry-usage-fill" class="lookitry-usage-fill" style="width: 0%"></div>
                        </div>
                    </div>
                </div>

                <div class="lookitry-sync-area">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="margin: 0; font-size: 16px;">Sincronizador de Catálogo</h3>
                        <button type="button" id="lookitry-load-catalog" class="button" style="background: #f1f5f9; border: 1px solid #e2e8f0; font-weight: 500;">Actualizar Lista de WP</button>
                    </div>
                    
                    <div id="lookitry-sync-loading" style="display: none; text-align: center; padding: 40px;">
                        <span class="spinner is-active" style="float: none; margin: 0 10px 0 0;"></span> Cargando productos de WooCommerce...
                    </div>

                    <div id="lookitry-sync-table-wrap" style="display: none;">
                        <div class="lookitry-table-container">
                            <table class="lookitry-table">
                                <thead>
                                    <tr>
                                        <th style="width: 30px;"><input type="checkbox" id="lookitry-select-all"></th>
                                        <th>Imagen</th>
                                        <th>Producto</th>
                                        <th>Estado en Lookitry</th>
                                    </tr>
                                </thead>
                                <tbody id="lookitry-product-list"></tbody>
                            </table>
                        </div>
                        
                        <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
                            <div id="lookitry-selection-count" style="font-size: 13px; color: #64748b;">0 productos seleccionados</div>
                            <button type="button" id="lookitry-sync-selected" class="button lookitry-btn-primary" style="height: 44px; padding: 0 30px; font-size: 15px;">Sincronizar Seleccionados</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
    jQuery(document).ready(function($) {
        var catalogData = [];
        var currentKey = '<?php echo esc_js($api_key); ?>';

        function showNotice(msg, type = 'success') {
            var $n = $('#lookitry-notice');
            $n.removeClass('lookitry-notice-success lookitry-notice-error lookitry-notice-info')
               .addClass('lookitry-notice-' + type)
               .text(msg).fadeIn();
            setTimeout(() => $n.fadeOut(), 5000);
        }

        function validateConnection(silent = false) {
            var key = $('#lookitry_api_key').val();
            if (!key) return;

            if (!silent) $('#lookitry-test-connection').text('Validando...');

            $.ajax({
                url: 'https://api.lookitry.com/api/pruebalo/validate-api-key',
                method: 'GET',
                data: { key: key },
                success: function(res) {
                    if (res.valid) {
                        $('#lookitry-dashboard').fadeIn();
                        $('#lookitry-brand-name').text(res.brandName);
                        $('#lookitry-plan-badge').text(res.plan).removeClass().addClass('lookitry-badge lookitry-badge-' + res.plan.toLowerCase());
                        
                        var usage = res.usage || { current: 0, max: 0 };
                        $('#lookitry-usage-text').text(usage.current + ' / ' + usage.max);
                        var pct = Math.min(100, (usage.current / usage.max) * 100);
                        $('#lookitry-usage-fill').css('width', pct + '%');

                        // Improved Logo visibility - Choose best variant for dark header
                        var logoToUse = res.logo_light || res.logo || '<?php echo plugins_url("assets/logo.svg", LOOKITRY_PLUGIN_FILE); ?>';
                        $('#lookitry-logo-img').attr('src', logoToUse).css({
                            'max-height': '32px',
                            'width': 'auto',
                            'filter': 'drop-shadow(0 0 1px rgba(255,255,255,0.1))'
                        });

                        if (!silent) showNotice('¡Conexión exitosa con ' + res.brandName + '!');
                    } else {
                        $('#lookitry-dashboard').fadeOut();
                        if (!silent) showNotice('Error: ' + (res.message || 'Clave inválida'), 'error');
                    }
                },
                error: function() {
                    if (!silent) showNotice('No se pudo conectar con la API de Lookitry.', 'error');
                },
                complete: function() {
                    $('#lookitry-test-connection').text('Re-validar');
                }
            });
        }

        // Auto-validate on load
        if (currentKey) {
            validateConnection(true);
        }

        function getProxiedUrl(url) {
            if (!url) return '';
            if (url.indexOf('minio.wilkiedevs.com') !== -1) return url;
            return 'https://api.lookitry.com/api/img-proxy?url=' + encodeURIComponent(url);
        }

        $('#lookitry-test-connection').on('click', function() { validateConnection(false); });

        // Load Catalog AJAX
        $('#lookitry-load-catalog').on('click', function() {
            var $btn = $(this);
            var $loading = $('#lookitry-sync-loading');
            var $tableWrap = $('#lookitry-sync-table-wrap');

            $btn.prop('disabled', true);
            $loading.show();
            $tableWrap.hide();

            $.ajax({
                url: ajaxurl,
                method: 'POST',
                data: {
                    action: 'lookitry_get_catalog',
                    nonce: '<?php echo wp_create_nonce( "lookitry_settings_nonce" ); ?>'
                },
                success: function(res) {
                    if (res.success) {
                        catalogData = res.data;
                        var html = '';
                        catalogData.forEach(function(p, i) {
                            html += '<tr>';
                            html += '<td><input type="checkbox" class="lookitry-item-check" value="' + i + '"></td>';
                            html += '<td>';
                            if (p.image_url) {
                                html += '<img src="' + getProxiedUrl(p.image_url) + '" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid #e2e8f0;">';
                            }
                            html += '</td>';
                            html += '<td>';
                            html += '<div style="font-weight: 600; color: #1e293b;">' + p.name + '</div>';
                            html += '<div style="font-size: 12px; color: #64748b;">ID: ' + p.external_id + ' | Price: COP ' + p.price + '</div>';
                            html += '</td>';
                            html += '<td id="status-' + i + '"><span style="color: #94a3b8; font-style: italic;">Pendiente</span></td>';
                            html += '</tr>';
                        });
                        $('#lookitry-product-list').html(html);
                        $tableWrap.fadeIn();
                        showNotice('Catálogo cargado: ' + catalogData.length + ' productos encontrados.', 'info');
                    }
                },
                complete: function() {
                    $btn.prop('disabled', false);
                    $loading.hide();
                }
            });
        });

        // Checkbox Logic
        $(document).on('change', '#lookitry-select-all', function() {
            $('.lookitry-item-check').prop('checked', $(this).is(':checked')).trigger('change');
        });

        $(document).on('change', '.lookitry-item-check', function() {
            var count = $('.lookitry-item-check:checked').length;
            $('#lookitry-selection-count').text(count + ' productos seleccionados');
        });

        // Sync logic
        $('#lookitry-sync-selected').on('click', function() {
            var selectedIdx = [];
            $('.lookitry-item-check:checked').each(function() { selectedIdx.push($(this).val()); });

            if (selectedIdx.length === 0) {
                showNotice('Selecciona al menos un producto.', 'error');
                return;
            }

            var productsToSync = selectedIdx.map(idx => catalogData[idx]);
            var $btn = $(this);
            var apiKey = $('#lookitry_api_key').val();

            $btn.prop('disabled', true).text('Sincronizando ' + selectedIdx.length + '...');

            $.ajax({
                url: 'https://api.pruebalo.wilkiedevs.com/api/pruebalo/sync-woocommerce',
                method: 'POST',
                headers: { 'x-api-key': apiKey },
                contentType: 'application/json',
                data: JSON.stringify({ products: productsToSync }),
                success: function(res) {
                    if (res.success) {
                        showNotice('Sincronización Exitosa: ' + res.result.created + ' creados, ' + res.result.updated + ' actualizados.');
                        // Update status in table
                        selectedIdx.forEach(idx => {
                            $('#status-' + idx).html('<span style="color: #059669; font-weight: 600;">✓ Ok</span>');
                        });
                        // Re-validate to update usage bar
                        validateConnection(true);
                    } else {
                        showNotice('Error: ' + res.message, 'error');
                    }
                },
                error: function(xhr) {
                    var msg = xhr.responseJSON ? xhr.responseJSON.message : 'Fallo en la sincronización.';
                    showNotice(msg, 'error');
                },
                complete: function() {
                    $btn.prop('disabled', false).text('Sincronizar Seleccionados');
                }
            });
        });
    });
    </script>
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
