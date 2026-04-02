/**
 * Lookitry Public JS
 */

(function($) {
    'use strict';

    $(document).ready(function() {
        const $overlay = $('#lookitry-modal-overlay');
        const $close = $('#lookitry-modal-close');
        const $modalBody = $('#lookitry-modal-body');
        const $modalContainer = $overlay.find('.lookitry-modal-container');
        const telemetryUrl = lookitry_vars.api_url + '/pruebalo/plugin-telemetry';
        const storeDomain = lookitry_vars.store_domain || window.location.origin;
        const buttonText = lookitry_vars.button_text || 'Probar Virtualmente';
        const widgetScriptFallbackUrl = 'https://lookitry.com/widget.js';

        function escapeHtml(value) {
            return $('<div>').text(value || '').html();
        }

        function getProductId() {
            let productId = $('form.cart input[name="add-to-cart"]').first().val();

            if (!productId) {
                productId = $('.single_add_to_cart_button[name="add-to-cart"]').first().val();
            }

            if (!productId) {
                productId = $('.single_add_to_cart_button').first().data('product_id');
            }

            if (!productId) {
                productId = $('.product').first().data('product_id');
            }

            return productId ? String(productId).trim() : '';
        }

        function getButtonMarkup(productId) {
            return '' +
                '<div class="lookitry-tryon-container lookitry-tryon-container--fallback">' +
                    '<button type="button" class="lookitry-tryon-button" data-product-id="' + escapeHtml(productId) + '">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"></path></svg>' +
                        '<span>' + escapeHtml(buttonText) + '</span>' +
                    '</button>' +
                '</div>';
        }

        function syncExistingButtonId() {
            const productId = getProductId();

            if (productId) {
                $('.lookitry-tryon-button').attr('data-product-id', productId);
            }
        }

        function ensureTryOnButton() {
            syncExistingButtonId();

            if ($('.lookitry-tryon-button').length) {
                return;
            }

            const productId = getProductId();

            if (!productId) {
                return;
            }

            const buttonMarkup = getButtonMarkup(productId);
            const $cartForm = $('form.cart').last();

            if ($cartForm.length) {
                $cartForm.after(buttonMarkup);
                return;
            }

            const $summary = $('.product .summary, .product .entry-summary, .entry-summary').first();

            if ($summary.length) {
                const $addToCart = $summary.find('.single_add_to_cart_button').last();

                if ($addToCart.length) {
                    $addToCart.closest('form, .cart').after(buttonMarkup);
                } else {
                    $summary.append(buttonMarkup);
                }
            }
        }

        function ensureWidgetScript(scriptUrl) {
            const finalUrl = scriptUrl || widgetScriptFallbackUrl;

            if (window.LookitryWidget && typeof window.LookitryWidget.init === 'function') {
                return Promise.resolve(window.LookitryWidget);
            }

            return new Promise(function(resolve, reject) {
                const existing = document.querySelector('script[data-lookitry-widget-loader="true"]');

                if (existing) {
                    existing.addEventListener('load', function() {
                        resolve(window.LookitryWidget);
                    }, { once: true });
                    existing.addEventListener('error', reject, { once: true });
                    return;
                }

                const script = document.createElement('script');
                script.src = finalUrl;
                script.async = true;
                script.defer = true;
                script.dataset.lookitryWidgetLoader = 'true';
                script.onload = function() {
                    if (window.LookitryWidget && typeof window.LookitryWidget.init === 'function') {
                        resolve(window.LookitryWidget);
                    } else {
                        reject(new Error('Widget loader not available'));
                    }
                };
                script.onerror = function() {
                    reject(new Error('Widget script failed to load'));
                };
                document.head.appendChild(script);
            });
        }

        function renderWidgetInModal(widgetOptions) {
            const brandSlug = widgetOptions.brandSlug;
            const productId = widgetOptions.productId;

            if (!brandSlug || !productId) {
                throw new Error('Missing widget configuration');
            }

            $modalBody.empty();

            const container = document.createElement('div');
            container.id = 'lookitry-tester-container';
            container.setAttribute('data-lookitry-widget', 'true');
            container.setAttribute('data-slug', brandSlug);
            container.setAttribute('data-product-id', productId);
            container.setAttribute('data-modal', 'true');
            container.setAttribute('data-hide-legal', 'true');
            container.setAttribute('data-height', String(Math.max(680, $modalContainer.innerHeight() || 760)));
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            $modalBody.append(container);

            window.LookitryWidget.init(container);
        }

        function showOverlayState(type, title, message, showUpgradeLink) {
            $overlay.find('.lookitry-loading-overlay, .lookitry-error-overlay').remove();

            if (type === 'loading') {
                $modalBody.empty();
                $modalContainer.append(
                    '<div class="lookitry-loading-overlay">' +
                        '<div class="lookitry-spinner"></div>' +
                        '<p>Inicializando probador virtual...</p>' +
                    '</div>'
                );
                $overlay.css('display', 'flex');
                return;
            }

            let upgradeLinkHtml = '';
            if (showUpgradeLink) {
                upgradeLinkHtml = '<a href="https://lookitry.com/plugin-woocommerce/activar" target="_blank" class="lookitry-upgrade-btn">Ver planes disponibles</a>';
            }

            $modalBody.empty();
            $modalContainer.append(
                '<div class="lookitry-error-overlay">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                        '<circle cx="12" cy="12" r="10"></circle>' +
                        '<line x1="12" y1="8" x2="12" y2="12"></line>' +
                        '<line x1="12" y1="16" x2="12.01" y2="16"></line>' +
                    '</svg>' +
                    '<h3>' + escapeHtml(title) + '</h3>' +
                    '<p>' + escapeHtml(message) + '</p>' +
                    upgradeLinkHtml +
                '</div>'
            );
            $overlay.css('display', 'flex');
        }

        function resetOverlay() {
            $overlay.find('.lookitry-loading-overlay, .lookitry-error-overlay').remove();
            $modalBody.empty();
            $overlay.hide();
        }

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

        ensureTryOnButton();
        setTimeout(ensureTryOnButton, 500);
        $(document.body).on('updated_wc_div wc_fragments_loaded found_variation reset_data', ensureTryOnButton);

        $(document).on('click', '.lookitry-tryon-button', function(e) {
            e.preventDefault();

            const $clickedBtn = $(this);
            const productId = String($clickedBtn.data('product-id') || getProductId()).trim();
            const apiKey = lookitry_vars.session_token;

            if (!productId) {
                alert('No se pudo identificar este producto para abrir el probador.');
                return;
            }

            if (!apiKey) {
                console.error('Lookitry: Session token no configurado.');
                alert('No se pudo abrir el probador. Por favor, contacta al administrador.');
                return;
            }

            const originalText = $clickedBtn.find('span').text();
            $clickedBtn.find('span').text('Cargando probador...');
            $clickedBtn.prop('disabled', true);
            showOverlayState('loading');

            const loadingTimeout = setTimeout(function() {
                if ($overlay.find('.lookitry-loading-overlay').length > 0) {
                    showOverlayState('error', 'Tiempo de espera agotado', 'El probador esta tardando mas de lo normal. Intenta de nuevo.', false);
                }
            }, 15000);

            function showRequestError(title, message, showUpgradeLink) {
                clearTimeout(loadingTimeout);
                showOverlayState('error', title, message, showUpgradeLink);
                $clickedBtn.find('span').text(originalText);
                $clickedBtn.prop('disabled', false);
            }

            requestWithTelemetry({
                url: lookitry_vars.api_url + '/embed/wordpress/init',
                method: 'POST',
                endpointLabel: '/api/embed/wordpress/init',
                apiKey: apiKey,
                maxRetries: 2,
                productExternalId: productId,
                headers: {
                    'x-api-key': apiKey
                },
                data: JSON.stringify({
                    external_id: productId
                }),
                contentType: 'application/json',
                success: function(response) {
                    clearTimeout(loadingTimeout);

                    if (response.success && response.embedUrl) {
                        const widgetUrl = response.widgetUrl || widgetScriptFallbackUrl;
                        const brandSlug = response.brandSlug || (function() {
                            try {
                                const parsed = new URL(response.embedUrl);
                                const segments = parsed.pathname.split('/').filter(Boolean);
                                return segments[1] || '';
                            } catch (error) {
                                return '';
                            }
                        })();
                        const lookitryProductId = response.product && response.product.id ? String(response.product.id) : '';

                        ensureWidgetScript(widgetUrl)
                            .then(function() {
                                $overlay.find('.lookitry-loading-overlay, .lookitry-error-overlay').remove();
                                renderWidgetInModal({
                                    brandSlug: brandSlug,
                                    productId: lookitryProductId
                                });
                                $overlay.css('display', 'flex');
                            })
                            .catch(function() {
                                showRequestError('Error al cargar el widget', 'No se pudo inicializar el loader del probador.', false);
                            });
                    } else {
                        showRequestError('Error al inicializar', response.message || response.error || 'El probador no esta disponible en este momento.', false);
                    }
                },
                error: function(xhr) {
                    let title = 'Error de conexion';
                    let message = 'No se pudo conectar con Lookitry.';
                    let showUpgradeLink = false;

                    const responseMsg = xhr.responseJSON?.message || xhr.responseJSON?.error || '';

                    if (xhr.status === 403 && (responseMsg.includes('PRO') || responseMsg.includes('plan') || responseMsg.includes('ENTERPRISE'))) {
                        title = 'Plan no compatible';
                        message = 'El probador virtual requiere plan PRO o ENTERPRISE.';
                        showUpgradeLink = true;
                    } else if (xhr.status === 403 && responseMsg.includes('image')) {
                        title = 'Imagen no procesable';
                        message = 'La imagen del producto no es compatible. Verifica que sea un formato valido.';
                    } else if (xhr.status === 404) {
                        title = 'Producto no encontrado';
                        message = 'Este producto no esta sincronizado con Lookitry. Sincronizalo primero desde el panel de administracion.';
                    } else if (xhr.status === 401) {
                        title = 'Acceso denegado';
                        message = 'Tu API Key es invalida.';
                    } else if (responseMsg) {
                        title = 'Error de Lookitry';
                        message = responseMsg;
                    } else if (xhr.status === 0) {
                        title = 'Sin conexion';
                        message = 'Verifica tu conexion a internet e intenta de nuevo.';
                    }

                    showRequestError(title, message, showUpgradeLink);
                },
                complete: function() {
                    $clickedBtn.find('span').text(originalText);
                    $clickedBtn.prop('disabled', false);
                }
            });
        });

        $close.on('click', function() {
            resetOverlay();
        });

        $overlay.on('click', function(e) {
            if (e.target === this) {
                resetOverlay();
            }
        });

        $(document).on('keydown', function(e) {
            if (e.key === 'Escape' && $overlay.is(':visible')) {
                resetOverlay();
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
