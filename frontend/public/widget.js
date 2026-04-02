(function() {
  const BASE_URL = 'https://lookitry.com';
  const DEFAULT_SELECTOR = '[data-lookitry-widget], #lookitry-tester-container';
  const ALLOWED_ORIGINS = new Set([BASE_URL, 'https://www.lookitry.com']);
  const IFRAME_REGISTRY = new Map();
  let listenerBound = false;

  function normalizeHeight(value, fallback) {
    const height = Number(value);
    return Number.isFinite(height) && height > 100 ? height : fallback;
  }

  function resolveProductId(container) {
    let productId = container.getAttribute('data-product-id');

    if (productId) {
      return productId;
    }

    const urlParams = new URLSearchParams(window.location.search);
    productId =
      urlParams.get('variant') ||
      urlParams.get('product_id') ||
      urlParams.get('p') ||
      urlParams.get('id');

    if (!productId) {
      const wcInput = document.querySelector('input[name="add-to-cart"], .variation_id');
      if (wcInput && 'value' in wcInput) {
        productId = wcInput.value;
      }
    }

    return productId || '';
  }

  function ensureMessageListener() {
    if (listenerBound) return;
    listenerBound = true;

    window.addEventListener('message', function(event) {
      if (!event || !ALLOWED_ORIGINS.has(event.origin)) return;

      const msg = event.data || {};
      const type = msg.type;
      const iframe = Array.from(IFRAME_REGISTRY.values()).find(function(candidate) {
        return candidate && candidate.contentWindow === event.source;
      });

      if (!iframe) return;

      let newHeight = null;
      if (type === 'TRYON_RESIZE') {
        newHeight = msg && msg.data ? msg.data.height : null;
      } else if (type === 'LOOKITRY_RESIZE') {
        newHeight = msg.height;
      }

      if (newHeight) {
        iframe.style.height = normalizeHeight(newHeight, 700) + 'px';
      }
    }, false);
  }

  function buildWidget(container) {
    const slug = container.getAttribute('data-slug');
    const modalMode = container.getAttribute('data-modal') === 'true';
    const hideLegal = container.getAttribute('data-hide-legal') === 'true';
    const pluginView = container.getAttribute('data-plugin-view') === 'true';
    const initialHeight = normalizeHeight(container.getAttribute('data-height'), modalMode ? 760 : 700);
    const productId = resolveProductId(container);

    if (!slug) {
      console.error('Lookitry: Falta el atributo data-slug en el contenedor.');
      return null;
    }

    const embedUrl = new URL(BASE_URL + '/embed/' + slug);
    if (productId) {
      embedUrl.searchParams.set('product_id', productId);
    }
    if (pluginView) {
      embedUrl.searchParams.set('plugin_view', '1');
    }
    embedUrl.searchParams.set('parent_url', window.location.href);

    container.innerHTML = '';
    container.style.position = 'relative';
    container.style.width = '100%';
    container.style.maxWidth = modalMode ? '100%' : (container.getAttribute('data-max-width') || '100%');
    container.style.margin = modalMode ? '0' : '0 auto';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'stretch';
    container.style.justifyContent = modalMode ? 'center' : 'flex-start';
    container.style.minHeight = modalMode ? '100%' : '0';

    const iframe = document.createElement('iframe');
    iframe.src = embedUrl.toString();
    iframe.id = 'lookitry-iframe-' + slug + '-' + Math.random().toString(36).slice(2, 8);
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('allow', 'camera; clipboard-write');
    iframe.setAttribute('title', 'Lookitry widget');
    iframe.style.width = '100%';
    iframe.style.height = initialHeight + 'px';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.style.display = 'block';
    iframe.style.margin = '0 auto';
    iframe.style.background = '#ffffff';
    iframe.style.transition = 'height 0.3s ease';
    iframe.style.borderRadius = modalMode ? '28px' : '24px';
    iframe.style.boxShadow = modalMode ? 'none' : '0 10px 50px rgba(0,0,0,0.10)';
    iframe.style.flex = modalMode ? '1 1 auto' : '0 0 auto';
    iframe.style.minHeight = modalMode ? initialHeight + 'px' : '0';

    container.appendChild(iframe);
    IFRAME_REGISTRY.set(container, iframe);

    if (!hideLegal) {
      const legalWrap = document.createElement('div');
      legalWrap.style.marginTop = '8px';
      legalWrap.style.textAlign = 'right';
      legalWrap.style.fontSize = '11px';
      legalWrap.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      legalWrap.style.color = '#888';
      legalWrap.innerHTML =
        'Al usar este probador aceptas la <a href="' + BASE_URL + '/politica-de-uso" target="_blank" rel="noopener noreferrer" style="color:#FF5C3A;text-decoration:none;">politica de uso</a>';
      container.appendChild(legalWrap);
    }

    return iframe;
  }

  function init(target) {
    ensureMessageListener();

    if (!target) {
      return initAll();
    }

    if (typeof target === 'string') {
      const node = document.querySelector(target);
      return node ? buildWidget(node) : null;
    }

    if (target instanceof Element) {
      return buildWidget(target);
    }

    return null;
  }

  function initAll() {
    ensureMessageListener();
    const nodes = document.querySelectorAll(DEFAULT_SELECTOR);
    return Array.from(nodes).map(buildWidget).filter(Boolean);
  }

  window.LookitryWidget = {
    init: init,
    initAll: initAll,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initAll();
    });
  } else {
    initAll();
  }
})();
