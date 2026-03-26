(function() {
  // Configuración base
  const BASE_URL = 'https://lookitry.com';
  const CONTAINER_ID = 'lookitry-tester-container';
  const ALLOWED_ORIGINS = new Set([BASE_URL, 'https://www.lookitry.com']);

  function initLookitry() {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    // 1. Obtener datos del contenedor
    const slug = container.getAttribute('data-slug');
    let productId = container.getAttribute('data-product-id');

    if (!slug) {
      console.error('Lookitry: Falta el atributo data-slug en el contenedor.');
      return;
    }

    // 2. Intento de lectura dinámica de Product ID (Shopify, WooCommerce, QueryParams)
    if (!productId) {
      const urlParams = new URLSearchParams(window.location.search);
      // Shopify usa ?variant=, WooCommerce a veces ?add-to-cart= o el ID está en el DOM
      productId = urlParams.get('variant') || urlParams.get('product_id') || urlParams.get('p') || urlParams.get('id');
      
      // Intento en WooCommerce (Input hidden common)
      if (!productId) {
        const wcInput = document.querySelector('input[name="add-to-cart"], .variation_id');
        if (wcInput) productId = wcInput.value;
      }
    }

    // 3. Crear el Iframe dinámico
    const iframe = document.createElement('iframe');
    const embedUrl = new URL(`${BASE_URL}/embed/${slug}`);
    if (productId) embedUrl.searchParams.set('product_id', productId);
    
    // Identificador para postMessage
    embedUrl.searchParams.set('parent_url', window.location.href);

    // 4. Estilos para responsividad Pro Max
    const styles = {
      width: '100%',
      height: '700px', // Altura inicial
      border: 'none',
      overflow: 'hidden',
      display: 'block',
      margin: '0 auto',
      transition: 'height 0.3s ease'
    };

    Object.assign(iframe.style, styles);
    iframe.src = embedUrl.toString();
    iframe.id = 'lookitry-iframe-' + slug;
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('allow', 'camera; clipboard-write'); // Permitir cámara para selfies

    // 5. Inyectar en el contenedor
    container.innerHTML = '';
    container.appendChild(iframe);

    // 6. Listener para redimensionamiento dinámico (postMessage)
    window.addEventListener('message', function(event) {
      if (!event || !ALLOWED_ORIGINS.has(event.origin)) return;

      // Compat: versiones antiguas (LOOKITRY_RESIZE) y actuales (TRYON_RESIZE)
      const msg = event.data || {};
      const type = msg.type;

      let newHeight = null;
      if (type === 'TRYON_RESIZE') {
        newHeight = msg?.data?.height;
      } else if (type === 'LOOKITRY_RESIZE') {
        newHeight = msg?.height;
      }

      if (newHeight && newHeight > 100) iframe.style.height = newHeight + 'px';
    }, false);
  }

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLookitry);
  } else {
    initLookitry();
  }
})();
