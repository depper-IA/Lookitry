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
    $version = defined('LOOKITRY_PLUGIN_VERSION') ? LOOKITRY_PLUGIN_VERSION : '1.2.4';
    ?>
    <style>
        .lookitry-wrap { max-width: 900px; margin: 30px auto 0 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif; }
        
        /* New Dark Header */
        .lookitry-header { 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
            margin-bottom: 25px; 
            background: #000; /* Fondo Negro Puro solicitado */
            padding: 20px 25px; 
            border-radius: 12px; 
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .lookitry-header-left { display: flex; align-items: center; gap: 20px; }
        .lookitry-header img { height: 38px; width: auto; object-fit: contain; filter: drop-shadow(0 0 8px rgba(255,255,255,0.1)); }
        .lookitry-header h1 { margin: 0; font-size: 20px; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
        .lookitry-header h1 span { color: #FF5C3A; }
        .lookitry-version { font-size: 10px; background: rgba(255,255,255,0.1); color: #94a3b8; padding: 2px 8px; border-radius: 99px; font-weight: 600; text-transform: uppercase; border: 1px solid rgba(255,255,255,0.1); }
        
        /* Tabs System */
        .lookitry-tabs-nav { display: flex; gap: 8px; margin-bottom: 0; padding: 0 10px; }
        .lookitry-tab-btn { padding: 12px 24px; background: #cbd5e1; border: none; border-radius: 10px 10px 0 0; font-weight: 700; font-size: 13px; color: #475569; cursor: pointer; transition: all 0.2s; }
        .lookitry-tab-btn.active { background: #fff; color: #FF5C3A; border: 1px solid #e2e8f0; border-bottom: 2px solid #fff; margin-bottom: -1px; z-index: 10; padding-bottom: 13px; box-shadow: 0 -4px 6px -1px rgba(0,0,0,0.02); }
        .lookitry-tab-content { background: white; border-radius: 0 12px 12px 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05); padding: 35px; border: 1px solid #e2e8f0; min-height: 450px; }
        .lookitry-pane { display: none; }
        .lookitry-pane.active { display: block; animation: fadeIn 0.3s ease-out; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

        .lookitry-card-title { margin-top: 0; font-size: 19px; color: #0f172a; font-weight: 800; margin-bottom: 25px; display: flex; align-items: center; justify-content: space-between; }
        .lookitry-card-title span { display: flex; align-items: center; gap: 10px; }

        .lookitry-usage-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .lookitry-stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; transition: all 0.2s; }
        .lookitry-stat-box:hover { border-color: #cbd5e1; background: #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .lookitry-stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; font-weight: 700; }
        .lookitry-stat-value { font-size: 26px; font-weight: 900; color: #0f172a; }
        
        .lookitry-brand-preview { display: flex; align-items: center; gap: 18px; }
        .lookitry-brand-logo-circle { width: 54px; height: 54px; background: #fff; border: 2px solid #e2e8f0; border-radius: 12px; display: flex; align-items: center; justify-content: center; padding: 6px; box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.06); }
        .lookitry-brand-logo-circle img { max-width: 100%; max-height: 100%; object-fit: contain; }

        /* Usage Bar */
        .lookitry-progress-container { margin-top: 15px; }
        .lookitry-progress-bar { height: 10px; background: #e2e8f0; border-radius: 20px; overflow: hidden; margin-top: 10px; position: relative; }
        .lookitry-progress-fill { height: 100%; background: linear-gradient(90deg, #FF5C3A, #ff8c6b); border-radius: 20px; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }

        .lookitry-field-group { margin-bottom: 20px; background: #f8fafc; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .lookitry-field-group label { display: block; font-weight: 700; margin-bottom: 12px; color: #0f172a; font-size: 14px; }
        .lookitry-input-with-btn { display: flex; gap: 12px; }
        .lookitry-input-with-btn input { flex-grow: 1; height: 48px; border-radius: 10px; border: 1px solid #cbd5e1; padding: 0 18px; font-size: 15px; box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.05); }
        .lookitry-input-with-btn input:focus { border-color: #FF5C3A; outline: none; box-shadow: 0 0 0 3px rgba(255, 92, 58, 0.1); }
        
        .lookitry-badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .lookitry-badge-basic { background: #e0f2fe; color: #0369a1; }
        .lookitry-badge-pro { background: #fef3c7; color: #92400e; }
        
        .lookitry-btn-primary { background: #FF5C3A !important; border: none !important; color: white !important; font-weight: 700 !important; cursor: pointer; border-radius: 10px !important; transition: all 0.2s; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(255, 92, 58, 0.3); }
        .lookitry-btn-primary:hover { background: #e64a2e !important; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(255, 92, 58, 0.4); }
        .lookitry-btn-dark { background: #0f172a !important; color: white !important; border: none !important; border-radius: 10px !important; transition: all 0.2s; }
        .lookitry-btn-dark:hover { background: #1e293b !important; }
        
        .lookitry-table-container { max-height: 550px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .lookitry-table { width: 100%; border-collapse: collapse; text-align: left; }
        .lookitry-table th { background: #f8fafc; padding: 18px; border-bottom: 2px solid #e2e8f0; font-weight: 800; color: #475569; font-size: 11px; text-transform: uppercase; position: sticky; top: 0; z-index: 10; letter-spacing: 0.5px; }
        .lookitry-table td { padding: 18px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; vertical-align: middle; }
        .lookitry-table tr:hover td { background: #fcfdfe; }
        
        #lookitry-notice { position: fixed; bottom: 30px; right: 30px; z-index: 10000; display: none; padding: 18px 35px; border-radius: 14px; color: white; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); font-weight: 700; font-size: 15px; }
        .lookitry-notice-success { background: #10b981; }
        .lookitry-notice-error { background: #ef4444; }
        .lookitry-notice-info { background: #3b82f6; }
    </style>

    <div class="lookitry-wrap">
        <div class="lookitry-header">
            <div class="lookitry-header-left">
                <div class="lookitry-logo-wrapper" style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; gap: 15px;">
                    <img id="lookitry-main-logo" src="<?php echo LOOKITRY_PLUGIN_URL; ?>assets/logo.svg" alt="Lookitry" style="height: 42px; width: auto; filter: none;">
                    <div style="display: flex; flex-direction: column;">
                        <span style="color: #fff; font-weight: 800; font-size: 18px; line-height: 1.1; letter-spacing: -0.5px;">Lookitry</span>
                        <span style="color: #FF5C3A; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Virtual Try-On</span>
                    </div>
                </div>
                <span class="lookitry-version" style="margin-left: 10px;">v<?php echo $version; ?></span>
            </div>
            <div id="connection-status-dot" style="display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; color: #64748b; background: rgba(255,255,255,0.05); padding: 8px 15px; border-radius: 99px; border: 1px solid rgba(255,255,255,0.1);">
                <span style="width: 10px; height: 10px; background: #94a3b8; border-radius: 50%;"></span> Desconectado
            </div>
        </div>

        <div id="lookitry-notice"></div>

        <div class="lookitry-tabs-nav">
            <button class="lookitry-tab-btn active" data-tab="tab-status">Resumen y Catálogo</button>
            <button class="lookitry-tab-btn" data-tab="tab-config">Conexión API</button>
        </div>

        <div class="lookitry-tab-content">
            <!-- TAB 1: STATUS & SYNC (NUEVO ORDEN PRIORITARIO) -->
            <div id="tab-status" class="lookitry-pane active">
                <div id="status-unconnected" style="text-align: center; padding: 60px 0; background: #f8fafc; border-radius: 15px; border: 2px dashed #e2e8f0;">
                    <div style="font-size: 40px; margin-bottom: 20px;">🛡️</div>
                    <h3 style="margin-top: 0; color: #0f172a;">API no conectada</h3>
                    <p style="color: #64748b; max-width: 300px; margin: 0 auto 25px;">Debes validar tu Clave de API en la pestaña de Conexión para habilitar el catálogo.</p>
                    <button type="button" class="button lookitry-btn-primary" style="height: 48px; padding: 0 30px;" onclick="jQuery('[data-tab=tab-config]').click()">Configurar Ahora</button>
                </div>
                
                <div id="status-connected" style="display: none;">
                    <div class="lookitry-card-title"><span>Resumen de tu Probador</span></div>
                    <div class="lookitry-usage-grid">
                        <div class="lookitry-stat-box">
                            <div class="lookitry-stat-label">Comercio Conectado</div>
                            <div class="lookitry-brand-preview">
                                <div class="lookitry-brand-logo-circle">
                                    <img id="lookitry-stat-logo" src="" alt="">
                                </div>
                                <div>
                                    <div id="lookitry-brand-name" class="lookitry-stat-value" style="font-size: 18px;">Cargando...</div>
                                    <span id="lookitry-plan-badge" class="lookitry-badge">PLAN</span>
                                </div>
                            </div>
                        </div>
                        <div class="lookitry-stat-box">
                            <div class="lookitry-stat-label">Productos en Lookitry</div>
                            <div class="lookitry-stat-value"><span id="usage-current">0</span> / <span id="usage-max">0</span></div>
                            <div class="lookitry-progress-container">
                                <div class="lookitry-progress-bar">
                                    <div id="usage-fill" class="lookitry-progress-fill" style="width: 0%"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Sincronizador de Catálogo (Ahora Siempre Abierto en Tab 1) -->
                    <div id="lookitry-sync-section" style="margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 40px;">
                        <div class="lookitry-card-title">
                            <span>Sincronizador de Catálogo</span>
                            <button type="button" id="lookitry-load-catalog" class="button" style="background: #fff; border: 1px solid #cbd5e1; font-weight: 700; height: 38px; color: #1e293b; border-radius: 8px;">Refrescar productos de WP</button>
                        </div>
                        
                        <div id="lookitry-sync-loading" style="display: none; text-align: center; padding: 40px;">
                            <span class="spinner is-active" style="float: none; margin: 0 10px 0 0;"></span> Procesando catálogo de la tienda...
                        </div>

                        <div id="lookitry-sync-table-wrap">
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
                                    <tbody id="lookitry-product-list">
                                        <!-- Placeholder inicial -->
                                        <tr>
                                            <td colspan="4" style="text-align: center; padding: 40px; color: #94a3b8;">
                                                Pulsa "Refrescar productos" para cargar tu catálogo actual.
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            
                            <div style="margin-top: 25px; display: flex; justify-content: space-between; align-items: center;">
                                <div id="lookitry-selection-count" style="font-size: 14px; color: #475569; font-weight: 700;">0 productos seleccionados</div>
                                <button type="button" id="lookitry-sync-selected" class="button lookitry-btn-primary" style="height: 52px; padding: 0 45px; font-size: 16px;">Sincronizar a Lookitry</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TAB 2: CONFIGURACIÓN API -->
            <div id="tab-config" class="lookitry-pane">
                <div class="lookitry-card-title">Configuración Técnica</div>
                <form method="post" action="" id="lookitry-settings-form">
                    <?php wp_nonce_field( 'lookitry_settings_nonce' ); ?>
                    <div class="lookitry-field-group">
                        <label for="lookitry_api_key">Clave de API Secreta (sk_live)</label>
                        <div class="lookitry-input-with-btn">
                            <input name="lookitry_api_key" type="password" id="lookitry_api_key" value="<?php echo esc_attr( $api_key ); ?>" placeholder="sk_live_...">
                            <button type="button" id="lookitry-test-connection" class="button lookitry-btn-dark" style="height: 48px; padding: 0 25px; font-weight: 700;">Validar Conexión</button>
                        </div>
                        <p class="description" style="margin-top: 15px;">Obtén tu clave en el <a href="https://lookitry.com/dashboard/integrations" target="_blank" style="color: #FF5C3A; font-weight: 600; text-decoration: none;">Panel de Lookitry &rarr;</a></p>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <input type="submit" name="lookitry_save_settings" class="button lookitry-btn-primary" value="Guardar Cambios" style="height: 48px; padding: 0 35px;">
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script>
    jQuery(document).ready(function($) {
        var catalogData = [];
        var syncedIds = [];
        var currentKey = '<?php echo esc_js($api_key); ?>';

        function showNotice(msg, type = 'success') {
            var $n = $('#lookitry-notice');
            $n.removeClass('lookitry-notice-success lookitry-notice-error lookitry-notice-info')
               .addClass('lookitry-notice-' + type)
               .text(msg).fadeIn();
            setTimeout(() => $n.fadeOut(), 5000);
        }

        // Tabs Logic
        $('.lookitry-tab-btn').on('click', function() {
            var tab = $(this).data('tab');
            $('.lookitry-tab-btn').removeClass('active');
            $(this).addClass('active');
            $('.lookitry-pane').removeClass('active');
            $('#' + tab).addClass('active');
        });

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
                        $('#status-unconnected').hide();
                        $('#status-connected').show();
                        $('#lookitry-sync-section').show();
                        
                        // Actualizar solo el logo del resumen de marca, NO el del header de Lookitry
                        if (res.logo_light || res.logo) {
                          $('#lookitry-stat-logo').attr('src', res.logo_light || res.logo);
                        }
                        
                        $('#connection-status-dot').css('color', '#059669').html('<span style="width: 8px; height: 8px; background: #059669; border-radius: 50%;"></span> Conectado: ' + res.brandName);

                        $('#lookitry-brand-name').text(res.brandName);
                        $('#lookitry-plan-badge').text(res.plan).removeClass().addClass('lookitry-badge lookitry-badge-' + res.plan.toLowerCase());
                        
                        var usage = res.usage || { current: 0, max: 0 };
                        $('#usage-current').text(usage.current);
                        $('#usage-max').text(usage.max);
                        var pct = Math.min(100, (usage.current / usage.max) * 100);
                        $('#usage-fill').css('width', pct + '%');

                        if (!silent) {
                            showNotice('¡Conexión validada exitosamente!', 'success');
                            // Load synced products list
                            loadSyncedList(key);
                        }
                    } else {
                        $('#status-connected').hide();
                        $('#status-unconnected').show();
                        $('#lookitry-sync-section').hide();
                        $('#connection-status-dot').css('color', '#ef4444').html('<span style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%;"></span> Error de conexión');
                        if (!silent) showNotice('Error: ' + (res.message || 'Clave inválida'), 'error');
                    }
                },
                error: function() {
                    if (!silent) showNotice('Error de red. Verifica tu servidor.', 'error');
                },
                complete: function() {
                    $('#lookitry-test-connection').text('Re-validar');
                }
            });
        }

        function loadSyncedList(key) {
            $.ajax({
                url: 'https://api.lookitry.com/api/pruebalo/synced-products',
                method: 'GET',
                data: { key: key },
                success: function(res) {
                    if (res.success) {
                        syncedIds = res.syncedIds || [];
                        updateTableStatus();
                    }
                }
            });
        }

        function updateTableStatus() {
            if (!catalogData.length) return;
            catalogData.forEach(function(p, i) {
                var $statusCell = $('#status-' + i);
                if (syncedIds.indexOf(p.external_id) !== -1) {
                    $statusCell.html('<span style="color: #059669; font-weight: 700;">✓ Sincronizado</span>');
                } else {
                    $statusCell.html('<span style="color: #94a3b8; font-style: italic;">Pendiente</span>');
                }
            });
        }

        // Auto-validate on load
        if (currentKey) {
            validateConnection(true);
            loadSyncedList(currentKey);
        }

        function getProxiedUrl(url) {
            return url; // Ya no usamos proxy para miniaturas
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
                                html += '<img src="' + getProxiedUrl(p.image_url) + '" style="width: 44px; height: 44px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0;">';
                            }
                            html += '</td>';
                            html += '<td>';
                            html += '<div style="font-weight: 700; color: #1e293b;">' + p.name + '</div>';
                            html += '<div style="font-size: 11px; color: #64748b;">ID: ' + p.external_id + ' | COP ' + p.price + '</div>';
                            html += '</td>';
                            html += '<td id="status-' + i + '"><span style="color: #94a3b8; font-style: italic;">...</span></td>';
                            html += '</tr>';
                        });
                        $('#lookitry-product-list').html(html);
                        updateTableStatus();
                        $tableWrap.fadeIn();
                        showNotice('Catálogo cargado: ' + catalogData.length + ' productos.', 'info');
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
                showNotice('Por favor, selecciona productos para sincronizar.', 'error');
                return;
            }

            var productsToSync = selectedIdx.map(idx => catalogData[idx]);
            var $btn = $(this);
            var apiKey = $('#lookitry_api_key').val();

            $btn.prop('disabled', true).text('Sincronizando ' + selectedIdx.length + ' productos...');

            $.ajax({
                url: 'https://api.lookitry.com/api/pruebalo/sync-woocommerce',
                method: 'POST',
                headers: { 'x-api-key': apiKey },
                contentType: 'application/json',
                data: JSON.stringify({ products: productsToSync }),
                success: function(res) {
                    if (res.success) {
                        showNotice('¡Sincronización total exitosa!');
                        // Re-fetch synced list for consistency
                        loadSyncedList(apiKey);
                        // Re-validate usage
                        validateConnection(true);
                    } else {
                        showNotice('Error: ' + res.message, 'error');
                    }
                },
                error: function(xhr) {
                    var msg = xhr.responseJSON ? xhr.responseJSON.message : 'Fallo de conexión.';
                    showNotice(msg, 'error');
                },
                complete: function() {
                    $btn.prop('disabled', false).text('Sincronizar a Lookitry');
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
        wp_send_json_error( 'No tienes permisos.' );
    }

    $products = wc_get_products( array(
        'status' => 'publish',
        'limit'  => 60, 
    ) );

    $payload = array();
    foreach ( $products as $product ) {
        $image_id  = $product->get_image_id();
        $image_url = $image_id ? wp_get_attachment_url( $image_id ) : '';
        $categories = wp_get_post_terms( $product->get_id(), 'product_cat', array( 'fields' => 'names' ) );
        $category = ! empty( $categories ) ? $categories[0] : 'General';

        $payload[] = array(
            'external_id' => (string) $product->get_id(),
            'name'        => $product->get_name(),
            'description' => substr(strip_tags($product->get_short_description() ?: $product->get_description()), 0, 150),
            'image_url'   => $image_url,
            'price'       => (float) $product->get_price(),
            'category'    => $category
        );
    }

    wp_send_json_success( $payload );
}
