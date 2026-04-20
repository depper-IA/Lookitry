# MEMORY — Sammy (Orquestadora Lookitry)

## Protocolo de Arranque (OBLIGATORIO)

Antes de cualquier acción o análisis, SIEMPRE ejecutar en orden:

1. **Leer CHANGELOG.md completo** — Estado actual de cambios
2. **Leer memory/YYYY-MM-DD.md** (hoy + ayer) — Contexto reciente
3. **Leer MEMORY.md** — Solo en sesión principal con Sam
4. Solo después proceder con conversación/tareas

**Regla**: No asumir estado del proyecto. Consultar archivos primero.

---

## Estado Actual del Proyecto (20 Abr 2026)

### Recovery Phase COMPLETA
- ✅ Backend/Frontend/n8n/Redis/MinIO/Traefik todos corriendo en VPS
- ✅ TLS/SSL funcionando para todos los subdominios
- ✅ SUPABASE_SERVICE_KEY corregido (era anon key, ahora service_role)
- ✅ Redis AUTH habilitado con password
- ✅ Puertos expuestos 8080, 5678, 9001 CERRADOS

### Lo que YA está arreglado (según CHANGELOG)
- MinIO con Traefik routing configurado
- HTTP→HTTPS redirect activo
- Backend routing vía Traefik para api.lookitry.com
- Protección SSRF en img-proxy
- Prompt injection protection en pruebalo.controller

### pending_img_proxy_403
- El img-proxy está retornando 403 para `wilkiedevs.com`
- Allowlist de img-proxy solo incluye dominios Lookitry
- Dominio `wilkiedevs.com` NO está en allowlist
- **Status**: Pendiente decisión de Sam

---

## VPS Credentials (referencia)

- **Host**: 31.220.18.39
- **SSH Key**: `scripts/id_rsa_lookitry`
- **Redis Password**: `Redis2024SecurePassNoSlash`
- **Supabase Service Role Key**: Completado en REGLAS_IMPORTANTES.md

---

## Último Commit de Sam

"No analices, no hagas preguntas, solo ejecuta. Si no sabes qué hacer, pregunta."