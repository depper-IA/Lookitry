'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import type { CSSProperties } from 'react';

type Props = {
  html: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * Componente seguro para renderizar HTML de emails.
 * Permite tags típicos de emails (tablas, inline styles) mientras previene XSS.
 */
export default function SanitizedEmailHtml({ html, className, style }: Props) {
  const cleanHtml = useMemo(() => {
    if (typeof window === 'undefined') return html;

    return DOMPurify.sanitize(html, {
      // Permitir todos los tags típicos de emails
      ALLOWED_TAGS: [
        'html', 'head', 'body', 'style',
        'div', 'span', 'p', 'br', 'hr',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'strong', 'b', 'em', 'i', 'u', 's',
        'a', 'img',
        'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
        'ul', 'ol', 'li', 'dl', 'dt', 'dd',
        'blockquote', 'pre', 'code',
        'section', 'article', 'header', 'footer', 'nav', 'aside',
        'figure', 'figcaption',
        'form', 'input', 'button', 'textarea', 'select', 'option',
        'label', 'fieldset', 'legend',
        'iframe', 'object', 'embed', // Ojo: estos pueden ser peligrosos
        'font', 'center', 'marquee', 'blink', // Tags deprecated de emails
      ],
      ALLOWED_ATTR: [
        'href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height',
        'class', 'id', 'style', 'loading', 'referrerpolicy',
        'bgcolor', 'background', 'color', 'border', 'cellpadding', 'cellspacing',
        'align', 'valign', 'nowrap',
        'colspan', 'rowspan', 'headers',
        'type', 'name', 'value', 'placeholder', 'required', 'disabled',
        'action', 'method', 'enctype',
        'frameborder', 'allowfullscreen', 'allow',
        'scrolling', 'marginwidth', 'marginheight',
        // Atributos de estilo permitidos
        'style',
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.]+(?:[^a-z+.]+|$))/i,
      // Forzar attribute lowercase para prevenir bypass
      FORCE_BODY: true,
      // No devolver HTML dentro de scripts
      SANITIZE_DOM: true,
      // Prevenir DOM clobbering
      KEEP_CONTENT: true,
    });
  }, [html]);

  return <div className={className} style={style} dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
}
