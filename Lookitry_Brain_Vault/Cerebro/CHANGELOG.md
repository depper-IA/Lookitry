# Changelog - Lookitry

---

## 2026-04-18

### Nuevas Funcionalidades

#### Rebecca - Automatización de Redes Sociales con Buffer

**Archivos creados:**
- `Cerebro/Skills/social-automation-buffer.md` - Nueva skill para automatización

**Archivos modificados:**
- `Cerebro/Skills/Skills.md` - Indexada la nueva skill

**Descripción:**
- Rebecca ahora puede generar contenido para Twitter, Facebook, Instagram y LinkedIn
- Contenido se envía a Buffer API para programación automática
- Flujo: Sam solicita → Rebecca genera → Sam aprueba → Buffer programa

**Plataformas soportadas:**
- Twitter/X
- Facebook Pages
- Instagram (Business)
- LinkedIn Pages

**Tecnología:**
- Buffer API para programación
- MiniMax-M2.7 para generación de contenido
- Telegram como interfaz de aprobación

---

## 2026-04-14

### Sistema de Agentes v2.0

**Cambios principales:**
- 10 agentes con nombres nuevos
- Modelo default: MiniMax-M2.7 (Groq/DeepSeek removidos)
- Rebecca v3.0 con foco en MONEY
- Melissa como colaboradora de Pixel
- Leo como agente de trading
- Regla 6: Notificación obligatoria de tareas

**Archivos actualizados:**
- REGLAS_IMPORTANTES.md
- AGENTS.md

---

## 2026-04-12

### Fix CRÍTICO - Secretos en docker-compose

**Archivos modificados:**
- `docker-compose.yml` - Secretos removidos, ahora usa .env

---

## 2026-04-11

### Fix CRÍTICO - Precios Inconsistentes

**Problema:** Precios diferentes entre /terminos y /planes

**Solución:**
- Unificados precios en Supabase `pricing_config`
- Creada función `getPricingConfig()` en `@/lib/pricing`
- Removidos precios hardcodeados del frontend

---

## 2026-04-10

### Fix URLs 404 en Sitemap

**Problema:** Google indexando URLs obsoletas que causan 404

**Solución:**
- Implementadas redirecciones 301 en `next.config.js`
- Actualizado sitemap dinâmico

---

## 2026-04-09

### Fix Trial Confundidor

**Problema:** Usuarios confundían trial gratis vs trial de $20.000 COP

**Solución:**
- Clarificado messaging: "Trial de $20.000 COP" no "gratis"
- Actualizado copy en landing y checkout
- Agregado tooltip explicativo

---

_Last updated: 2026-04-18 15:42 UTC-5_