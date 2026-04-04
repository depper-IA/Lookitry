import os
import paramiko
import time
from dotenv import load_dotenv

load_dotenv("c:/Users/Matt/Lookitry/backend/.env")

HOST = "31.220.18.39"
USER = "root"
PASS = os.getenv("VPS_PASS")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS)

def run(cmd):
    print(f"\n$ {cmd}")
    _, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out: print(out)
    if err: print("[stderr]", err)

print("--- INICIANDO PRUEBA DE ESTRES (BACKEND DOWN) ---")
run("docker stop lookitry-backend")
print("Backend detenido. Esperando 5 segundos...")
time.sleep(5)

# Aqui el frontend deberia estar mostrando el error.tsx si alguien intenta entrar.
# No puedo "ver" el navegador mientras el backend esta caido sin una accion manual, 
# pero puedo confirmar que el backend esta DOWN.

run("docker ps --filter name=lookitry-backend")

print("Reiniciando backend para restaurar servicio...")
run("docker start lookitry-backend")
time.sleep(10)
run("docker ps --filter name=lookitry-backend")

ssh.close()
