**Rol:** Actúa como un Desarrollador Full-Stack Senior y Arquitecto de Software experto en el stack de Lookitry (Next.js 14 App Router, Node.js Express, Supabase, n8n y S3 MinIO).

**Instrucción principal:**
A continuación te proporciono la Documentación Técnica y Comercial Oficial del **"Plan Enterprise"** de Lookitry. Actualmente, este plan solo existe a nivel teórico y necesito que entiendas todo el contexto para que me ayudes a implementarlo a nivel de código (Frontend, Backend, Base de Datos y flujos de n8n). Lee detenidamente esta documentación y confirma que la has entendido antes de que te pida la primera tarea de código.

---

### 📄 DOCUMENTACIÓN OFICIAL: LOOKITRY ENTERPRISE TIER

#### 1. Visión General y Propuesta de Valor
El segmento Enterprise está diseñado para marcas de moda, grandes *retailers* o cadenas con catálogos masivos (más de 50 productos y necesidades superiores a 3.000 generaciones mensuales).
En este nivel, el modelo de negocio abandona la "Suscripción Fija" clásica y pasa a un modelo **"Base + Variable"**. 
*   **El Gancho de Venta (Core Pitch):** *"No te vendemos un plugin, te vendemos un Laboratorio de Datos de Moda. Sabrás qué se quiere poner tu cliente antes de que él mismo lo decida"*.

#### 2. Estructura de Precios (Lógica de Facturación a programar)
La calculadora de precios y la lógica de base de datos (`pricing_config`) debe soportar la siguiente estructura de cobro:
*   **Precio Base Recurrente:** Desde $800.000 COP / mes.
    *   *Incluye:* Soporte 24/7, hasta 50 productos activos y 2.000 generaciones mensuales.
*   **Setup Fee (Cuota de configuración inicial):** Ej. $500.000 COP. Es un pago único por auditar, limpiar y optimizar las primeras 50 fotos del catálogo del cliente.
*   **Costos Variables (Excedentes):**
    *   *Por producto extra:* $10.000 COP (pago único por carga adicional).
    *   *Por generación extra:* $150 COP (después de consumir las 2.000 iniciales del mes).

#### 3. Beneficios Exclusivos (Features a implementar en la UI/UX)
El plan Enterprise desbloquea características que deben estar validadas por roles en la base de datos:
*   **SLA (Service Level Agreement):** Garantía de procesamiento de la IA en menos de 5 segundos.
*   **White Label Total (Marca Blanca):** Eliminación completa de la marca "Powered by Lookitry" en el widget y la interfaz del cliente.
*   **API Access:** Generación de tokens API para que la marca pueda integrar el probador nativamente en sus propias aplicaciones móviles.
*   **Panel de Analítica Avanzado:** Un dashboard exclusivo (Data Lab) que reporte métricas de las prendas más probadas, información vital para la compra de inventario del cliente.

#### 4. Arquitectura Técnica Requerida (n8n & Backend)
Para soportar catálogos grandes, la subida manual de fotos se desactiva y se pasa a un modelo automatizado:
*   **Ingesta de Datos Automática (The Sync):**
    *   Se debe crear un flujo en **n8n** que se conecte mediante API al inventario del cliente (o lea un CSV dinámico).
    *   *Trigger:* Programado (cron job cada 24 horas) para detectar nuevos productos.
    *   *Pre-procesamiento:* n8n debe enviar las fotos nuevas a una API de "Background Removal" y guardar la imagen limpia en nuestro almacenamiento S3 (MinIO).
*   **Optimización del Flujo n8n (Escalabilidad):**
    *   Crear **Sub-Workflows** exclusivos para clientes Enterprise para no saturar el flujo principal de Pymes.
    *   Implementar **Queue Management** (manejo de colas mediante Redis o nodos *Wait* en n8n) para gestionar picos de tráfico masivos durante eventos de rebajas como el "Cyberlunes".

#### 5. Flujo de Implementación (Onboarding Consultivo)
A nivel de sistema de administración (Admin Dashboard), el alta de un cliente Enterprise lleva pasos manuales:
1.  **Auditoría de Catálogo:** Cobro del *Setup Fee* para optimizar la calidad fotográfica inicial.
2.  **Prueba de Carga (Staging):** Probar el widget embebible en un entorno de pruebas del cliente para garantizar que el iframe/script no ralentice su sitio web principal.
3.  **Capacitación:** Entrega de credenciales al equipo de marketing para acceder al Panel de Analítica.

**Fin de la Documentación.**
Por favor, confirma que has analizado esta lógica de negocio, la arquitectura de Base + Variable y los requisitos de infraestructura de n8n. Una vez confirmes, te pediré que creemos los componentes de código para habilitar esto en Lookitry.

***

### ¿Cómo ayudará este documento a la IA?
1. **Le enseña matemáticas avanzadas:** Al leer la sección de "Costos Variables", la IA sabrá exactamente cómo programar tu *EnterpriseCalculator.tsx* que le pedimos anteriormente.
2. **Entiende tu stack real:** Vincula conceptos estratégicos (como *The Sync*) directamente con las herramientas técnicas que usas en tu servidor (n8n, S3, Supabase y Cron Jobs).
3. **Prepara el terreno para el código:** Al entregarle este contexto antes de pedirle que programe, te asegurarás de que no invente reglas de negocio genéricas, sino que desarrolle un panel de administración, base de datos y APIs estrictamente a la medida de tu modelo *White Label* y *Data Lab*.