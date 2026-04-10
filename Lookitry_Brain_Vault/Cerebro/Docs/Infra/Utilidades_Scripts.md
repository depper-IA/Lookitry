# Utilidades y Scripts de Infraestructura - Lookitry

## Descripcion
Este documento lista los scripts de utilidad ubicados en `scripts/` y la raiz del proyecto, explicando su funcion tecnica para evitar ejecuciones erroneas.

## Scripts de Despliegue y Mantenimiento

### _deploy_now.py
- **Ruta**: `scripts/_deploy_now.py`
- **Funcion**: Script central de despliegue al VPS. Realiza el commit, push y rebuild de contenedores Docker.
- **Parametros**: `--force` para rebuild total, `--status` para health check.

### check_integrity.py
- **Ruta**: `scripts/check_integrity.py`
- **Funcion**: Verifica la integridad de los archivos del proyecto, buscando corrupciones de codificacion (UTF-8) o archivos vacios.

### sync_project_knowledge.py
- **Ruta**: `scripts/sync_project_knowledge.py`
- **Funcion**: Utilidad para sincronizar la documentacion entre el repositorio local y el Cerebro (Obsidian).

## Scripts de Pruebas y Diagnostico

### stress_test.py
- **Ruta**: `scripts/stress_test.py`
- **Funcion**: Ejecuta llamadas masivas de prueba al endpoint de generacion para verificar los limites de concurrencia y la estabilidad de n8n.

### verify_vps.py
- **Ruta**: `scripts/verify_vps.py`
- **Funcion**: Comprueba la conectividad SSH, uso de disco y estado de Docker en el servidor de Hostinger.

## Automatizaciones de DB y n8n

### Supabase-Lookitry.ps1
- **Ruta**: `scripts/Supabase-Lookitry.ps1`
- **Funcion**: Script de PowerShell para automatizar migraciones y backups rapidos de la base de datos desde la terminal.

### patch_layout.py / patch_settings.py
- **Ruta**: `scripts/`
- **Funcion**: Utilidades para inyectar configuraciones globales en el frontend (Next.js) de forma programatica durante el build.

---
**Nota**: Estos scripts deben ejecutarse con precaucion ya que operan sobre entornos de produccion o configuraciones globales del sistema.
