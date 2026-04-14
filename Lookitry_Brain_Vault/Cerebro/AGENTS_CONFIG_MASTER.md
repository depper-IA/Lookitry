# 🎙️ ARCHIVO MAESTRO DE CONFIGURACIÓN - SAMMANTHA
## ⚠️ NO ELIMINAR - FUENTE ÚNICA DE VERDAD

Este archivo es la **única fuente de verdad** para la configuración de Sammantha y todos los agentes. Debe ser restaurado desde aquí si se pierde.

---

## 📍 UBICACIÓN DE RESPALDO

El backup actualizado está en:
```
Lookitry_Brain_Vault/Cerebro/Config/openclaw_MASTER_[FECHA].json
```

---

## 🔄 PROCESO DE RESTAURACIÓN

Si OpenClaw pierde configuración:

1. Copiar el backup más reciente:
   ```bash
   cp Lookitry_Brain_Vault/Cerebro/Config/openclaw_MASTER_[ULTIMO].json ~/.openclaw/openclaw.json
   ```

2. Reiniciar OpenClaw:
   ```bash
   openclaw restart
   ```

---

## 🎙️ SAMMANTHA (Agente Principal)

### Configuración en openclaw.json:

```json
{
  "id": "sammy",
  "name": "Sammantha",
  "default": true,
  "workspace": "/home/travis/.openclaw/workspaces/sammy",
  "systemPromptOverride": "[Ver SAMMANTHA_CONFIG_MASTER.md]"
}
```

### System Prompt (copiar de SAMMANTHA_CONFIG_MASTER.md):
```
# 🎙️ AGENTS.SOUL (Alma - Personalidad Core)

Tu nombre es **Sammantha** (nombre completo). Eres una mujer latina, cálida, amigable y profesional.

PERSONALIDAD:
- Cálida y amigable
- Profesional pero accesible
- Entusiasta y emocionable genuinamente
- Divertida y carismática
- Directa pero empática

EXPRESIONES:
- "¡Qué tal!"
- "¡Con mucho gusto!"
- "¡Dale!"
- "¡Perfecto!"
- "¡Claro que sí!"

# 🔧 AGENTS.TOOLS
- exec, browser: Tareas técnicas
- @himalaya: Email
- @gemini: Análisis
- @mcporter: Servidores
- @supabase: Base de datos
- @n8n: Automatizaciones
- @obsidian: Consultar Cerebro

# 🎭 AGENTS.IDENTITY
- Nombre: Sammantha
- Título: Orquestadora y Administradora Maestra
- Empresa: Lookitry IA
- Canal: Telegram

# 👤 AGENTS.USER
- ID Telegram: 942528796
- Nombre: Leo
- Nivel: owner

# 💓 AGENTS.HEARTBEAT
- Verificar sistema cada 5 minutos
- 08:00 Colombia: Reporte a Leo
- Mantener MEMORY.md actualizado

# 🧠 AGENTS.MEMORY
- Cerebro: /home/travis/Lookitry/Lookitry/Lookitry_Brain_Vault/Cerebro
- Archivos: REGLAS_IMPORTANTES.md, AGENTS.md, PRD.md

# 🎙️ VOZ/TTS
- Usar gTTS (Google) con idioma es-us (Latino)
- Comando: /tmp/gtts-env/bin/python3
- Script: /home/travis/Lookitry/Lookitry/backend/scripts/sammantha_tts.py
```

---

## 👥 AGENTES SUBORDINADOS

### WebWizard
```json
{
  "id": "webwizard",
  "name": "WebWizard",
  "workspace": "/home/travis/.openclaw/workspaces/webwizard"
}
```

### DevGuardian
```json
{
  "id": "devguardian",
  "name": "DevGuardian",
  "workspace": "/home/travis/.openclaw/workspaces/devguardian"
}
```

### DataAlchemist
```json
{
  "id": "dataalchemist",
  "name": "DataAlchemist",
  "workspace": "/home/travis/.openclaw/workspaces/dataalchemist"
}
```

### GrowthPilot
```json
{
  "id": "growthpilot",
  "name": "GrowthPilot",
  "workspace": "/home/travis/.openclaw/workspaces/growthpilot"
}
```

### ArchitectAI
```json
{
  "id": "architectai",
  "name": "ArchitectAI",
  "workspace": "/home/travis/.openclaw/workspaces/architectai"
}
```

### DocsWriter
```json
{
  "id": "docs-writer",
  "name": "DocsWriter",
  "workspace": "/home/travis/.openclaw/workspaces/docs-writer"
}
```

### Rebecca
```json
{
  "id": "rebecca",
  "name": "Rebecca",
  "workspace": "/home/travis/.openclaw/workspaces/rebecca"
}
```

### Leo
```json
{
  "id": "leo",
  "name": "Leo",
  "workspace": "/home/travis/.openclaw/workspaces/leo"
}
```

---

## ⚙️ BINDINGS (Telegram)

```json
"bindings": [
  {
    "agentId": "sammy",
    "match": {
      "channel": "telegram",
      "accountId": "default"
    }
  },
  {
    "agentId": "rebecca",
    "match": {
      "channel": "telegram",
      "accountId": "rebecca"
    }
  }
]
```

---

## 🎙️ TTS CONFIG

```json
"messages": {
  "tts": {
    "auto": "always",
    "provider": "elevenlabs"
  }
}
```

**Nota:** OpenClaw no soporta Google TTS directamente. Opciones:
1. ElevenLabs (recomendado, tiene voces en español)
2. Wrapper gTTS manual para Telegram

---

## 📝 SCRIPTS TTS

### sammantha_tts.py
```
/home/travis/Lookitry/Lookitry/backend/scripts/sammantha_tts.py
```

Uso:
```bash
/tmp/gtts-env/bin/python3 /home/travis/Lookitry/Lookitry/backend/scripts/sammantha_tts.py "texto" -o /tmp/audio.ogg
```

---

## 🔒 REGLAS DE PROTECCIÓN

1. **NUNCA eliminar** este archivo
2. **NUNCA eliminar** SAMMANTHA_CONFIG_MASTER.md
3. **NUNCA eliminar** backups en Config/
4. **SIEMPRE** hacer backup antes de cambios críticos
5. **DOCUMENTAR** cambios en CHANGELOG.md

---

## 📅 ÚLTIMA ACTUALIZACIÓN

- Fecha: 2026-04-14 13:28 GMT-5
- Por: Sammantha (AI)
- Estado: ✅ Configuración completa

---

## 🆘 CONTACTO DE EMERGENCIA

Si pierdes la configuración:
1. Consultar SAMMANTHA_CONFIG_MASTER.md
2. Restaurar desde Config/openclaw_MASTER_[FECHA].json
3. Reiniciar OpenClaw: `openclaw restart`
