import paramiko, time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', username='root', password='Travis18456916#', timeout=15)

def run_fast(cmd, wait=8):
    """Ejecuta un comando y espera 'wait' segundos máximo."""
    chan = ssh.get_transport().open_session()
    chan.exec_command(cmd)
    time.sleep(wait)
    out = b""
    while chan.recv_ready():
        out += chan.recv(4096)
    err = b""
    while chan.recv_stderr_ready():
        err += chan.recv_stderr(4096)
    chan.close()
    return (out + err).decode().strip()

# Paso 1: Truncar logs de contenedores (rápido, libera espacio inmediato)
print("=== Truncando logs de contenedores ===")
print(run_fast("find /var/lib/docker/containers -name '*.log' -exec truncate -s 0 {} \\; 2>&1 && echo OK", wait=10))

# Paso 2: Limpiar /tmp
print("\n=== Limpiando /tmp ===")
print(run_fast("rm -rf /tmp/* && echo OK", wait=5))

# Paso 3: Limpiar journald
print("\n=== Limpiando journald ===")
print(run_fast("journalctl --vacuum-size=30M 2>&1 && echo OK", wait=10))

# Paso 4: apt cache
print("\n=== Limpiando apt cache ===")
print(run_fast("apt-get clean && rm -rf /var/cache/apt/archives/*.deb && echo OK", wait=10))

# Paso 5: Contenedores parados
print("\n=== Contenedores parados ===")
print(run_fast("docker container prune -f 2>&1 && echo OK", wait=15))

# Paso 6: Redes huérfanas
print("\n=== Redes huérfanas ===")
print(run_fast("docker network prune -f 2>&1 && echo OK", wait=10))

# Paso 7: Volúmenes huérfanos
print("\n=== Volúmenes huérfanos ===")
print(run_fast("docker volume prune -f 2>&1 && echo OK", wait=15))

# Paso 8: Build cache (el más pesado — lanzar en background)
print("\n=== Build cache Docker (background) ===")
print(run_fast("docker buildx prune -af > /tmp/buildx_clean.log 2>&1 & echo 'lanzado en background'", wait=3))

# Paso 9: Imágenes sin usar (background)
print("\n=== Imágenes sin usar (background) ===")
print(run_fast("docker image prune -af > /tmp/image_prune.log 2>&1 & echo 'lanzado en background'", wait=3))

# Esperar que terminen los background
print("\n=== Esperando limpieza de imágenes (30s)... ===")
time.sleep(30)

# Ver resultado
print("\n=== Log buildx ===")
print(run_fast("cat /tmp/buildx_clean.log 2>/dev/null | tail -5", wait=5))
print("\n=== Log image prune ===")
print(run_fast("cat /tmp/image_prune.log 2>/dev/null | tail -10", wait=5))

# Disco final
print("\n=== DISCO FINAL ===")
print(run_fast("df -h /", wait=5))

# Listar imágenes que quedan
print("\n=== IMAGENES RESTANTES ===")
print(run_fast('docker images --format "{{.Repository}}:{{.Tag}}  {{.Size}}"', wait=5))

# Contenedores activos
print("\n=== CONTENEDORES ACTIVOS ===")
print(run_fast('docker ps --format "{{.Names}}  {{.Status}}"', wait=5))

ssh.close()
print("\n=== FIN ===")
