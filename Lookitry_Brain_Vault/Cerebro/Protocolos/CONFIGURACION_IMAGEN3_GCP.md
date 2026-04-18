# Protocolo: Integración de Imagen 3 (GCP) para Generación de Contenido

Este documento detalla la arquitectura y los pasos necesarios para implementar la generación de imágenes mediante **Imagen 3 (Vertex AI)** utilizando 4 cuentas de Google Cloud distintas para maximizar los créditos disponibles ($20 USD totales).

## 1. Objetivo
Permitir que el agente **Rebecca Ashford** (@becca) genere imágenes de alta calidad para el blog y redes sociales de Lookitry directamente desde OpenCode, rotando entre múltiples cuentas de GCP para optimizar costos y límites.

## 2. Requisitos Previos (Por el Usuario)

Para cada una de las 4 cuentas/proyectos de Google Cloud:
1. **Activar la API de Vertex AI**: En el GCP Console, buscar "Vertex AI API" y dar clic en Habilitar.
2. **Crear Service Account**:
   - Ir a IAM & Admin > Service Accounts.
   - Crear una cuenta (ej: `rebecca-imagen-bot`).
   - Asignar el rol: **Vertex AI User** (`roles/aiplatform.user`).
3. **Generar Clave JSON**:
   - Entrar en la Service Account creada > pestaña **Keys**.
   - Add Key > Create New Key > JSON.
   - Guardar el archivo descargado.

## 3. Arquitectura Propuesta

### Ubicación de Credenciales
Guardar los 4 archivos JSON en la carpeta local de configuración:
`C:/Users/Matt/.opencode/gcp-keys/`
Nombrarlos como: `acc1.json`, `acc2.json`, `acc3.json`, `acc4.json`.

### Servidor MCP: `gcp-imagen-mcp`
Un servidor MCP personalizado en Node.js que:
1. Cargue las 4 configuraciones.
2. Implemente lógica de **Round Robin** (rotación secuencial) o **Failover** (si una falla o se agota, pasa a la siguiente).
3. Exponga la herramienta `generate_imagen(prompt, aspect_ratio, account_id?)`.

## 4. Integración con Rebecca (@becca)

Una vez configurado el MCP en `opencode.json`, Rebecca podrá:
- **Herramienta**: `gcp-imagen-mcp:generate_image`.
- **Flujo**:
  1. Rebecca recibe una orden de crear un post para el blog.
  2. Redacta el contenido.
  3. Llama a `generate_image` con un prompt optimizado.
  4. Guarda la imagen en `assets/blog/` o `assets/rebecca/`.
  5. Notifica a Sam con el resultado.

## 5. Próximos Pasos (Pendientes)
- [ ] Usuario descarga los 4 archivos JSON.
- [ ] Crear la carpeta `.opencode/gcp-keys/`.
- [ ] Desarrollar e instalar el servidor `gcp-imagen-mcp`.
- [ ] Actualizar `opencode.json` con las nuevas credenciales.
- [ ] Actualizar el prompt de sistema de Rebecca en `rebecca.md`.

---
**Estado**: Planificado (Abril 2026)
