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
        'woocommerce',
        'Lookitry Settings',
        'Lookitry',
        'manage_options',
        'lookitry-settings',
        'lookitry_settings_page'
    );
}
// add_action( 'admin_menu', 'lookitry_add_admin_menu' ); // Registered in lookitry_init()

/**
 * Render Settings Page
 */
function lookitry_settings_page() {
    // Save settings if submitted
    if ( isset( $_POST['lookitry_save_settings'] ) ) {
        check_admin_referer( 'lookitry_settings_nonce' );
        
        $api_key = sanitize_text_field( $_POST['lookitry_api_key'] ?? '' );
        $button_text = sanitize_text_field( $_POST['lookitry_button_text'] ?? 'Probar Virtualmente' );
        $button_bg_color = sanitize_hex_color( $_POST['lookitry_button_bg_color'] ?? '#FF5C3A' ) ?: '#FF5C3A';
        $button_text_color = sanitize_hex_color( $_POST['lookitry_button_text_color'] ?? '#FFFFFF' ) ?: '#FFFFFF';
        update_option( 'lookitry_api_key', $api_key );
        update_option( 'lookitry_button_text', $button_text );
        update_option( 'lookitry_button_bg_color', $button_bg_color );
        update_option( 'lookitry_button_text_color', $button_text_color );
        
        echo '<div class="notice notice-success is-dismissible"><p>Ajustes guardados correctamente.</p></div>';
    }

    $api_key = get_option( 'lookitry_api_key', '' );
    $button_text = get_option( 'lookitry_button_text', 'Probar Virtualmente' );
    $button_bg_color = get_option( 'lookitry_button_bg_color', '#FF5C3A' );
    $button_text_color = get_option( 'lookitry_button_text_color', '#FFFFFF' );
    $version = defined('LOOKITRY_PLUGIN_VERSION') ? LOOKITRY_PLUGIN_VERSION : '1.2.5';
    ?>
    <style>
        .lookitry-wrap { 
            max-width: 960px; 
            margin: 30px auto 0 20px; 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        /* Premium Dark Header with Gradient */
        .lookitry-header { 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
            margin-bottom: 30px; 
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
            padding: 24px 28px; 
            border-radius: 16px; 
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.05);
            position: relative;
            overflow: hidden;
        }
        .lookitry-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255,92,58,0.5), transparent);
        }
        .lookitry-header-left { display: flex; align-items: center; gap: 20px; }
        .lookitry-header img { height: 38px; width: auto; object-fit: contain; filter: drop-shadow(0 0 8px rgba(255,255,255,0.1)); }
        .lookitry-header h1 { margin: 0; font-size: 22px; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
        .lookitry-header h1 span { color: #FF5C3A; }
        .lookitry-version { 
            font-size: 11px; 
            background: rgba(255,92,58,0.15); 
            color: #FF5C3A; 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-weight: 600; 
            text-transform: uppercase; 
            border: 1px solid rgba(255,92,58,0.2);
        }
        
        /* Premium Tabs */
        .lookitry-tabs-nav { 
            display: flex; 
            gap: 4px; 
            margin-bottom: 0; 
            padding: 0 4px;
            background: #f1f5f9;
            border-radius: 12px 12px 0 0;
            width: fit-content;
        }
        .lookitry-tab-btn { 
            padding: 14px 28px; 
            background: transparent; 
            border: none; 
            border-radius: 10px 10px 0 0; 
            font-weight: 600; 
            font-size: 13px; 
            color: #64748b; 
            cursor: pointer; 
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .lookitry-tab-btn:hover { 
            color: #334155; 
            background: rgba(255,255,255,0.5);
        }
        .lookitry-tab-btn.active { 
            background: #fff; 
            color: #FF5C3A; 
            box-shadow: 0 -4px 12px -2px rgba(0,0,0,0.08);
        }
        .lookitry-tab-content { 
            background: white; 
            border-radius: 0 16px 16px 16px; 
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08); 
            padding: 32px; 
            border: 1px solid #e2e8f0; 
            min-height: 500px;
        }
        .lookitry-pane { display: none; }
        .lookitry-pane.active { 
            display: block; 
            animation: fadeIn 0.3s ease-out; 
        }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        /* Premium Card Titles */
        .lookitry-card-title { 
            margin-top: 0; 
            font-size: 18px; 
            color: #0f172a; 
            font-weight: 700; 
            margin-bottom: 24px; 
            display: flex; 
            align-items: center; 
            justify-content: space-between;
            padding-bottom: 16px;
            border-bottom: 1px solid #f1f5f9;
        }
        .lookitry-card-title span { display: flex; align-items: center; gap: 10px; }

        /* Premium Stats Grid */
        .lookitry-usage-grid { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 20px; 
            margin-bottom: 32px; 
        }
        .lookitry-stat-box { 
            background: linear-gradient(135deg, #f8fafc 0%, #fff 100%); 
            border: 1px solid #e2e8f0; 
            border-radius: 16px; 
            padding: 24px; 
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        .lookitry-stat-box::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: linear-gradient(180deg, #FF5C3A, #ff8c6b);
            border-radius: 4px 0 0 4px;
        }
        .lookitry-stat-box:hover { 
            border-color: #FF5C3A; 
            transform: translateY(-2px);
            box-shadow: 0 12px 24px -8px rgba(255,92,58,0.15);
        }
        .lookitry-stat-label { 
            font-size: 12px; 
            color: #64748b; 
            text-transform: uppercase; 
            letter-spacing: 1px; 
            margin-bottom: 12px; 
            font-weight: 600; 
        }
        .lookitry-stat-value { 
            font-size: 28px; 
            font-weight: 800; 
            color: #0f172a; 
            letter-spacing: -1px;
        }
        
        .lookitry-brand-preview { display: flex; align-items: center; gap: 16px; }
        .lookitry-brand-logo-circle { 
            width: 52px; 
            height: 52px; 
            background: linear-gradient(135deg, #1e293b, #0f172a); 
            border: 2px solid #334155; 
            border-radius: 14px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            padding: 6px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .lookitry-brand-logo-circle img { 
            max-width: 100%; 
            max-height: 100%; 
            object-fit: contain; 
            filter: brightness(1.1);
        }

        /* Premium Progress Bar */
        .lookitry-progress-container { margin-top: 16px; }
        .lookitry-progress-bar { 
            height: 8px; 
            background: #e2e8f0; 
            border-radius: 10px; 
            overflow: hidden; 
            margin-top: 10px; 
            position: relative; 
        }
        .lookitry-progress-fill { 
            height: 100%; 
            background: linear-gradient(90deg, #FF5C3A, #ff8c6b); 
            border-radius: 10px; 
            transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
        }
        .lookitry-progress-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: shimmer 2s infinite;
        }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }

        /* Premium Field Groups */
        .lookitry-field-group { 
            margin-bottom: 24px; 
            background: #f8fafc; 
            padding: 24px; 
            border-radius: 14px; 
            border: 1px solid #e2e8f0;
            transition: all 0.2s;
        }
        .lookitry-field-group:hover {
            border-color: #cbd5e1;
        }
        .lookitry-field-group label { 
            display: block; 
            font-weight: 600; 
            margin-bottom: 12px; 
            color: #0f172a; 
            font-size: 14px; 
        }
        .lookitry-input-with-btn { display: flex; gap: 12px; }
        .lookitry-input-with-btn input { 
            flex-grow: 1; 
            height: 48px; 
            border-radius: 10px; 
            border: 1px solid #cbd5e1; 
            padding: 0 18px; 
            font-size: 14px; 
            box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.04);
            transition: all 0.2s;
        }
        .lookitry-input-with-btn input:focus { 
            border-color: #FF5C3A; 
            outline: none; 
            box-shadow: 0 0 0 3px rgba(255, 92, 58, 0.1);
        }
        
        /* Premium Badges */
        .lookitry-badge { 
            display: inline-block; 
            padding: 5px 14px; 
            border-radius: 20px; 
            font-size: 11px; 
            font-weight: 700; 
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
        }
        .lookitry-badge-basic { background: #e0f2fe; color: #0369a1; }
        .lookitry-badge-pro { background: linear-gradient(135deg, #fef3c7, #fde68a); color: #92400e; }
        
        /* Premium Buttons */
        .lookitry-btn-primary { 
            background: linear-gradient(135deg, #FF5C3A, #e64a2e) !important; 
            border: none !important; 
            color: white !important; 
            font-weight: 700 !important; 
            cursor: pointer; 
            border-radius: 10px !important; 
            transition: all 0.25s ease; 
            font-size: 14px; 
            box-shadow: 0 4px 12px rgba(255, 92, 58, 0.3);
        }
        .lookitry-btn-primary:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 8px 20px rgba(255, 92, 58, 0.4); 
        }
        .lookitry-btn-dark { 
            background: linear-gradient(135deg, #0f172a, #1e293b) !important; 
            color: white !important; 
            border: none !important; 
            border-radius: 10px !important; 
            transition: all 0.25s ease; 
        }
        .lookitry-btn-dark:hover { 
            background: linear-gradient(135deg, #1e293b, #334155) !important; 
            transform: translateY(-1px);
        }
        
        /* Premium Table */
        .lookitry-table-container { 
            max-height: 500px; 
            overflow-y: auto; 
            border: 1px solid #e2e8f0; 
            border-radius: 14px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        }
        .lookitry-table { width: 100%; border-collapse: collapse; text-align: left; }
        .lookitry-table th { 
            background: linear-gradient(180deg, #f8fafc, #f1f5f9); 
            padding: 16px 18px; 
            border-bottom: 2px solid #e2e8f0; 
            font-weight: 700; 
            color: #475569; 
            font-size: 11px; 
            text-transform: uppercase; 
            position: sticky; 
            top: 0; 
            z-index: 10; 
            letter-spacing: 0.5px;
        }
        .lookitry-table td { 
            padding: 16px 18px; 
            border-bottom: 1px solid #f1f5f9; 
            font-size: 14px; 
            color: #334155; 
            vertical-align: middle; 
        }
        .lookitry-table tr:hover td { 
            background: #fcfdfe; 
        }
        
        /* Premium Notifications */
        #lookitry-notice { 
            position: fixed; 
            bottom: 30px; 
            right: 30px; 
            z-index: 10000; 
            display: none; 
            padding: 16px 24px; 
            border-radius: 12px; 
            color: white; 
            box-shadow: 0 20px 40px -8px rgba(0,0,0,0.3); 
            font-weight: 600; 
            font-size: 14px;
            animation: slideIn 0.3s ease-out;
        }
        @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .lookitry-notice-success { background: linear-gradient(135deg, #10b981, #059669); }
        .lookitry-notice-error { background: linear-gradient(135deg, #ef4444, #dc2626); }
        .lookitry-notice-info { background: linear-gradient(135deg, #3b82f6, #2563eb); }

        /* Connection Status */
        .lookitry-status-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border-radius: 24px;
            font-size: 13px;
            font-weight: 600;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
        }
        .lookitry-status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        .lookitry-status-dot.connected { background: #10b981; box-shadow: 0 0 8px #10b981; }
        .lookitry-status-dot.plan-warning { background: #f59e0b; box-shadow: 0 0 8px #f59e0b; }
        
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        
        /* Plan Upgrade Callout */
        .lookitry-plan-upgrade {
            background: linear-gradient(135deg, #fef3c7, #fde68a);
            border: 1px solid #f59e0b;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .lookitry-plan-upgrade svg {
            width: 40px;
            height: 40px;
            color: #d97706;
            flex-shrink: 0;
        }
        .lookitry-plan-upgrade-content h4 {
            margin: 0 0 4px 0;
            color: #92400e;
            font-size: 16px;
            font-weight: 700;
        }
        .lookitry-plan-upgrade-content p {
            margin: 0;
            color: #a16207;
            font-size: 14px;
        }
        .lookitry-plan-upgrade-content a {
            color: #d97706;
            font-weight: 600;
        }
    </style>

    <div class="lookitry-wrap">
        <div class="lookitry-header">
            <div class="lookitry-header-left">
                <div class="lookitry-logo-wrapper" style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; gap: 15px;">
                    <!-- Logo Incrustado Directamente -->
                    <div style="height: 38px; width: 40px;">
                        <svg id="Capa_1" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 255.95 238.82" style="width: 100%; height: 100%;">
                            <polygon fill="#FF5C3A" points="64.86 4.53 65.09 180.12 140.66 180.12 173.77 234.34 5.78 234.34 5.78 4.53 64.86 4.53"/>
                            <polygon fill="#FFFFFF" points="79.22 164.66 79.22 131.32 185.31 4.64 247.29 4.48 170.77 102.47 253.38 234.34 192.8 234.34 135.92 144.81 121.73 164.66 79.22 164.66"/>
                        </svg>
                    </div>
                    <div style="display: flex; align-items: baseline; font-weight: 800; font-size: 24px; letter-spacing: -1px;">
                        <span style="color: #FFFFFF;">Look</span><span style="color: #FF5C3A;">itry</span>
                    </div>
                </div>
                <span class="lookitry-version" style="margin-left: 10px;">v<?php echo $version; ?></span>
            </div>
            <div id="connection-status-dot" style="display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; color: #64748b; background: rgba(255,255,255,0.05); padding: 8px 15px; border-radius: 99px; border: 1px solid rgba(255,255,255,0.1);">
                <span style="width: 10px; height: 10px; background: #94a3b8; border-radius: 50%;"></span>
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
                    
                    <!-- Plan Upgrade Callout -->
                    <div class="lookitry-plan-upgrade" style="margin-top: 30px; max-width: 400px; margin-left: auto; margin-right: auto;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                        </svg>
                        <div class="lookitry-plan-upgrade-content">
                            <h4>Plugin exclusivo PRO</h4>
                            <p>El probador virtual requiere plan <strong>PRO</strong> o <strong>ENTERPRISE</strong>. <a href="https://lookitry.com/dashboard/subscription" target="_blank">Ver planes</a></p>
                        </div>
                    </div>
                </div>
                
                <div id="status-connected" style="display: none;">
                    <div class="lookitry-card-title"><span>Estado de tu Probador</span></div>
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
                    <div class="lookitry-field-group">
                        <label for="lookitry_button_text">Texto del boton del probador</label>
                        <input name="lookitry_button_text" type="text" id="lookitry_button_text" value="<?php echo esc_attr( $button_text ); ?>" placeholder="Probar Virtualmente" style="width: 100%; height: 48px; border-radius: 10px; border: 1px solid #cbd5e1; padding: 0 18px; font-size: 15px; box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.05);">
                    </div>
                    <div class="lookitry-field-group">
                        <label>Estilo del boton</label>
                        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;">
                            <div>
                                <label for="lookitry_button_bg_color" style="font-size: 12px; color: #475569;">Color de fondo</label>
                                <input name="lookitry_button_bg_color" type="color" id="lookitry_button_bg_color" value="<?php echo esc_attr( $button_bg_color ); ?>" style="width: 100%; height: 48px; border-radius: 10px; border: 1px solid #cbd5e1; padding: 6px;">
                            </div>
                            <div>
                                <label for="lookitry_button_text_color" style="font-size: 12px; color: #475569;">Color del texto</label>
                                <input name="lookitry_button_text_color" type="color" id="lookitry_button_text_color" value="<?php echo esc_attr( $button_text_color ); ?>" style="width: 100%; height: 48px; border-radius: 10px; border: 1px solid #cbd5e1; padding: 6px;">
                            </div>
                        </div>
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
        var telemetryUrl = 'https://api.lookitry.com/api/pruebalo/plugin-telemetry';

        function showNotice(msg, type = 'success') {
            var $n = $('#lookitry-notice');
            $n.removeClass('lookitry-notice-success lookitry-notice-error lookitry-notice-info')
               .addClass('lookitry-notice-' + type)
               .text(msg).fadeIn();
            setTimeout(() => $n.fadeOut(), 5000);
        }

        function sendTelemetry(payload, apiKey) {
            if (!apiKey) return;

            $.ajax({
                url: telemetryUrl,
                method: 'POST',
                headers: { 'x-api-key': apiKey, 'x-store-domain': window.location.origin },
                contentType: 'application/json',
                data: JSON.stringify(payload)
            });
        }

        function requestWithTelemetry(options) {
            var attempt = 0;
            var maxRetries = typeof options.maxRetries === 'number' ? options.maxRetries : 1;

            function run() {
                var startedAt = Date.now();

                $.ajax({
                    url: options.url,
                    method: options.method || 'GET',
                    data: options.data,
                    headers: Object.assign({ 'x-store-domain': window.location.origin }, options.headers || {}),
                    contentType: options.contentType
                }).done(function(res, textStatus, xhr) {
                    sendTelemetry({
                        event_name: 'request_completed',
                        endpoint: options.endpointLabel,
                        success: true,
                        status_code: xhr.status,
                        duration_ms: Date.now() - startedAt,
                        retry_count: attempt,
                        store_domain: window.location.origin,
                        metadata: options.telemetryMetadata || {}
                    }, options.telemetryApiKey ? options.telemetryApiKey() : '');

                    if (options.success) options.success(res, textStatus, xhr);
                    if (options.complete) options.complete(xhr, 'success');
                }).fail(function(xhr, textStatus, errorThrown) {
                    var retryable = attempt < maxRetries && (xhr.status === 0 || xhr.status >= 500);

                    if (retryable) {
                        attempt += 1;
                        setTimeout(run, Math.min(1500, attempt * 400));
                        return;
                    }

                    sendTelemetry({
                        event_name: 'request_failed',
                        endpoint: options.endpointLabel,
                        success: false,
                        status_code: xhr.status || null,
                        duration_ms: Date.now() - startedAt,
                        retry_count: attempt,
                        error_message: errorThrown || textStatus || 'request_failed',
                        store_domain: window.location.origin,
                        metadata: options.telemetryMetadata || {}
                    }, options.telemetryApiKey ? options.telemetryApiKey() : '');

                    if (options.error) options.error(xhr, textStatus, errorThrown);
                    if (options.complete) options.complete(xhr, textStatus || 'error');
                });
            }

            run();
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

            requestWithTelemetry({
                url: 'https://api.lookitry.com/api/pruebalo/validate-api-key',
                method: 'GET',
                endpointLabel: '/api/pruebalo/validate-api-key',
                telemetryApiKey: function() { return key; },
                maxRetries: 1,
                data: { domain: window.location.origin },
                headers: { 'x-api-key': key },
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
                        
                        // Verificar si es error de plan
                        if (res.message && (res.message.includes('PRO') || res.message.includes('plan'))) {
                            $('#connection-status-dot').css('color', '#f59e0b').html('<span style="width: 8px; height: 8px; background: #f59e0b; border-radius: 50%;"></span> Plan requerido');
                            showNotice('El plugin requiere plan PRO o ENTERPRISE. Tu plan actual no es compatible.', 'error');
                            
                            // Show upgrade callout in the unconnected section
                            $('#status-unconnected').append(
                                '<div class="lookitry-plan-upgrade" style="margin-top: 30px; max-width: 400px; margin-left: auto; margin-right: auto;">' +
                                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:40px;height:40px;color:#d97706;">' +
                                '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>' +
                                '</svg>' +
                                '<div class="lookitry-plan-upgrade-content">' +
                                '<h4 style="margin:0 0 4px 0;color:#92400e;font-size:16px;font-weight:700;">Plan no compatible</h4>' +
                                '<p style="margin:0;color:#a16207;font-size:14px;">El probador virtual requiere <strong>PRO</strong> o <strong>ENTERPRISE</strong>. <a href="https://lookitry.com/dashboard/subscription" target="_blank" style="color:#d97706;font-weight:600;">Ver planes</a></p>' +
                                '</div>' +
                                '</div>'
                            );
                        } else {
                            $('#connection-status-dot').css('color', '#ef4444').html('<span style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%;"></span> Error de conexión');
                            if (!silent) showNotice('Error: ' + (res.message || 'Clave inválida'), 'error');
                        }
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
            requestWithTelemetry({
                url: 'https://api.lookitry.com/api/pruebalo/synced-products',
                method: 'GET',
                endpointLabel: '/api/pruebalo/synced-products',
                telemetryApiKey: function() { return key; },
                maxRetries: 1,
                headers: { 'x-api-key': key },
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
        }

        // Load synced list after validation completes (sequential to avoid race condition)
        function loadSyncedListAfterValidation(key) {
            if ( $('#status-connected').is(':visible') ) {
                loadSyncedList(key);
            } else {
                setTimeout(function() { loadSyncedListAfterValidation(key); }, 500);
            }
        }
        
        if (currentKey && $('#status-connected').length) {
            setTimeout(function() { loadSyncedListAfterValidation(currentKey); }, 1000);
        }

        function getProxiedUrl(url) {
            if (!url) return '';
            // Usar el proxy del frontend de Lookitry para evitar bloqueos de CORS/hotlinking.
            // El frontend proxy tiene múltiples User-Agents y fallback redirect al navegador,
            // lo que garantiza que las imágenes de WordPress carguen correctamente.
            return 'https://lookitry.com/api/img-proxy?url=' + encodeURIComponent(url);
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
                            html += '<div style="font-weight: 700; color: #1e293b;"><a href="' + p.permalink + '" target="_blank" style="text-decoration: none; color: inherit; transition: color 0.2s;" onmouseover="this.style.color=\'#FF5C3A\'" onmouseout="this.style.color=\'inherit\'">' + p.name + ' <span style="font-size: 10px; opacity: 0.6; margin-left: 4px;">↗</span></a></div>';
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

            requestWithTelemetry({
                url: 'https://api.lookitry.com/api/pruebalo/sync-woocommerce',
                method: 'POST',
                endpointLabel: '/api/pruebalo/sync-woocommerce',
                telemetryApiKey: function() { return apiKey; },
                maxRetries: 2,
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
// add_action( 'wp_ajax_lookitry_get_catalog', 'lookitry_ajax_get_catalog' ); // Registered in lookitry_init()
function lookitry_ajax_get_catalog() {
    check_ajax_referer( 'lookitry_settings_nonce', 'nonce' );

    if ( ! current_user_can( 'manage_options' ) ) {
        wp_send_json_error( 'No tienes permisos.' );
    }

    $products = wc_get_products( array(
        'status' => 'publish',
        'limit'  => 500, 
    ) );

    $payload = array();
    foreach ( $products as $product ) {
        $image_id  = $product->get_image_id();
        // Forzamos el tamaño 'full' para obtener la imagen original sin procesar por las miniaturas de WP
        $image_url = $image_id ? wp_get_attachment_image_url( $image_id, 'full' ) : '';
        $categories = wp_get_post_terms( $product->get_id(), 'product_cat', array( 'fields' => 'names' ) );
        $category = ! empty( $categories ) ? $categories[0] : 'General';

        $payload[] = array(
            'external_id' => (string) $product->get_id(),
            'name'        => $product->get_name(),
            'description' => substr(strip_tags($product->get_short_description() ?: $product->get_description()), 0, 150),
            'image_url'   => $image_url,
            'price'       => (float) $product->get_price(),
            'category'    => $category,
            'permalink'   => $product->get_permalink()
        );
    }

    wp_send_json_success( $payload );
}
