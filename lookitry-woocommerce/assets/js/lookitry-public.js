/**
 * Lookitry Public JS
 */

(function($) {
    'use strict';

    $(document).ready(function() {
        const $overlay = $('#lookitry-modal-overlay');
        const $close = $('#lookitry-modal-close');
        const $btn = $('.lookitry-tryon-button');
        const $iframe = $('#lookitry-iframe');
        const telemetryUrl = lookitry_vars.api_url + '/pruebalo/plugin-telemetry';
        const storeDomain = lookitry_vars.store_domain || window.location.origin;

        if (!$btn.length) return;

        function sendTelemetry(apiKey, payload) {
            if (!apiKey) return;

            $.ajax({
                url: telemetryUrl,
                method: 'POST',
                headers: {
                    'x-api-key': apiKey,
                    'x-store-domain': storeDomain
                },
                contentType: 'application/json',
                data: JSON.stringify(payload)
            });
        }

        function requestWithTelemetry(options) {
            let attempt = 0;
            const maxRetries = typeof options.maxRetries === 'number' ? options.maxRetries : 1;

            function run() {
                const startedAt = Date.now();

                $.ajax({
                    url: options.url,
                    method: options.method || 'GET',
                    headers: Object.assign({
                        'x-store-domain': storeDomain
                    }, options.headers || {}),
                    data: options.data,
                    contentType: options.contentType
                }).done(function(response, textStatus, xhr) {
                    sendTelemetry(options.apiKey, {
                        event_name: 'request_completed',
                        endpoint: options.endpointLabel,
                        success: true,
                        status_code: xhr.status,
                        duration_ms: Date.now() - startedAt,
                        retry_count: attempt,
                        store_domain: storeDomain,
                        product_external_id: options.productExternalId || null
                    });

                    if (options.success) options.success(response, textStatus, xhr);
                    if (options.complete) options.complete(xhr, 'success');
                }).fail(function(xhr, textStatus, errorThrown) {
                    const retryable = attempt < maxRetries && (xhr.status === 0 || xhr.status >= 500);

                    if (retryable) {
                        attempt += 1;
                        setTimeout(run, Math.min(1500, attempt * 400));
                        return;
                    }

                    sendTelemetry(options.apiKey, {
                        event_name: 'request_failed',
                        endpoint: options.endpointLabel,
                        success: false,
                        status_code: xhr.status || null,
                        duration_ms: Date.now() - startedAt,
                        retry_count: attempt,
                        error_message: errorThrown || textStatus || 'request_failed',
                        store_domain: storeDomain,
                        product_external_id: options.productExternalId || null
                    });

                    if (options.error) options.error(xhr, textStatus, errorThrown);
                    if (options.complete) options.complete(xhr, textStatus || 'error');
                });
            }

            run();
        }

        $btn.on('click', function(e) {
            e.preventDefault();

            const productId = $(this).data('product-id');
            const apiKey = lookitry_vars.session_token || lookitry_vars.api_key;
            const $clickedBtn = $(this);

            if (!apiKey) {
                console.error('Lookitry: API Key o Session Token no configurados.');
                alert('No se pudo abrir el probador. Por favor, contacta al administrador.');
                return;
            }

            const originalText = $clickedBtn.find('span').text();
            $clickedBtn.find('span').text('Cargando probador...');
            $clickedBtn.prop('disabled', true);

            // Show loading overlay with spinner
            $overlay.css('display', 'flex').html(
                '<div class="lookitry-loading-overlay">' +
                '<div class="lookitry-spinner"></div>' +
                '<p>Inicializando probador virtual...</p>' +
                '</div>'
            );

            // Timeout de 15 segundos para cerrar el loading
            var loadingTimeout = setTimeout(function() {
                if ($overlay.find('.lookitry-loading-overlay').length > 0) {
                    showErrorOverlay('Tiempo de espera agotado', 'El probador está tardando más de lo normal. Intenta de nuevo.');
                }
            }, 15000);

            function showErrorOverlay(title, message, showUpgradeLink) {
                clearTimeout(loadingTimeout);
                $overlay.find('.lookitry-loading-overlay').remove();
                $overlay.find('.lookitry-error-overlay').remove();
                
                var upgradeLinkHtml = '';
                if (showUpgradeLink) {
                    upgradeLinkHtml = '<a href="https://lookitry.com/dashboard/subscription" target="_blank" class="lookitry-upgrade-btn">Ver planes disponibles</a>';
                }
                
                $overlay.append(
                    '<div class="lookitry-error-overlay">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                    '<circle cx="12" cy="12" r="10"></circle>' +
                    '<line x1="12" y1="8" x2="12" y2="12"></line>' +
                    '<line x1="12" y1="16" x2="12.01" y2="16"></line>' +
                    '</svg>' +
                    '<h3>' + title + '</h3>' +
                    '<p>' + message + '</p>' +
                    upgradeLinkHtml +
                    '</div>'
                );
                $overlay.css('display', 'flex');
                $clickedBtn.find('span').text(originalText);
                $clickedBtn.prop('disabled', false);
            }

            requestWithTelemetry({
                url: lookitry_vars.api_url + '/embed/wordpress/init',
                method: 'POST',
                endpointLabel: '/api/embed/wordpress/init',
                apiKey: apiKey,
                maxRetries: 2,
                productExternalId: productId.toString(),
                headers: {
                    'x-api-key': apiKey
                },
                data: JSON.stringify({
                    external_id: productId.toString()
                }),
                contentType: 'application/json',
                success: function(response) {
                    clearTimeout(loadingTimeout);
                    if (response.success && response.embedUrl) {
                        // Clear loading overlay and show iframe
                        $overlay.find('.lookitry-loading-overlay').remove();
                        $iframe.attr('src', response.embedUrl);
                        $overlay.css('display', 'flex');
                    } else {
                        // Mostrar error del backend
                        showErrorOverlay('Error al inicializar', response.message || response.error || 'El probador no está disponible en este momento.');
                    }
                },
                error: function(xhr) {
                    let title = 'Error de conexión';
                    let message = 'No se pudo conectar con Lookitry.';
                    let showUpgradeLink = false;
                    
                    // Intentar obtener mensaje del responseJSON
                    var responseMsg = xhr.responseJSON?.message || xhr.responseJSON?.error || '';
                    
                    if (xhr.status === 403 && (responseMsg.includes('PRO') || responseMsg.includes('plan') || responseMsg.includes('ENTERPRISE'))) {
                        title = 'Plan no compatible';
                        message = 'El probador virtual requiere plan PRO o ENTERPRISE.';
                        showUpgradeLink = true;
                    } else if (xhr.status === 403 && responseMsg.includes('image')) {
                        title = 'Imagen no procesable';
                        message = 'La imagen del producto no es compatible. Verifica que sea un formato válido (JPG, PNG).';
                    } else if (xhr.status === 404) {
                        title = 'Producto no encontrado';
                        message = 'Este producto no está sincronizado con Lookitry. Sincronízalo primero desde el panel de administración.';
                    } else if (xhr.status === 401) {
                        title = 'Acceso denegado';
                        message = 'Tu API Key es inválida.';
                    } else if (responseMsg) {
                        title = 'Error de Lookitry';
                        message = responseMsg;
                    } else if (xhr.status === 0) {
                        title = 'Sin conexión';
                        message = 'Verifica tu conexión a internet e intenta de nuevo.';
                    }
                    
                    showErrorOverlay(title, message, showUpgradeLink);
                },
                complete: function() {
                    $clickedBtn.find('span').text(originalText);
                    $clickedBtn.prop('disabled', false);
                }
            });
        });

        $close.on('click', function() {
            $overlay.hide();
            $iframe.attr('src', '');
        });

        $overlay.on('click', function(e) {
            if (e.target === this) {
                $close.trigger('click');
            }
        });

        $(document).on('keydown', function(e) {
            if (e.key === 'Escape' && $overlay.is(':visible')) {
                $close.trigger('click');
            }
        });

        window.addEventListener('message', function(e) {
            if (e.data && e.data.type === 'TRYON_RESIZE') {
                const newHeight = e.data.data.height;
                if (newHeight && window.innerWidth > 600) {
                    const maxH = window.innerHeight * 0.9;
                    const finalHeight = Math.min(newHeight, maxH);
                    $('.lookitry-modal-container').css({
                        'height': finalHeight + 'px',
                        'transition': 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    });
                }
            }
        });
    });

})(jQuery);
