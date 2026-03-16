#!/usr/bin/env python3
"""Patch tasks 35.6 and 35.7 in tasks.md to reflect real n8n JSON files."""

TASKS_PATH = ".kiro/specs/virtual-tryon-saas/tasks.md"

with open(TASKS_PATH, "r", encoding="utf-8") as f:
    content = f.read()

OLD_36_37 = """  - [ ] 35.6 Workflow n8n \u2014 Campa\u00f1a de email masivo (Flujo 1)
    - Crear workflow `CRM - Campa\u00f1a Email Masivo` en n8n (ID a registrar en CONTEXT.md)
    - Nodo Webhook: recibe `{ filtros: { estado_lead, ciudad, limite }, template_id, asunto }` desde el admin
    - Nodo Supabase: `SELECT id, nombre_empresa, nombre_contacto, email, crm_ref FROM crm_leads WHERE campana_enviada=false AND estado_lead='NUEVO' [+ filtros] LIMIT limite`
    - Nodo Loop: itera sobre cada contacto
    - Nodo HTTP Request \u2192 Brevo API `POST /v3/smtp/email`: asunto personalizado con `nombre_empresa`, template con variables del contacto, `redirect-url` incluye `?ref={{crm_ref}}`
    - Nodo Supabase UPDATE: `SET campana_enviada=true, fecha_campana=NOW(), estado_lead='CONTACTADO'` por id
    - Nodo IF error de email \u2192 UPDATE `estado_lead='EMAIL_INVALIDO'`
    - Nodo final: responde al webhook con `{ enviados, errores, total }`
    - _Registrar ID del workflow en CONTEXT.md bajo "Workflows n8n \u2014 Marketing"_

  - [ ] 35.7 Workflow n8n \u2014 Prospecci\u00f3n autom\u00e1tica Google Maps (Flujo 2)
    - Crear workflow `CRM - Prospecci\u00f3n Google Maps` en n8n
    - Nodo Cron: cada lunes a las 8am
    - Nodo HTTP Request \u2192 Apify API (plan gratuito: 100 runs/mes): Google Maps Scraper con queries `"tiendas de ropa {ciudad}"`, `"boutique {ciudad}"`, ciudades: Bogot\u00e1, Medell\u00edn, Cali, Barranquilla, Bucaramanga, Pereira, Manizales
    - Nodo Loop sobre resultados: extrae nombre, email, tel\u00e9fono, direcci\u00f3n, web
    - Nodo IF: email existe Y no est\u00e1 en `crm_leads` (check por email)
    - Nodo Supabase INSERT: `estado_lead='NUEVO'`, `fuente='GOOGLE_MAPS_AUTO'`, `campana_enviada=false`, `crm_ref=REF-AUTO-{timestamp}-{slug}`
    - _Registrar ID del workflow en CONTEXT.md_"""

NEW_36_37 = """  - [ ] 35.6 Workflow n8n \u2014 Campa\u00f1a de email masivo (Flujo 1)
    - JSON listo en `templates-webs/flujo1_campana_email_masivo.json` \u2014 importar en n8n
    - Registrar el ID asignado por n8n en CONTEXT.md bajo "Workflows n8n \u2014 Marketing"
    - Reemplazar `SUPABASE_CRED_ID` en los nodos Postgres con el ID real de la credencial en n8n
    - Tabla usada: `crm_leads` \u2014 ejecutar migraci\u00f3n 35.1 antes de activar el workflow
    - Dos triggers: Cron L-V 9am (300 leads/d\u00eda autom\u00e1tico) + Webhook POST `crm-campaign-launch` (manual desde admin)
    - Variables de entorno n8n requeridas: `BREVO_API_KEY`
    - El webhook responde `{ enviados, errores, total }` \u2014 el frontend hace polling a este endpoint
    - Nodos sin emojis en los nombres para evitar problemas de referencia entre nodos
    - _Registrar ID del workflow en CONTEXT.md bajo "Workflows n8n \u2014 Marketing"_

  - [ ] 35.7 Workflow n8n \u2014 Prospecci\u00f3n autom\u00e1tica Colombia (Flujo 2)
    - JSON listo en `templates-webs/flujo2_prospeccion_colombia.json` \u2014 importar en n8n
    - Registrar el ID asignado por n8n en CONTEXT.md bajo "Workflows n8n \u2014 Marketing"
    - Reemplazar `SUPABASE_CRED_ID` en los 3 nodos Postgres con el ID real de la credencial en n8n
    - Tabla usada: `crm_leads` \u2014 los campos del INSERT coinciden con la migraci\u00f3n 35.1
    - Cron: cada lunes 8am \u2014 genera 15 combinaciones ciudad\u00d7nicho rotando semanalmente
    - Fuentes: Apify Google Maps Scraper (100 runs/mes gratis) + Google CSE (100 b\u00fasquedas/d\u00eda gratis)
    - Variables de entorno n8n requeridas: `APIFY_API_TOKEN`, `GOOGLE_CSE_API_KEY`, `GOOGLE_CSE_ID`, `BREVO_API_KEY`
    - Advertencia: los nodos Code referencian `$node['Nombre del nodo']` con emojis \u2014 NO renombrar los nodos al importar
    - El nodo `Wait` tiene `webhookId: "wait-dup"` hardcodeado \u2014 si hay colisi\u00f3n en el VPS, cambiar a un ID \u00fanico
    - Env\u00eda reporte semanal al admin por email con total de leads nuevos captados
    - _Registrar ID del workflow en CONTEXT.md bajo "Workflows n8n \u2014 Marketing"_"""

if OLD_36_37 in content:
    content = content.replace(OLD_36_37, NEW_36_37)
    with open(TASKS_PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK: tasks 35.6 y 35.7 actualizadas correctamente")
else:
    print("ERROR: bloque no encontrado")
    # Debug: buscar fragmento clave
    key = "35.6 Workflow n8n"
    idx = content.find(key)
    if idx >= 0:
        print(f"Fragmento encontrado en pos {idx}:")
        print(repr(content[idx:idx+300]))
    else:
        print("Fragmento '35.6 Workflow n8n' tampoco encontrado")
