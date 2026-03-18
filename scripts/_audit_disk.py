import paramiko, time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', username='root', password='Travis18456916#', timeout=15)

def run(cmd, wait=12):
    chan = ssh.get_transport().open_session()
    chan.exec_command(cmd)
    time.sleep(wait)
    out = b""
    while chan.recv_ready():
        out += chan.recv(65536)
    chan.close()
    return out.decode().strip()

print("=== DISCO TOTAL ===")
print(run("df -h /", wait=4))

print("\n=== TOP 15 DIRECTORIOS MAS PESADOS (desde /) ===")
# Solo 1 nivel de profundidad para no colgarse
print(run("du -sh /* 2>/dev/null | sort -rh | head -15", wait=15))

print("\n=== DENTRO DE /var ===")
print(run("du -sh /var/* 2>/dev/null | sort -rh | head -10", wait=10))

print("\n=== DENTRO DE /var/lib ===")
print(run("du -sh /var/lib/* 2>/dev/null | sort -rh | head -10", wait=10))

print("\n=== DOCKER: overlay2 vs volumes vs containers ===")
print(run("du -sh /var/lib/docker/overlay2 /var/lib/docker/volumes /var/lib/docker/containers /var/lib/docker/buildkit /var/lib/docker/image 2>/dev/null", wait=20))

print("\n=== VOLUMENES DOCKER (nombre y tamaño) ===")
print(run("docker volume ls -q | xargs -I{} sh -c 'echo -n \"{}: \"; docker run --rm -v {}:/vol alpine du -sh /vol 2>/dev/null | cut -f1' 2>/dev/null", wait=30))

print("\n=== IMAGENES DOCKER ===")
print(run('docker images --format "{{.Repository}}:{{.Tag}}  {{.Size}}  {{.ID}}"', wait=5))

print("\n=== CONTENEDORES Y SU TAMAÑO ===")
print(run('docker ps -a --format "{{.Names}}  {{.Status}}  {{.Size}}"', wait=8))

print("\n=== LOGS DE CONTENEDORES (tamaño) ===")
print(run("ls -lh /var/lib/docker/containers/*/$(ls /var/lib/docker/containers/ | head -1)/*-json.log 2>/dev/null | head -5 || find /var/lib/docker/containers -name '*-json.log' -exec ls -lh {} \\; 2>/dev/null | sort -k5 -rh | head -10", wait=10))

print("\n=== /root (archivos grandes) ===")
print(run("du -sh /root/* 2>/dev/null | sort -rh | head -10", wait=10))

print("\n=== ARCHIVOS MAYORES A 100MB EN TODO EL SISTEMA ===")
print(run("find / -xdev -size +100M -exec ls -lh {} \\; 2>/dev/null | sort -k5 -rh | head -20", wait=25))

ssh.close()
print("\n=== FIN AUDITORIA ===")
