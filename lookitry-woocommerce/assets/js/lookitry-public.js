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

        if (!$btn.length) return;

        $btn.on('click', function(e) {
            e.preventDefault();
            
            const productId = $(this).data('product-id');
            const apiKey = lookitry_vars.api_key;
            
            if (!apiKey) {
                console.error('Lookitry: API Key no configurada.');
                alert('No se pudo abrir el probador. Por favor, contacta al administrador.');
                return;
            }

            // Cambiar el texto del botón temporalmente
            const originalText = $(this).find('span').text();
            $(this).find('span').text('Cargando probador...');
            $(this).prop('disabled', true);

            // Llamada al backend de Lookitry para inicializar sesión
            $.ajax({
                url: lookitry_vars.api_url + '/embed/wordpress/init',
                method: 'POST',
                headers: {
                    'x-api-key': apiKey
                },
                data: JSON.stringify({
                    external_id: productId.toString()
                }),
                contentType: 'application/json',
                success: function(response) {
                    if (response.success && response.embedUrl) {
                        $iframe.attr('src', response.embedUrl);
                        $overlay.css('display', 'flex');
                    } else {
                        alert('Error al inicializar el probador: ' + (response.message || 'Desconocido'));
                    }
                },
                error: function(xhr) {
                    let msg = 'Error de conexión con Lookitry.';
                    if (xhr.status === 404) {
                        msg = 'Producto no encontrado en Lookitry. Asegúrate de que el ID Externo coincida.';
                    } else if (xhr.status === 401 || xhr.status === 403) {
                        msg = 'API Key inválida o plan vencido.';
                    }
                    alert(msg);
                },
                complete: function() {
                    $btn.find('span').text(originalText);
                    $btn.prop('disabled', false);
                }
            });
        });

        $close.on('click', function() {
            $overlay.hide();
            $iframe.attr('src', '');
        });

        // Close on overlay click
        $overlay.on('click', function(e) {
            if (e.target === this) {
                $close.trigger('click');
            }
        });

        // ESC key to close
        $(document).on('keydown', function(e) {
            if (e.key === 'Escape' && $overlay.is(':visible')) {
                $close.trigger('click');
            }
        });

        // Dynamic Resize listener from Next.js widget
        window.addEventListener('message', function(e) {
            if (e.data && e.data.type === 'TRYON_RESIZE') {
                const newHeight = e.data.data.height;
                if (newHeight && window.innerWidth > 600) {
                    // Limitar a máximo 90vh en desktop
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
