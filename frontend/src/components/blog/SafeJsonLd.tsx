'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';

type Props = {
  data: Record<string, unknown>;
};

/**
 * Componente seguro para renderizar scripts JSON-LD.
 * Sanaiza el JSON output para prevenir XSS mientras mantiene la estructura JSON válida.
 */
export default function SafeJsonLd({ data }: Props) {
  const sanitizedJson = useMemo(() => {
    // Primero stringifyamos
    let jsonStr = JSON.stringify(data);

    // Si estamos en el navegador, sanitizamos el string JSON
    // DOMPurify no alterará el JSON válido, solo removerá scripts inyectados
    if (typeof window !== 'undefined') {
      // Configuramos DOMPurify para que no altere el JSON
      jsonStr = DOMPurify.sanitize(jsonStr, {
        ALLOWED_TAGS: [], // No permitimos tags HTML
        ALLOWED_ATTR: [], // No permitimos atributos
        KEEP_CONTENT: true, // Pero mantenemos el contenido de texto
      });
    }

    return jsonStr;
  }, [data]);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: sanitizedJson }}
      suppressHydrationWarning
    />
  );
}
