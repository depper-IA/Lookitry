'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';

type Props = {
  html: string;
  className?: string;
};

export default function SanitizedHtml({ html, className }: Props) {
  const cleanHtml = useMemo(() => {
    if (typeof window === 'undefined') return html;
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
        'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'span', 'div', 'hr', 'abbr', 'sub', 'sup', 'del', 'ins', 'mark',
        'video', 'audio', 'source',
      ],
      ALLOWED_ATTR: [
        'href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height',
        'class', 'id', 'style', 'loading', 'referrerpolicy',
        'controls', 'autoplay', 'loop', 'muted', 'playsinline',
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.]+(?:[^a-z+.]+|$))/i,
    });
  }, [html]);

  return <div className={className} dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
}
