#!/usr/bin/env python3
"""
Servidor webhook para GitHub — escucha push a main y ejecuta deploy.sh
Puerto: 9000 (interno, expuesto via Traefik en /webhook/deploy)
"""
import hmac, hashlib, json, subprocess, os
from http.server import HTTPServer, BaseHTTPRequestHandler

SECRET = os.environ.get("GITHUB_WEBHOOK_SECRET", "deploy-secret-2026")

class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/deploy":
            self.send_response(404); self.end_headers(); return

        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)

        # Verificar firma de GitHub
        sig = self.headers.get("X-Hub-Signature-256", "")
        expected = "sha256=" + hmac.new(SECRET.encode(), body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            self.send_response(401); self.end_headers()
            self.wfile.write(b"Unauthorized"); return

        payload = json.loads(body)
        branch = payload.get("ref", "")

        if branch != "refs/heads/main":
            self.send_response(200); self.end_headers()
            self.wfile.write(b"Ignored (not main)"); return

        # Ejecutar deploy en background
        subprocess.Popen(["/root/virtual-tryon/deploy.sh"],
                         stdout=open("/root/deploy.log", "a"),
                         stderr=subprocess.STDOUT)

        self.send_response(200); self.end_headers()
        self.wfile.write(b"Deploy iniciado")

    def log_message(self, fmt, *args):
        pass  # silenciar logs HTTP

if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", 9000), WebhookHandler)
    print("Webhook server en puerto 9000")
    server.serve_forever()
