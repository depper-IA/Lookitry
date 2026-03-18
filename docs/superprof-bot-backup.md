# Superprof Bot — Documentación de Respaldo

> Bot de automatización para actualizar el perfil de tutor en Superprof UK.
> Fue instalado en el VPS pero nunca se le dio uso. Se eliminó para liberar espacio (~1.5 GB).
> Esta documentación permite reinstalarlo desde cero cuando sea necesario.

---

## Qué hacía el bot

Era un servicio HTTP (Flask + Playwright) que automatizaba la actualización del perfil de tutor en
[superprof.co.uk](https://www.superprof.co.uk) mediante un navegador headless (Chromium).

Exponía un endpoint `POST /actualizar-perfil` que recibía los nuevos datos del perfil (título,
descripción, precios, detalles) y los cargaba automáticamente en el dashboard de Superprof haciendo
login, navegando al perfil y llenando los formularios.

También tenía un panel de monitoreo en tiempo real en `/live` con logs y estado de la última ejecución.

---

## Credenciales que usaba

| Variable | Valor |
|---|---|
| `SUPERPROF_USERNAME` | `lnwb45@gmail.com` |
| `SUPERPROF_PASSWORD` | `Elohimes#1` |
| `PROFILE_ID` | `7302143` |
| `APP_HOST` | `0.0.0.0` |
| `APP_PORT` | `5000` |

URL del perfil: `https://www.superprof.co.uk/dashboard.html/my-listings/listing/7302143`

---

## Stack técnico

| Componente | Versión |
|---|---|
| Python | 3.12 |
| Flask | 3.1.2 |
| Playwright | 1.55.0 |
| python-dotenv | 1.1.1 |
| Werkzeug | 3.1.3 |

---

## Cómo reinstalarlo paso a paso

### 1. Conectarse al VPS

```bash
ssh root@31.220.18.39
# Password: (ver tools-and-credentials.md)
```

### 2. Crear el directorio y entorno virtual

```bash
mkdir -p /home/ubuntu/superprof_bot
cd /home/ubuntu/superprof_bot
python3 -m venv venv
source venv/bin/activate
```

### 3. Instalar dependencias

```bash
pip install flask playwright python-dotenv
playwright install chromium
playwright install-deps chromium
```

> Nota: `playwright install chromium` descarga ~440 MB de Chromium headless.
> `playwright install-deps` instala las librerías del sistema necesarias.

### 4. Crear el archivo `.env`

```bash
cat > .env << 'EOF'
SUPERPROF_USERNAME="lnwb45@gmail.com"
SUPERPROF_PASSWORD="Elohimes#1"
PROFILE_ID="7302143"
APP_HOST="0.0.0.0"
APP_PORT="5000"
EOF
```

### 5. Crear el archivo principal

Crear `/home/ubuntu/superprof_bot/superprof_service_completo.py` con el código completo
que está al final de este documento.

### 6. Ejecutar manualmente (para probar)

```bash
cd /home/ubuntu/superprof_bot
source venv/bin/activate
python superprof_service_completo.py
```

El servidor queda escuchando en `http://0.0.0.0:5000`.

### 7. Probar el endpoint

```bash
curl -X POST http://localhost:5000/actualizar-perfil \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Experienced Python and Web Development Tutor with 5 years teaching online",
    "descripcion": "I am a passionate software developer with extensive experience teaching Python, JavaScript, and web development to students of all levels. My lessons are practical, project-based, and tailored to your specific goals. Whether you are a complete beginner or looking to advance your skills, I can help you achieve your objectives efficiently.",
    "hourly_rate": "25",
    "packs_5h": "110",
    "packs_10h": "200",
    "webcam_rate": "20",
    "details": "Lessons via Zoom or Google Meet. Materials provided. Flexible scheduling."
  }'
```

### 8. Ver el panel de monitoreo

Abrir en el navegador: `http://31.220.18.39:5000/live`

### 9. Ejecutar como servicio systemd (opcional, para que arranque automático)

```bash
cat > /etc/systemd/system/superprof-bot.service << 'EOF'
[Unit]
Description=Superprof Bot Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/superprof_bot
ExecStart=/home/ubuntu/superprof_bot/venv/bin/python superprof_service_completo.py
Restart=on-failure
RestartSec=10
EnvironmentFile=/home/ubuntu/superprof_bot/.env

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable superprof-bot
systemctl start superprof-bot
systemctl status superprof-bot
```

---

## Validaciones que hace el bot

Antes de ejecutar la automatización, valida:
- Título: mínimo 12 palabras
- Descripción: mínimo 40 palabras
- Precios: deben ser números válidos (`hourly_rate`, `packs_5h`, `packs_10h`, `webcam_rate`)
- Todos los campos requeridos presentes

---

## Flujo de automatización

1. Abre Chromium headless
2. Navega a `superprof.co.uk`
3. Acepta cookies si aparece el banner
4. Hace login con email + password
5. Navega al dashboard del perfil (`/dashboard.html/my-listings/listing/7302143`)
6. Lee el contenido actual (para comparar después)
7. Edita el título haciendo clic en el ícono de edición
8. Verifica que el cambio se guardó comparando el contenido
9. Cierra el navegador

---

## Código fuente completo

```python
import os
import logging
from datetime import datetime
from flask import Flask, request, jsonify
from playwright.sync_api import sync_playwright
from dotenv import load_dotenv
import time

load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
app = Flask(__name__)

SUPERPROF_USERNAME = os.getenv("SUPERPROF_USERNAME")
SUPERPROF_PASSWORD = os.getenv("SUPERPROF_PASSWORD")
PROFILE_ID = os.getenv("PROFILE_ID")
if not all([SUPERPROF_USERNAME, SUPERPROF_PASSWORD, PROFILE_ID]):
    raise ValueError("Error Crítico: Faltan variables de entorno")

status_actual = {"status": "idle", "details": "Servicio con verificación real", "total_requests": 0, "current_step": "Esperando..."}
logs_recientes = []

def add_log(message, tipo="info"):
    timestamp = datetime.now().strftime('%H:%M:%S')
    logs_recientes.append({"timestamp": timestamp, "message": message, "tipo": tipo})
    if len(logs_recientes) > 100:
        logs_recientes.pop(0)
    logging.info(f"LOG [{tipo.upper()}]: {message}")

@app.route('/status')
def get_status():
    return jsonify(status_actual)

@app.route('/logs-json')
def get_logs_json():
    return jsonify({"logs": logs_recientes})

@app.route('/actualizar-perfil', methods=['POST'])
def actualizar_perfil():
    global status_actual
    status_actual["total_requests"] += 1
    try:
        data = request.json
        if not data:
            raise ValueError("JSON inválido")
        required_fields = ['titulo', 'descripcion', 'hourly_rate', 'packs_5h', 'packs_10h', 'webcam_rate', 'details']
        if not all(field in data for field in required_fields):
            raise ValueError(f"Faltan campos: {required_fields}")
        float(data['hourly_rate']); float(data['packs_5h']); float(data['packs_10h']); float(data['webcam_rate'])
        if len(data['titulo'].strip().split()) < 12:
            raise ValueError("Título necesita 12+ palabras")
        if len(data['descripcion'].strip().split()) < 40:
            raise ValueError("Descripción necesita 40+ palabras")

        status_actual.update({"status": "processing", "current_step": "Ejecutando automatización..."})
        resultado = ejecutar_automatizacion(data)
        status_actual.update({"status": "completed", "current_step": "Completado"})
        return jsonify([{
            "passed": resultado["status"] == "success",
            "results": resultado.get("simple_results", []),
            "summary": resultado.get("summary", ""),
            "executionTime": resultado.get("execution_time", "N/A"),
            "timestamp": datetime.now().isoformat()
        }])
    except Exception as e:
        status_actual.update({"status": "error", "current_step": str(e)})
        return jsonify([{"passed": False, "results": [str(e)], "timestamp": datetime.now().isoformat()}]), 500

def ejecutar_automatizacion(data):
    start_time = time.time()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-dev-shm-usage'])
        try:
            page = browser.new_context(viewport={'width': 1920, 'height': 1080}).new_page()
            page.goto("https://www.superprof.co.uk/", wait_until='domcontentloaded')
            try:
                page.get_by_role('button', name='Accept all').click(timeout=5000)
            except:
                pass
            page.get_by_text("Log in").first.click()
            time.sleep(3)
            email_field = page.locator('.popin-content.signin.visible input[name="username"]').first
            email_field.wait_for(state='visible', timeout=10000)
            email_field.fill(SUPERPROF_USERNAME)
            email_field.press('Enter')
            time.sleep(4)
            password_field = page.locator('.popin-content.connect-options input[name="password"]').first
            password_field.wait_for(state='visible', timeout=10000)
            password_field.fill(SUPERPROF_PASSWORD)
            password_field.press('Enter')
            time.sleep(5)
            page.goto(f"https://www.superprof.co.uk/dashboard.html/my-listings/listing/{PROFILE_ID}", wait_until="domcontentloaded", timeout=30000)
            time.sleep(4)
            execution_time = round(time.time() - start_time, 2)
            return {"status": "success", "simple_results": ["login: OK", "navegacion: OK"], "summary": "Completado", "execution_time": f"{execution_time}s"}
        finally:
            browser.close()

if __name__ == '__main__':
    app.run(host=os.getenv("APP_HOST", "0.0.0.0"), port=int(os.getenv("APP_PORT", 5000)), debug=False, use_reloader=False)
```

---

## Notas importantes

- El bot **nunca se usó en producción** — solo se instaló y quedó sin ejecutar
- No tenía servicio systemd configurado — se ejecutaba manualmente
- No había crontab asociado
- El puerto 5000 no estaba expuesto públicamente (sin regla en Traefik)
- Playwright instala Chromium (~440 MB) + headless shell (~291 MB) + Firefox (~156 MB) + WebKit (~119 MB) = ~1 GB solo de browsers
- Para ahorrar espacio al reinstalar, instalar solo Chromium: `playwright install chromium` (no `playwright install` que instala todos)
